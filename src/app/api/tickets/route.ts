import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeParsePhotos, handleRouteError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const HAZARD_KEYWORD_REGEX =
  /(شرز|فرقعة|شياط|ماس|ماس كهربائي|ريحة غاز|تسريب غاز|مياه في الكهرباء|السقف مقوس|السقف واقع|sparks|arcing|smoke|burning smell|gas leak|gas smell|electrocution|ceiling sag|ceiling collapse)/i;

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const trade = searchParams.get('trade') || searchParams.get('trade_id');
    const severity = searchParams.get('severity');
    const hazard = searchParams.get('hazard');
    const unit = searchParams.get('unit') || searchParams.get('unit_number');
    const query = searchParams.get('q') || searchParams.get('search');
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isNaN(rawLimit) ? 50 : Math.max(1, Math.min(100, rawLimit));
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Number.isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      conditions.push(`t.status IN (${statuses.map(() => '?').join(',')})`);
      params.push(...statuses);
    }

    if (trade) {
      conditions.push('(t.trade_id = ? OR tr.slug = ?)');
      params.push(trade, trade);
    }

    if (severity) {
      conditions.push('(t.severity = ? OR t.urgency = ?)');
      params.push(severity, severity);
    }

    if (hazard === 'true' || hazard === '1') {
      conditions.push('t.is_hazard = 1');
    }

    if (unit) {
      conditions.push('(t.unit_number = ? OR t.unit_id = ?)');
      params.push(unit, unit);
    }

    if (query) {
      conditions.push(`(
        t.id LIKE ? OR
        t.reference_no LIKE ? OR
        t.resident_name LIKE ? OR
        t.resident_phone LIKE ? OR
        t.custom_description LIKE ? OR
        t.description LIKE ? OR
        t.unit_number LIKE ?
      )`);
      const pattern = `%${query}%`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow: any = db
      .prepare(`
        SELECT COUNT(*) as total 
        FROM tickets t 
        LEFT JOIN trades tr ON t.trade_id = tr.id
        ${whereClause}
      `)
      .get(...params);

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
        c.rating AS contractor_rating
      FROM tickets t
      LEFT JOIN trades tr ON t.trade_id = tr.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN fault_symptoms fs ON t.symptom_id = fs.id
      LEFT JOIN contractors c ON t.assigned_contractor_id = c.id
      ${whereClause}
      ORDER BY t.is_hazard DESC, t.created_at DESC, t.id DESC
      LIMIT ? OFFSET ?
    `;

    const rows: any[] = db.prepare(selectSql).all(...params, limit, offset);

    const tickets = rows.map((r) => ({
      ...r,
      is_hazard: Boolean(r.is_hazard),
      photos: safeParsePhotos(r.photos || r.photo_urls),
      photo_urls: safeParsePhotos(r.photo_urls || r.photos),
    }));

    return NextResponse.json({
      tickets,
      total: countRow?.total || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    let {
      property_name,
      property_id,
      unit_number,
      unit_id,
      trade_id,
      subcategory_id,
      symptom_id,
      room_location_en,
      room_location_ar,
      custom_description,
      description,
      resident_name,
      resident_phone,
      photos = [],
      photo_urls,
    } = body;

    const finalDescription = custom_description || description || '';
    const finalPhotos = photo_urls || photos || [];

    // If unit_id provided but not unit_number / resident info, auto-populate from units table
    if (unit_id && (!unit_number || !resident_name || !resident_phone)) {
      const unitRow: any = db.prepare('SELECT * FROM units WHERE id = ?').get(unit_id);
      if (unitRow) {
        unit_number = unit_number || unitRow.unit_number;
        resident_name = resident_name || unitRow.resident_name;
        resident_phone = resident_phone || unitRow.resident_phone;
        property_id = property_id || unitRow.property_id;
      }
    }

    // If property_id provided but not property_name, auto-populate
    if (property_id && !property_name) {
      const propRow: any = db.prepare('SELECT name_en FROM properties WHERE id = ?').get(property_id);
      if (propRow) {
        property_name = propRow.name_en;
      }
    }

    property_name = property_name || 'Palm Hills Heights';

    if (!unit_number || !trade_id || !subcategory_id || !symptom_id || !resident_name || !resident_phone) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: unit_number, trade_id, subcategory_id, symptom_id, resident_name, resident_phone',
        },
        { status: 400 }
      );
    }

    // Validate trade_id
    const tradeRow = db.prepare('SELECT id FROM trades WHERE id = ?').get(trade_id);
    if (!tradeRow) {
      return NextResponse.json({ error: `Trade not found: ${trade_id}` }, { status: 400 });
    }

    // Validate subcategory_id and trade association
    const subcatRow: any = db.prepare('SELECT id, trade_id FROM subcategories WHERE id = ?').get(subcategory_id);
    if (!subcatRow) {
      return NextResponse.json({ error: `Subcategory not found: ${subcategory_id}` }, { status: 400 });
    }
    if (subcatRow.trade_id !== trade_id) {
      return NextResponse.json(
        { error: `Subcategory ${subcategory_id} does not belong to trade ${trade_id}` },
        { status: 400 }
      );
    }

    // Verify symptom and check hazard
    const symptom: any = db.prepare('SELECT * FROM fault_symptoms WHERE id = ?').get(symptom_id);
    if (!symptom) {
      return NextResponse.json({ error: `Invalid symptom_id provided: ${symptom_id}` }, { status: 400 });
    }
    if (symptom.subcategory_id !== subcategory_id) {
      return NextResponse.json(
        { error: `Symptom ${symptom_id} does not belong to subcategory ${subcategory_id}` },
        { status: 400 }
      );
    }

    // Optional foreign key validations
    if (property_id) {
      const propRow = db.prepare('SELECT id FROM properties WHERE id = ?').get(property_id);
      if (!propRow) {
        return NextResponse.json({ error: `Property not found: ${property_id}` }, { status: 400 });
      }
    }

    if (unit_id) {
      const unitRow = db.prepare('SELECT id FROM units WHERE id = ?').get(unit_id);
      if (!unitRow) {
        return NextResponse.json({ error: `Unit not found: ${unit_id}` }, { status: 400 });
      }
    }

    let isHazard = Boolean(symptom.is_hazard);
    if (!isHazard && finalDescription && HAZARD_KEYWORD_REGEX.test(finalDescription)) {
      isHazard = true;
    }

    let severity = body.severity || body.urgency || symptom.default_severity || 'MEDIUM';
    if (isHazard) {
      severity = 'CRITICAL';
    }

    const urgency = severity === 'CRITICAL' ? 'EMERGENCY' : severity === 'HIGH' ? 'HIGH' : severity === 'LOW' ? 'LOW' : 'NORMAL';

    // Generate Next Ticket ID & Reference Number: TKT-2026-XXXX
    const maxRow: any = db
      .prepare(`
        SELECT MAX(CASE 
          WHEN reference_no LIKE 'TKT-2026-%' THEN CAST(SUBSTR(reference_no, 10) AS INTEGER) 
          WHEN id LIKE 'TKT-2026-%' THEN CAST(SUBSTR(id, 10) AS INTEGER) 
          ELSE 0 
        END) as max_num FROM tickets
      `)
      .get();

    const countRow: any = db.prepare('SELECT COUNT(*) as c FROM tickets').get();
    const maxNum = (maxRow?.max_num as number) || 0;
    const countNum = (countRow?.c as number) || 0;
    const nextNumber = Math.max(maxNum, countNum) + 1;
    const ticketId = `TKT-2026-${String(nextNumber).padStart(4, '0')}`;
    const referenceNo = ticketId;

    // Execute in transaction
    db.exec('BEGIN IMMEDIATE;');
    try {
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
        ticketId,
        referenceNo,
        property_id || null,
        property_name,
        unit_id || null,
        unit_number,
        trade_id,
        subcategory_id,
        symptom_id,
        room_location_en || null,
        room_location_ar || null,
        finalDescription,
        finalDescription,
        severity,
        urgency,
        isHazard ? 1 : 0,
        resident_name,
        resident_phone,
        JSON.stringify(finalPhotos),
        JSON.stringify(finalPhotos)
      );

      db.prepare(`
        INSERT INTO ticket_events (
          ticket_id, from_status, to_status, actor_name, actor_role,
          event_type, performed_by, notes, details, created_at
        ) VALUES (
          ?, NULL, 'SUBMITTED', ?, 'RESIDENT',
          'STATUS_CHANGE', ?, 'Fault report submitted by resident', 'Fault report submitted by resident',
          CURRENT_TIMESTAMP
        )
      `).run(ticketId, resident_name, resident_name);

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    const created: any = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    const event: any = db.prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY id DESC LIMIT 1').get(ticketId);

    return NextResponse.json(
      {
        success: true,
        ticket: {
          ...created,
          is_hazard: Boolean(created.is_hazard),
          photos: safeParsePhotos(created.photos || created.photo_urls),
          photo_urls: safeParsePhotos(created.photo_urls || created.photos),
        },
        event,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleRouteError(error);
  }
}
