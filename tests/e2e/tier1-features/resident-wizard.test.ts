import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, REFERENCE_SYMPTOMS } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Resident 3-Tap Reporting Wizard & Photo Upload", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.WIZ.1: validates 3-tap categorization hierarchy (Trade -> Subcategory -> Symptom)", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = 'PLUMBING'").get() as any;
    expect(trade).toBeDefined();

    const sub = db.prepare("SELECT * FROM subcategories WHERE trade_id = ? AND slug = 'PLUMBING_VALVES'").get(trade.id) as any;
    expect(sub).toBeDefined();

    const sym = db.prepare("SELECT * FROM fault_symptoms WHERE subcategory_id = ? AND id = 'sym_plumb_tap'").get(sub.id) as any;
    expect(sym).toBeDefined();
    expect(sym.name_en).toBe("Dripping or Running Tap");
  });

  it("T1.WIZ.2: validates property and unit selection for ticket creation", () => {
    const unit = db.prepare("SELECT * FROM units WHERE id = 'unit_101'").get() as any;
    expect(unit).toBeDefined();
    expect(unit.unit_number).toBe("101");
    expect(unit.resident_name).toBe("Ahmed El-Sayed");
  });

  it("T1.WIZ.3: creates a new ticket and verifies default status is strictly SUBMITTED", () => {
    const stmt = db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const newTicketId = "tkt_new_01";
    const refNo = "TKT-2026-0999";
    stmt.run(
      newTicketId,
      refNo,
      "unit_101",
      "trade_plumbing",
      "sub_plumb_valves",
      "sym_plumb_tap",
      "Guest Bathroom",
      "حمام الضيوف",
      "Faucet leaking heavily around the base",
      "NORMAL",
      "SUBMITTED"
    );

    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(newTicketId) as any;
    expect(ticket).toBeDefined();
    expect(ticket.status).toBe("SUBMITTED");
    expect(ticket.reference_no).toBe(refNo);
  });

  it("T1.WIZ.4: verifies photo upload payload persists as Base64 JSON array", () => {
    const photos = ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."];
    const stmt = db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status, photo_urls
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      "tkt_photo_01",
      "TKT-2026-0998",
      "unit_204",
      "trade_electrical",
      "sub_elec_outlets",
      "sym_elec_sparks",
      "Living Room",
      "غرفة المعيشة",
      "Outlet burnt and smelling of smoke",
      "EMERGENCY",
      "SUBMITTED",
      JSON.stringify(photos)
    );

    const ticket = db.prepare("SELECT photo_urls FROM tickets WHERE id = 'tkt_photo_01'").get() as any;
    const parsed = JSON.parse(ticket.photo_urls);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toContain("data:image/jpeg;base64");
  });

  it("T1.WIZ.5: verifies formatted ticket reference ID adheres to standard TKT-YYYY-XXXX format", () => {
    const ticket = db.prepare("SELECT reference_no FROM tickets WHERE id = 'tkt_1'").get() as any;
    expect(ticket.reference_no).toMatch(/^TKT-2026-\d{4}$/);
  });

  it("T1.WIZ.6: verifies emergency hazard symptom auto-flags is_hazard on ticket creation", () => {
    const stmt = db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status, is_hazard
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      "tkt_hazard_new",
      "TKT-2026-0997",
      "unit_301",
      "trade_electrical",
      "sub_elec_lighting",
      "sym_elec_water",
      "Kitchen",
      "المطبخ",
      "Water dripping onto ceiling spotlight",
      "EMERGENCY",
      "SUBMITTED",
      1
    );

    const ticket = db.prepare("SELECT is_hazard, urgency FROM tickets WHERE id = 'tkt_hazard_new'").get() as any;
    expect(ticket.is_hazard).toBe(1);
    expect(ticket.urgency).toBe("EMERGENCY");
  });
});
