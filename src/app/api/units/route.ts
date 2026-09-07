import { NextRequest, NextResponse } from "next/server";
import { getDb, DEFAULT_UNIT_ROOMS } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const units: any[] = db.prepare(`
      SELECT u.*, p.name_en as property_name_en, p.name_ar as property_name_ar
      FROM units u
      LEFT JOIN properties p ON u.property_id = p.id
      ORDER BY u.unit_number ASC
    `).all();

    const mappedUnits = units.map((u) => {
      let rooms: string[] = [];
      try {
        if (u.rooms) {
          rooms = typeof u.rooms === "string" ? JSON.parse(u.rooms) : u.rooms;
        }
      } catch {
        rooms = [];
      }
      if (!Array.isArray(rooms) || rooms.length === 0) {
        rooms = DEFAULT_UNIT_ROOMS;
      }
      return {
        ...u,
        rooms,
      };
    });

    return NextResponse.json({ units: mappedUnits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const {
      unit_number,
      building_name,
      floor_number,
      resident_name,
      resident_phone,
      property_id,
      rooms,
    } = body;

    if (!unit_number || !building_name || !resident_name || !resident_phone) {
      return NextResponse.json(
        { error: "unit_number, building_name, resident_name, and resident_phone are required" },
        { status: 400 }
      );
    }

    const id = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let propId = property_id;
    if (!propId) {
      const firstProp: any = db.prepare("SELECT id FROM properties LIMIT 1").get();
      propId = firstProp ? firstProp.id : "prop_palm";
    }

    let finalRooms = DEFAULT_UNIT_ROOMS;
    if (Array.isArray(rooms) && rooms.length > 0) {
      finalRooms = rooms;
    } else if (typeof rooms === "string") {
      try {
        const parsed = JSON.parse(rooms);
        if (Array.isArray(parsed) && parsed.length > 0) finalRooms = parsed;
      } catch {
        // fallback
      }
    }

    db.prepare(`
      INSERT INTO units (id, property_id, unit_number, building_name, floor_number, resident_name, resident_phone, rooms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      propId,
      unit_number.trim(),
      building_name.trim(),
      parseInt(floor_number, 10) || 1,
      resident_name.trim(),
      resident_phone.trim(),
      JSON.stringify(finalRooms)
    );

    const created: any = db.prepare("SELECT * FROM units WHERE id = ?").get(id);
    if (created && created.rooms) {
      try {
        created.rooms = JSON.parse(created.rooms);
      } catch {
        created.rooms = finalRooms;
      }
    }
    return NextResponse.json({ unit: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create unit" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const {
      id,
      unit_number,
      building_name,
      floor_number,
      resident_name,
      resident_phone,
      rooms,
    } = body;

    if (!id || !unit_number || !building_name || !resident_name || !resident_phone) {
      return NextResponse.json(
        { error: "id, unit_number, building_name, resident_name, and resident_phone are required" },
        { status: 400 }
      );
    }

    const existing: any = db.prepare("SELECT * FROM units WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    let finalRooms = existing.rooms;
    if (Array.isArray(rooms)) {
      finalRooms = JSON.stringify(rooms.length > 0 ? rooms : DEFAULT_UNIT_ROOMS);
    } else if (typeof rooms === "string") {
      finalRooms = rooms;
    }

    db.prepare(`
      UPDATE units
      SET unit_number = ?, building_name = ?, floor_number = ?, resident_name = ?, resident_phone = ?, rooms = ?
      WHERE id = ?
    `).run(
      unit_number.trim(),
      building_name.trim(),
      parseInt(floor_number, 10) || 1,
      resident_name.trim(),
      resident_phone.trim(),
      finalRooms,
      id
    );

    const updated: any = db.prepare("SELECT * FROM units WHERE id = ?").get(id);
    if (updated && updated.rooms) {
      try {
        updated.rooms = JSON.parse(updated.rooms);
      } catch {
        updated.rooms = DEFAULT_UNIT_ROOMS;
      }
    }
    return NextResponse.json({ unit: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update unit" }, { status: 500 });
  }
}
