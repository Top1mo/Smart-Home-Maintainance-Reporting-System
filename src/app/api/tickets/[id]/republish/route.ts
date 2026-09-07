import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const ticket: any = db
      .prepare("SELECT * FROM tickets WHERE id = ? OR reference_no = ?")
      .get(id, id);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const newId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const year = new Date().getFullYear();
    const countRow: any = db.prepare("SELECT COUNT(*) as count FROM tickets").get();
    const refNum = String((countRow?.count || 0) + 1).padStart(4, "0");
    const newRefNo = `TKT-${year}-${refNum}`;

    const republishNote = body.notes || "إعادة نشر البلاغ للمتابعة الميدانية";
    const newDesc = ticket.custom_description || ticket.description || "";
    const appendedDesc = `[إعادة نشر من بلاغ سابق #${ticket.reference_no || ticket.id}] ${newDesc}`.trim();

    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, property_id, property_name, unit_id, unit_number,
        trade_id, subcategory_id, symptom_id, room_location_en, room_location_ar,
        custom_description, description, severity, urgency, is_hazard, status,
        resident_name, resident_phone, photos, photo_urls, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, 'SUBMITTED',
        ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `).run(
      newId,
      newRefNo,
      ticket.property_id,
      ticket.property_name,
      ticket.unit_id,
      ticket.unit_number,
      ticket.trade_id,
      ticket.subcategory_id,
      ticket.symptom_id,
      ticket.room_location_en,
      ticket.room_location_ar,
      appendedDesc,
      appendedDesc,
      ticket.severity || "MEDIUM",
      ticket.urgency || "NORMAL",
      ticket.is_hazard ? 1 : 0,
      ticket.resident_name,
      ticket.resident_phone,
      ticket.photos || "[]",
      ticket.photo_urls || "[]"
    );

    db.prepare(`
      INSERT INTO ticket_events (
        ticket_id, from_status, to_status, actor_name, actor_role,
        event_type, performed_by, notes, details, created_at
      ) VALUES (
        ?, NULL, 'SUBMITTED', ?, 'DISPATCHER',
        'STATUS_CHANGE', ?, ?, ?, CURRENT_TIMESTAMP
      )
    `).run(
      newId,
      body.actor_name || "Dispatcher",
      body.actor_name || "Dispatcher",
      republishNote,
      `Republished from ticket ${ticket.reference_no || ticket.id}`
    );

    const created = db.prepare("SELECT * FROM tickets WHERE id = ?").get(newId);
    return NextResponse.json({ ticket: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to republish ticket" }, { status: 500 });
  }
}
