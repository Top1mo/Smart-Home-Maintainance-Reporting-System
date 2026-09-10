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
        COALESCE(t.building_name, u.building_name, 'المبنى الرئيسي') AS building_name,
        u.floor_number AS unit_floor_number,
        COALESCE(t.custom_trade_name, tr.name_en) AS trade_name_en,
        COALESCE(t.custom_trade_name, tr.name_ar) AS trade_name_ar,
        COALESCE(t.custom_trade_name, tr.name_ar) AS trade_ar,
        COALESCE(t.custom_trade_name, tr.name_en) AS trade_en,
        tr.slug AS trade_slug,
        tr.icon AS trade_icon,
        COALESCE(t.custom_subcategory_en, sc.name_en) AS subcategory_name_en,
        COALESCE(t.custom_subcategory_ar, sc.name_ar) AS subcategory_name_ar,
        COALESCE(t.custom_subcategory_ar, sc.name_ar) AS subcategory_ar,
        COALESCE(t.custom_subcategory_en, sc.name_en) AS subcategory_en,
        sc.is_elv AS subcategory_is_elv,
        COALESCE(t.custom_symptom_en, fs.symptom_en) AS symptom_en,
        COALESCE(t.custom_symptom_ar, fs.symptom_ar) AS symptom_ar,
        fs.hazard_type,
        fs.hazard_instruction_en,
        fs.hazard_instruction_ar,
        c.name_en AS contractor_name_en,
        c.name_ar AS contractor_name_ar,
        c.phone AS contractor_phone,
        c.contact_person AS contractor_contact_person,
        c.rating AS contractor_rating
      FROM tickets t
      LEFT JOIN units u ON (t.unit_id = u.id OR t.unit_number = u.unit_number)
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

    let symptom_ar = ticket.symptom_ar;
    let symptom_en = ticket.symptom_en;
    let subcategory_name_ar = ticket.subcategory_name_ar;
    let subcategory_name_en = ticket.subcategory_name_en;
    let trade_ar = ticket.trade_ar;
    let trade_en = ticket.trade_en;

    const desc = ticket.custom_description || ticket.description || '';
    if (!ticket.custom_symptom_ar && (ticket.symptom_id === 'sym_other_custom' || ticket.symptom_id === 'sym_other_general')) {
      const symMatch = desc.match(/\[(?:عطل مخصص|custom fault):\s*([^\]]+)\]/i);
      if (symMatch && symMatch[1]) {
        symptom_ar = symMatch[1].trim();
        symptom_en = symMatch[1].trim();
      }
    }
    if (!ticket.custom_subcategory_ar && (ticket.subcategory_id === 'sub_other_custom' || ticket.subcategory_id === 'sub_other_general')) {
      const subMatch = desc.match(/\[(?:نوع|type):\s*([^\]]+)\]/i);
      if (subMatch && subMatch[1]) {
        subcategory_name_ar = subMatch[1].trim();
        subcategory_name_en = subMatch[1].trim();
      }
    }
    if (!ticket.custom_trade_name && ticket.trade_id === 'trade_other') {
      const tradeMatch = desc.match(/\[(?:تخصص|trade):\s*([^\]]+)\]/i);
      if (tradeMatch && tradeMatch[1]) {
        trade_ar = tradeMatch[1].trim();
        trade_en = tradeMatch[1].trim();
      }
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
        symptom_ar,
        symptom_en,
        subcategory_name_ar,
        subcategory_name_en,
        subcategory_ar: subcategory_name_ar,
        subcategory_en: subcategory_name_en,
        trade_ar,
        trade_en,
        trade_name_ar: trade_ar,
        trade_name_en: trade_en,
        is_hazard: Boolean(ticket.is_hazard),
        parts_needed: Boolean(ticket.parts_needed),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const ticket: any = db
      .prepare('SELECT * FROM tickets WHERE id = ? OR reference_no = ?')
      .get(id, id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const queryParams: any[] = [];

    if (body.parts_needed !== undefined) {
      updates.push('parts_needed = ?');
      queryParams.push(body.parts_needed ? 1 : 0);
    }

    if (body.parts_description !== undefined) {
      updates.push('parts_description = ?');
      queryParams.push(body.parts_description || null);
    }

    if (updates.length > 1) {
      queryParams.push(ticket.id);
      db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...queryParams);
    }

    const updatedTicket: any = db
      .prepare(`
        SELECT 
          t.*,
          COALESCE(t.building_name, u.building_name, 'المبنى الرئيسي') AS building_name,
          u.floor_number AS unit_floor_number,
          tr.name_en AS trade_name_en,
          tr.name_ar AS trade_name_ar,
          tr.name_ar AS trade_ar,
          tr.name_en AS trade_en,
          tr.slug AS trade_slug,
          tr.icon AS trade_icon,
          sc.name_en AS subcategory_name_en,
          sc.name_ar AS subcategory_name_ar,
          sc.name_ar AS subcategory_ar,
          sc.name_en AS subcategory_en,
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
        LEFT JOIN units u ON (t.unit_id = u.id OR t.unit_number = u.unit_number)
        LEFT JOIN trades tr ON t.trade_id = tr.id
        LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
        LEFT JOIN fault_symptoms fs ON t.symptom_id = fs.id
        LEFT JOIN contractors c ON t.assigned_contractor_id = c.id
        WHERE t.id = ?
      `)
      .get(ticket.id);

    return NextResponse.json({
      success: true,
      ticket: {
        ...updatedTicket,
        is_hazard: Boolean(updatedTicket.is_hazard),
        parts_needed: Boolean(updatedTicket.parts_needed),
        photos: safeParsePhotos(updatedTicket.photos || updatedTicket.photo_urls),
        photo_urls: safeParsePhotos(updatedTicket.photo_urls || updatedTicket.photos),
      },
    });
  } catch (error: any) {
    return handleRouteError(error);
  }
}
