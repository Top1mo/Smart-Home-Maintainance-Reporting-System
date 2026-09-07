import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Embedded SQLite Database Engine & Sample Data Seeding", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.SQL.1: initializes complete relational schema with all 9 core tables", () => {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `).all() as any[];

    const tableNames = tables.map((t) => t.name);
    const expected = [
      "contractor_communications",
      "contractors",
      "fault_symptoms",
      "properties",
      "subcategories",
      "ticket_events",
      "tickets",
      "trades",
      "units",
    ];
    for (const exp of expected) {
      expect(tableNames).toContain(exp);
    }
  });

  it("T1.SQL.2: verifies pre-seeded 11-trade taxonomy and subcategories integrity", () => {
    const tradeCount = db.prepare("SELECT COUNT(*) as c FROM trades").get() as any;
    expect(tradeCount.c).toBe(11);

    const subCount = db.prepare("SELECT COUNT(*) as c FROM subcategories").get() as any;
    expect(subCount.c).toBeGreaterThanOrEqual(25);
  });

  it("T1.SQL.3: verifies pre-seeded contractors directory includes ELV security specialist", () => {
    const elvContractor = db.prepare("SELECT * FROM contractors WHERE id = 'cont_elv'").get() as any;
    expect(elvContractor).toBeDefined();
    expect(elvContractor.name_en).toContain("Smart Link");
    expect(elvContractor.trade_id).toBe("trade_electrical");
  });

  it("T1.SQL.4: verifies exactly 13 realistic pre-seeded tickets spanning all 8 lifecycle states", () => {
    const ticketCount = db.prepare("SELECT COUNT(*) as c FROM tickets").get() as any;
    expect(ticketCount.c).toBe(13);

    const distinctStatuses = db.prepare("SELECT DISTINCT status FROM tickets").all() as any[];
    expect(distinctStatuses).toHaveLength(8);
  });

  it("T1.SQL.5: enforces relational foreign key constraints on insert", () => {
    // Attempting to insert a ticket with a non-existent unit_id must throw foreign key constraint violation
    expect(() => {
      db.prepare(`
        INSERT INTO tickets (
          id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
          room_location_en, room_location_ar, description, urgency, status
        ) VALUES ('tkt_bad', 'TKT-2026-9999', 'non_existent_unit', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Kitchen', 'المطبخ', 'Test', 'LOW', 'SUBMITTED')
      `).run();
    }).toThrow(/FOREIGN KEY/i);
  });
});
