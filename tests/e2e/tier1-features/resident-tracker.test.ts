import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Resident My Tickets Tracker & SLA Visibility", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.TRK.1: retrieves all tickets submitted by a specific resident unit", () => {
    const tickets = db.prepare("SELECT * FROM tickets WHERE unit_id = 'unit_101'").all() as any[];
    expect(tickets.length).toBeGreaterThanOrEqual(2);
    const refs = tickets.map((t) => t.reference_no);
    expect(refs).toContain("TKT-2026-0001");
  });

  it("T1.TRK.2: maps 8 lifecycle states to the 5-segment resident progression bar", () => {
    function getStepperProgress(status: string): number {
      switch (status) {
        case "SUBMITTED":
          return 1;
        case "UNDER_REVIEW":
          return 2;
        case "CONTRACTOR_CONTACTED":
        case "APPOINTMENT_SCHEDULED":
          return 3;
        case "IN_PROGRESS":
          return 4;
        case "RESOLVED":
        case "CLOSED":
          return 5;
        case "REJECTED":
          return 0; // Special alert state
        default:
          return 1;
      }
    }

    expect(getStepperProgress("SUBMITTED")).toBe(1);
    expect(getStepperProgress("UNDER_REVIEW")).toBe(2);
    expect(getStepperProgress("APPOINTMENT_SCHEDULED")).toBe(3);
    expect(getStepperProgress("IN_PROGRESS")).toBe(4);
    expect(getStepperProgress("RESOLVED")).toBe(5);
    expect(getStepperProgress("CLOSED")).toBe(5);
    expect(getStepperProgress("REJECTED")).toBe(0);
  });

  it("T1.TRK.3: filters resident tickets into Active vs Resolved vs Closed vs Rejected", () => {
    const active = db.prepare(`
      SELECT * FROM tickets 
      WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', 'IN_PROGRESS')
    `).all() as any[];
    expect(active.length).toBeGreaterThan(0);

    const resolved = db.prepare("SELECT * FROM tickets WHERE status = 'RESOLVED'").all() as any[];
    expect(resolved.length).toBeGreaterThan(0);

    const closed = db.prepare("SELECT * FROM tickets WHERE status = 'CLOSED'").all() as any[];
    expect(closed.length).toBeGreaterThan(0);

    const rejected = db.prepare("SELECT * FROM tickets WHERE status = 'REJECTED'").all() as any[];
    expect(rejected.length).toBeGreaterThan(0);
  });

  it("T1.TRK.4: displays assigned contractor details for scheduled appointments", () => {
    const scheduledTicket = db.prepare(`
      SELECT t.*, c.name_en as contractor_name, c.phone as contractor_phone
      FROM tickets t
      JOIN contractors c ON t.assigned_contractor_id = c.id
      WHERE t.status = 'APPOINTMENT_SCHEDULED'
    `).get() as any;

    expect(scheduledTicket).toBeDefined();
    expect(scheduledTicket.contractor_name).toBeDefined();
    expect(scheduledTicket.appointment_date).toBeDefined();
  });

  it("T1.TRK.5: displays rejection code and explanation when ticket is rejected", () => {
    const rejectedTicket = db.prepare("SELECT * FROM tickets WHERE status = 'REJECTED'").get() as any;
    expect(rejectedTicket).toBeDefined();
    expect(rejectedTicket.rejection_reason_code).toBe("TENANT_RESPONSIBILITY");
    expect(rejectedTicket.rejection_notes).toContain("tenant impact");
  });
});
