import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Contractor Communications Log & Dispatch Documentation", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.COM.1: logs contractor communication with contact method PHONE", () => {
    const stmt = db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run("tkt_3", "cont_elec", "Dispatcher: Tarek Helmy", "PHONE", "Called Eng. Ibrahim to dispatch emergency tech for smoking panel.");

    const log = db.prepare("SELECT * FROM contractor_communications WHERE ticket_id = 'tkt_3' AND contact_method = 'PHONE'").get() as any;
    expect(log).toBeDefined();
    expect(log.dispatcher_name).toContain("Tarek Helmy");
  });

  it("T1.COM.2: logs contractor communication with contact method WHATSAPP", () => {
    const stmt = db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run("tkt_4", "cont_elv", "Dispatcher: Tarek Helmy", "WHATSAPP", "Sent photos of underground parking CCTV junction box.");

    const log = db.prepare("SELECT * FROM contractor_communications WHERE ticket_id = 'tkt_4' AND contact_method = 'WHATSAPP'").get() as any;
    expect(log).toBeDefined();
    expect(log.contact_method).toBe("WHATSAPP");
    expect(log.notes).toContain("underground parking");
  });

  it("T1.COM.3: logs contractor communication with contact method EMAIL", () => {
    const stmt = db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run("tkt_5", "cont_carp", "Dispatcher: Tarek Helmy", "EMAIL", "Sent formal request for quotation with engineering drawings.");

    const log = db.prepare("SELECT * FROM contractor_communications WHERE ticket_id = 'tkt_5' AND contact_method = 'EMAIL'").get() as any;
    expect(log).toBeDefined();
  });

  it("T1.COM.4: records quote estimate and proposed appointment date in communications entry", () => {
    const stmt = db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes, quote_estimate, proposed_appointment
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run("tkt_4", "cont_elv", "Dispatcher: Tarek Helmy", "PHONE", "Agreed on camera lens replacement fee", 450.0, "2026-09-08 10:00:00");

    const comm = db.prepare("SELECT quote_estimate, proposed_appointment FROM contractor_communications WHERE ticket_id = 'tkt_4'").get() as any;
    expect(comm.quote_estimate).toBe(450.0);
    expect(comm.proposed_appointment).toBe("2026-09-08 10:00:00");
  });

  it("T1.COM.5: retrieves all communications for a ticket in chronological order with contractor details", () => {
    const stmt = db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes
      ) VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run("tkt_1", "cont_elv", "Dispatcher: Tarek", "PHONE", "Initial inquiry");
    stmt.run("tkt_1", "cont_elv", "Dispatcher: Tarek", "WHATSAPP", "Follow-up specs");

    const comms = db.prepare(`
      SELECT c.*, cont.name_en as contractor_name
      FROM contractor_communications c
      JOIN contractors cont ON c.contractor_id = cont.id
      WHERE c.ticket_id = 'tkt_1'
      ORDER BY c.created_at ASC, c.id ASC
    `).all() as any[];

    expect(comms.length).toBe(2);
    expect(comms[0].notes).toBe("Initial inquiry");
    expect(comms[1].notes).toBe("Follow-up specs");
  });
});
