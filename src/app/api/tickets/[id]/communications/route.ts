import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeParsePhotos, handleRouteError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const ticket: any = db.prepare('SELECT id FROM tickets WHERE id = ? OR reference_no = ?').get(id, id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const communications: any[] = db
      .prepare(`
        SELECT cc.*, c.name_en AS contractor_name_en, c.name_ar AS contractor_name_ar, c.phone AS contractor_phone
        FROM contractor_communications cc
        LEFT JOIN contractors c ON cc.contractor_id = c.id
        WHERE cc.ticket_id = ?
        ORDER BY cc.created_at ASC, cc.id ASC
      `)
      .all(ticket.id);

    return NextResponse.json({ communications });
  } catch (error: any) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const {
      contractor_id,
      dispatcher_name = 'Dispatcher',
      contact_method,
      notes,
      quote_estimate,
      quoted_cost,
      proposed_appointment,
      scheduled_slot,
      is_internal_only = false,
      auto_advance_status = false,
    } = body;

    const finalQuote = quote_estimate !== undefined ? quote_estimate : quoted_cost !== undefined ? quoted_cost : null;
    const finalSlot = proposed_appointment || scheduled_slot || null;

    if (!contractor_id || !contact_method || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields: contractor_id, contact_method, notes' },
        { status: 400 }
      );
    }

    const ALLOWED_CONTACT_METHODS = ['PHONE', 'WHATSAPP', 'EMAIL', 'IN_PERSON'];
    if (!ALLOWED_CONTACT_METHODS.includes(contact_method)) {
      return NextResponse.json(
        { error: `Invalid contact_method: ${contact_method}. Must be one of: ${ALLOWED_CONTACT_METHODS.join(', ')}` },
        { status: 400 }
      );
    }

    if (finalQuote !== null && finalQuote !== undefined) {
      const numQuote = Number(finalQuote);
      if (isNaN(numQuote) || numQuote < 0) {
        return NextResponse.json(
          { error: 'Quote amount cannot be negative or invalid number' },
          { status: 400 }
        );
      }
    }

    const ticket: any = db.prepare('SELECT * FROM tickets WHERE id = ? OR reference_no = ?').get(id, id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const contractor: any = db.prepare('SELECT * FROM contractors WHERE id = ?').get(contractor_id);
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 400 });
    }

    db.exec('BEGIN IMMEDIATE;');
    let insertedCommId: number | bigint = 0;
    try {
      const commResult = db.prepare(`
        INSERT INTO contractor_communications (
          ticket_id, contractor_id, dispatcher_name, contact_method,
          notes, quote_estimate, quoted_cost, proposed_appointment, scheduled_slot,
          is_internal_only, created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, CURRENT_TIMESTAMP
        )
      `).run(
        ticket.id,
        contractor_id,
        dispatcher_name,
        contact_method,
        notes,
        finalQuote,
        finalQuote,
        finalSlot,
        finalSlot,
        is_internal_only ? 1 : 0
      );

      insertedCommId = commResult.lastInsertRowid;

      const eventNote = `Contractor communication logged with ${contractor.name_en} (${contact_method})${finalQuote ? ` - Quoted: ${finalQuote} EGP` : ''}`;

      const shouldAdvance = auto_advance_status && ticket.status === 'UNDER_REVIEW';
      const targetStatus = shouldAdvance ? 'CONTRACTOR_CONTACTED' : ticket.status;

      db.prepare(`
        INSERT INTO ticket_events (
          ticket_id, from_status, to_status, actor_name, actor_role,
          event_type, performed_by, notes, details, created_at
        ) VALUES (
          ?, ?, ?, ?, 'DISPATCHER',
          'CONTRACTOR_CONTACTED', ?, ?, ?, CURRENT_TIMESTAMP
        )
      `).run(ticket.id, ticket.status, targetStatus, dispatcher_name, dispatcher_name, eventNote, eventNote);

      if (shouldAdvance) {
        db.prepare(`
          UPDATE tickets
          SET status = 'CONTRACTOR_CONTACTED', assigned_contractor_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(contractor_id, ticket.id);
      } else if (!ticket.assigned_contractor_id) {
        db.prepare('UPDATE tickets SET assigned_contractor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(contractor_id, ticket.id);
      }

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    const communication = db.prepare('SELECT * FROM contractor_communications WHERE id = ?').get(insertedCommId);
    const updatedTicket: any = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id);

    return NextResponse.json(
      {
        success: true,
        communication,
        ticket: {
          ...updatedTicket,
          is_hazard: Boolean(updatedTicket.is_hazard),
          photos: safeParsePhotos(updatedTicket.photos || updatedTicket.photo_urls),
          photo_urls: safeParsePhotos(updatedTicket.photo_urls || updatedTicket.photos),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleRouteError(error);
  }
}
