import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Dispatcher Split-Pane Master-Detail Triage Dashboard", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.DSP.1: retrieves complete dispatcher triage queue with unit and trade metadata", () => {
    const queue = db.prepare(`
      SELECT t.id, t.reference_no, t.status, t.urgency, t.is_hazard,
             u.unit_number, u.building_name, u.resident_name,
             tr.name_en as trade_en, tr.name_ar as trade_ar
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      JOIN trades tr ON t.trade_id = tr.id
      ORDER BY t.created_at DESC
    `).all() as any[];

    expect(queue.length).toBeGreaterThanOrEqual(13);
    expect(queue[0].unit_number).toBeDefined();
    expect(queue[0].trade_en).toBeDefined();
  });

  it("T1.DSP.2: filters triage queue by specific trade domain (e.g. Electrical)", () => {
    const elecTickets = db.prepare(`
      SELECT t.* FROM tickets t
      JOIN trades tr ON t.trade_id = tr.id
      WHERE tr.slug = 'ELECTRICAL'
    `).all() as any[];

    expect(elecTickets.length).toBeGreaterThanOrEqual(3);
    elecTickets.forEach((t) => {
      expect(t.trade_id).toBe("trade_electrical");
    });
  });

  it("T1.DSP.3: sorts queue prioritizing hazard-flagged and EMERGENCY urgency tickets", () => {
    const prioritized = db.prepare(`
      SELECT id, reference_no, urgency, is_hazard
      FROM tickets
      WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')
      ORDER BY is_hazard DESC, 
               CASE urgency 
                 WHEN 'EMERGENCY' THEN 1 
                 WHEN 'HIGH' THEN 2 
                 WHEN 'NORMAL' THEN 3 
                 ELSE 4 
               END ASC
    `).all() as any[];

    expect(prioritized.length).toBeGreaterThan(0);
    // The first item should be a hazard / emergency
    expect(prioritized[0].is_hazard).toBe(1);
    expect(prioritized[0].urgency).toBe("EMERGENCY");
  });

  it("T1.DSP.4: inspects detail workspace payload with room location, description, and photos", () => {
    const detail = db.prepare(`
      SELECT t.*, u.resident_name, u.resident_phone, u.unit_number,
             s.name_en as symptom_en, s.name_ar as symptom_ar
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      JOIN fault_symptoms s ON t.symptom_id = s.id
      WHERE t.id = 'tkt_3'
    `).get() as any;

    expect(detail).toBeDefined();
    expect(detail.resident_phone).toBe("+20 122 345 6789");
    expect(detail.room_location_en).toBe("Hallway Panel");
    expect(detail.description).toContain("sparks");
  });

  it("T1.DSP.5: records immutable audit event upon dispatcher state transition", () => {
    const insertEvent = db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run("tkt_1", "STATUS_CHANGE", "SUBMITTED", "UNDER_REVIEW", "Dispatcher: Tarek Helmy", "Dispatcher started triage inspection");

    const updateTicket = db.prepare("UPDATE tickets SET status = 'UNDER_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    updateTicket.run("tkt_1");

    const updated = db.prepare("SELECT status FROM tickets WHERE id = 'tkt_1'").get() as any;
    expect(updated.status).toBe("UNDER_REVIEW");

    const events = db.prepare("SELECT * FROM ticket_events WHERE ticket_id = 'tkt_1' ORDER BY id DESC").all() as any[];
    expect(events[0].to_status).toBe("UNDER_REVIEW");
    expect(events[0].performed_by).toContain("Dispatcher");
  });

  it("T1.DSP.6: verifies complete chronological audit history retrieval for a ticket", () => {
    const events = db.prepare("SELECT * FROM ticket_events WHERE ticket_id = 'tkt_1' ORDER BY created_at ASC, id ASC").all() as any[];
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].event_type).toBe("STATUS_CHANGE");
  });
});
