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

    const selectSql = `
      SELECT 
        t.*,
        tr.name_en AS trade_name_en,
        tr.name_ar AS trade_name_ar,
        tr.slug AS trade_slug,
        tr.icon AS trade_icon,
        sc.name_en AS subcategory_name_en,
        sc.name_ar AS subcategory_name_ar,
        sc.is_elv AS subcategory_is_elv,
        fs.symptom_en,
        fs.symptom_ar,
        fs.hazard_type,
        fs.hazard_instruction_en,
        fs.hazard_instruction_ar,
        c.name_en AS contractor_name_en,
        c.name_ar AS contractor_name_ar,
        c.phone AS contractor_phone,
        c.contact_person AS contractor_contact_person,
        c.rating AS contractor_rating
      FROM tickets t
      LEFT JOIN trades tr ON t.trade_id = tr.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN fault_symptoms fs ON t.symptom_id = fs.id
      LEFT JOIN contractors c ON t.assigned_contractor_id = c.id
      WHERE t.id = ? OR t.reference_no = ?
    `;

    const ticket: any = db.prepare(selectSql).get(id, id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const events: any[] = db
      .prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY created_at ASC, id ASC')
      .all(ticket.id);

    const communications: any[] = db
      .prepare(`
        SELECT cc.*, c.name_en AS contractor_name_en, c.name_ar AS contractor_name_ar, c.phone AS contractor_phone
        FROM contractor_communications cc
        LEFT JOIN contractors c ON cc.contractor_id = c.id
        WHERE cc.ticket_id = ?
        ORDER BY cc.created_at ASC, cc.id ASC
      `)
      .all(ticket.id);

    return NextResponse.json({
      ticket: {
        ...ticket,
        is_hazard: Boolean(ticket.is_hazard),
        photos: safeParsePhotos(ticket.photos || ticket.photo_urls),
        photo_urls: safeParsePhotos(ticket.photo_urls || ticket.photos),
        events,
        communications,
      },
    });
  } catch (error: any) {
    return handleRouteError(error);
  }
}
