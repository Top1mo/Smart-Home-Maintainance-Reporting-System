import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateTransitionPayload, TicketStatus, TransitionPayload } from '@/lib/state-machine';
import { safeParsePhotos, handleRouteError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body: TransitionPayload = await request.json();

    const ticket: any = db
      .prepare('SELECT * FROM tickets WHERE id = ? OR reference_no = ?')
      .get(id, id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const toStatus = body.to_status;
    if (!toStatus) {
      return NextResponse.json({ error: 'to_status is required in payload' }, { status: 400 });
    }

    const validation = validateTransitionPayload(ticket.status as TicketStatus, toStatus, body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const contractorId = body.assigned_contractor_id || body.contractor_id;
    if (contractorId) {
      const contractor: any = db.prepare('SELECT id FROM contractors WHERE id = ?').get(contractorId);
      if (!contractor) {
        return NextResponse.json({ error: 'Assigned contractor not found in contractors directory' }, { status: 400 });
      }
    }

    db.exec('BEGIN IMMEDIATE;');
    try {
      const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const queryParams: any[] = [toStatus];

      if (toStatus === 'CONTRACTOR_CONTACTED' && contractorId) {
        updates.push('assigned_contractor_id = ?');
        queryParams.push(contractorId);
      } else if (toStatus === 'APPOINTMENT_SCHEDULED' && body.appointment_date) {
        updates.push('appointment_date = ?');
        queryParams.push(body.appointment_date);
      } else if (toStatus === 'REJECTED') {
        const reason = body.rejection_reason || body.rejection_notes || body.rejection_reason_code || '';
        updates.push('rejection_reason = ?');
        queryParams.push(reason);
        if (body.rejection_reason_code) {
          updates.push('rejection_reason_code = ?');
          queryParams.push(body.rejection_reason_code);
        }
        if (body.rejection_notes) {
          updates.push('rejection_notes = ?');
          queryParams.push(body.rejection_notes);
        }
      } else if (toStatus === 'RESOLVED') {
        if (body.resolution_notes) {
          updates.push('resolution_notes = ?');
          queryParams.push(body.resolution_notes);
        }
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      }

      queryParams.push(ticket.id);
      db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...queryParams);

      const actorName = body.actor_name || 'Dispatcher';
      const actorRole = body.actor_role || 'DISPATCHER';
      const eventNotes =
        body.notes ||
        (toStatus === 'REJECTED'
          ? `Rejected: ${body.rejection_reason || body.rejection_notes}`
          : toStatus === 'RESOLVED'
          ? `Resolved: ${body.resolution_notes}`
          : toStatus === 'APPOINTMENT_SCHEDULED'
          ? `Appointment scheduled: ${body.appointment_date}`
          : toStatus === 'UNDER_REVIEW' && body.reopen_reason
          ? `Reopened: ${body.reopen_reason}`
          : `Transitioned from ${ticket.status} to ${toStatus}`);

      db.prepare(`
        INSERT INTO ticket_events (
          ticket_id, from_status, to_status, actor_name, actor_role,
          event_type, performed_by, notes, details, created_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          'STATUS_CHANGE', ?, ?, ?, CURRENT_TIMESTAMP
        )
      `).run(ticket.id, ticket.status, toStatus, actorName, actorRole, actorName, eventNotes, eventNotes);

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    const updatedTicket: any = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id);
    const newEvent: any = db
      .prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY id DESC LIMIT 1')
      .get(ticket.id);

    return NextResponse.json({
      success: true,
      ticket: {
        ...updatedTicket,
        is_hazard: Boolean(updatedTicket.is_hazard),
        photos: safeParsePhotos(updatedTicket.photos || updatedTicket.photo_urls),
        photo_urls: safeParsePhotos(updatedTicket.photo_urls || updatedTicket.photos),
      },
      event: newEvent,
    });
  } catch (error: any) {
    return handleRouteError(error);
  }
}
