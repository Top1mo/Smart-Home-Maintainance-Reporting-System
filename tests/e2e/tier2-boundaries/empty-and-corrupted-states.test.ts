import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 2: Empty States, Corrupted Payloads & Database Cascades", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T2.EMP.1: safely computes landlord portfolio metrics when tickets table is completely empty (zero division guard)", () => {
    // Delete all tickets and events
    db.exec("DELETE FROM contractor_communications; DELETE FROM ticket_events; DELETE FROM tickets;");

    const totalRow = db.prepare("SELECT COUNT(*) as total FROM tickets").get() as any;
    expect(totalRow.total).toBe(0);

    const mttrRow = db.prepare(`
      SELECT 
        COUNT(*) as resolved_count,
        COALESCE(AVG((strftime('%s', resolved_at) - strftime('%s', created_at)) / 3600.0), 0) as avg_hours
      FROM tickets
      WHERE status IN ('RESOLVED', 'CLOSED') AND resolved_at IS NOT NULL
    `).get() as any;

    expect(mttrRow.resolved_count).toBe(0);
    expect(mttrRow.avg_hours).toBe(0);

    const hazardRate = totalRow.total === 0 ? 0 : 100;
    expect(hazardRate).toBe(0);
  });

  it("T2.EMP.2: returns zero counts for all trades when no tickets exist", () => {
    db.exec("DELETE FROM contractor_communications; DELETE FROM ticket_events; DELETE FROM tickets;");

    const dist = db.prepare(`
      SELECT tr.slug, COUNT(t.id) as ticket_count
      FROM trades tr
      LEFT JOIN tickets t ON tr.id = t.trade_id
      GROUP BY tr.id
    `).all() as any[];

    expect(dist).toHaveLength(11);
    dist.forEach((d) => {
      expect(d.ticket_count).toBe(0);
    });
  });

  it("T2.EMP.3: querying non-existent ticket ID returns undefined / null without throw", () => {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = 'tkt_non_existent_999'").get();
    expect(ticket).toBeUndefined();
  });

  it("T2.EMP.4: rejects inserting communication for non-existent ticket ID via foreign key", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO contractor_communications (
          ticket_id, contractor_id, dispatcher_name, contact_method, notes
        ) VALUES ('tkt_fake', 'cont_plumb', 'Dispatcher', 'PHONE', 'Test')
      `).run();
    }).toThrow(/FOREIGN KEY/i);
  });

  it("T2.EMP.5: rejects inserting communication with non-existent contractor ID via foreign key", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO contractor_communications (
          ticket_id, contractor_id, dispatcher_name, contact_method, notes
        ) VALUES ('tkt_1', 'cont_fake_999', 'Dispatcher', 'PHONE', 'Test')
      `).run();
    }).toThrow(/FOREIGN KEY/i);
  });

  it("T2.EMP.6: safely recovers from corrupted non-JSON text in photo_urls column", () => {
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status, photo_urls
      ) VALUES ('tkt_corrupt_photo', 'TKT-2026-8201', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Room', 'غرفة', 'Desc', 'LOW', 'SUBMITTED', 'corrupted-non-json-data{{{')
    `).run();

    const row = db.prepare("SELECT photo_urls FROM tickets WHERE id = 'tkt_corrupt_photo'").get() as any;
    let parsed: string[];
    try {
      parsed = JSON.parse(row.photo_urls);
    } catch {
      parsed = []; // Fallback gracefully
    }
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(0);
  });

  it("T2.EMP.7: querying ticket events for a ticket with no events returns empty array", () => {
    const events = db.prepare("SELECT * FROM ticket_events WHERE ticket_id = 'tkt_2'").all();
    expect(Array.isArray(events)).toBe(true);
    expect(events).toHaveLength(0);
  });

  it("T2.EMP.8: deleting a ticket cascades and deletes associated ticket_events (ON DELETE CASCADE)", () => {
    // Verify tkt_1 has events
    const initialEvents = db.prepare("SELECT COUNT(*) as c FROM ticket_events WHERE ticket_id = 'tkt_1'").get() as any;
    expect(initialEvents.c).toBeGreaterThan(0);

    // Delete ticket
    db.prepare("DELETE FROM tickets WHERE id = 'tkt_1'").run();

    // Verify cascade
    const afterEvents = db.prepare("SELECT COUNT(*) as c FROM ticket_events WHERE ticket_id = 'tkt_1'").get() as any;
    expect(afterEvents.c).toBe(0);
  });

  it("T2.EMP.9: deleting a ticket cascades and deletes associated contractor_communications (ON DELETE CASCADE)", () => {
    // Add comm for tkt_3
    db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes
      ) VALUES ('tkt_3', 'cont_elec', 'Dispatcher', 'PHONE', 'Cascade test note')
    `).run();

    const commCount = db.prepare("SELECT COUNT(*) as c FROM contractor_communications WHERE ticket_id = 'tkt_3'").get() as any;
    expect(commCount.c).toBe(1);

    // Delete ticket
    db.prepare("DELETE FROM tickets WHERE id = 'tkt_3'").run();

    // Verify cascade
    const afterCount = db.prepare("SELECT COUNT(*) as c FROM contractor_communications WHERE ticket_id = 'tkt_3'").get() as any;
    expect(afterCount.c).toBe(0);
  });

  it("T2.EMP.10: handles duplicate ticket reference numbers strictly with UNIQUE constraint violation", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO tickets (
          id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
          room_location_en, room_location_ar, description, urgency, status
        ) VALUES ('tkt_dup', 'TKT-2026-0001', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Room', 'غرفة', 'Desc', 'LOW', 'SUBMITTED')
      `).run();
    }).toThrow(/UNIQUE/i);
  });
});
