import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, validateTransition } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 2: Input Validation, Missing Parameters & Guard Violations", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T2.VAL.1: rejects transition to CONTRACTOR_CONTACTED when contractor_id is missing", () => {
    const res = validateTransition("UNDER_REVIEW", "CONTRACTOR_CONTACTED", {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain("contractor_id");
  });

  it("T2.VAL.2: rejects transition to REJECTED when rejection_reason_code is missing", () => {
    const res = validateTransition("UNDER_REVIEW", "REJECTED", {
      rejection_notes: "Missing reason code test",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("rejection_reason_code");
  });

  it("T2.VAL.3: rejects transition to REJECTED when rejection_notes is missing", () => {
    const res = validateTransition("UNDER_REVIEW", "REJECTED", {
      rejection_reason_code: "TENANT_RESPONSIBILITY",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("rejection_notes");
  });

  it("T2.VAL.4: rejects transition to APPOINTMENT_SCHEDULED when appointment_date is missing", () => {
    const res = validateTransition("CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED", {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain("appointment_date");
  });

  it("T2.VAL.5: rejects transition to APPOINTMENT_SCHEDULED when appointment_date is malformed", () => {
    const res = validateTransition("CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED", {
      appointment_date: "not-a-valid-date",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Invalid appointment_date format");
  });

  it("T2.VAL.6: rejects transition to RESOLVED when resolution_notes is missing", () => {
    const res = validateTransition("IN_PROGRESS", "RESOLVED", {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain("resolution_notes");
  });

  it("T2.VAL.7: rejects transition to RESOLVED when resolution_notes is empty or whitespace-only", () => {
    const res = validateTransition("IN_PROGRESS", "RESOLVED", {
      resolution_notes: "   ",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("resolution_notes");
  });

  it("T2.VAL.8: rejects reopening REJECTED ticket to UNDER_REVIEW without reopen_reason", () => {
    const res = validateTransition("REJECTED", "UNDER_REVIEW", {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain("reopen_reason");
  });

  it("T2.VAL.9: rejects reopening RESOLVED ticket to UNDER_REVIEW without reopen_reason", () => {
    const res = validateTransition("RESOLVED", "UNDER_REVIEW", {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain("reopen_reason");
  });

  it("T2.VAL.10: rejects ticket creation with non-existent trade_id via foreign key enforcement", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO tickets (
          id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
          room_location_en, room_location_ar, description, urgency, status
        ) VALUES ('tkt_bad_trade', 'TKT-2026-9901', 'unit_101', 'trade_non_existent', 'sub_plumb_valves', 'sym_plumb_tap', 'Kitchen', 'مطبخ', 'Desc', 'LOW', 'SUBMITTED')
      `).run();
    }).toThrow(/FOREIGN KEY/i);
  });

  it("T2.VAL.11: rejects ticket creation with non-existent subcategory_id via foreign key enforcement", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO tickets (
          id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
          room_location_en, room_location_ar, description, urgency, status
        ) VALUES ('tkt_bad_sub', 'TKT-2026-9902', 'unit_101', 'trade_plumbing', 'sub_non_existent', 'sym_plumb_tap', 'Kitchen', 'مطبخ', 'Desc', 'LOW', 'SUBMITTED')
      `).run();
    }).toThrow(/FOREIGN KEY/i);
  });

  it("T2.VAL.12: rejects ticket creation with non-existent symptom_id via foreign key enforcement", () => {
    expect(() => {
      db.prepare(`
        INSERT INTO tickets (
          id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
          room_location_en, room_location_ar, description, urgency, status
        ) VALUES ('tkt_bad_sym', 'TKT-2026-9903', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_non_existent', 'Kitchen', 'مطبخ', 'Desc', 'LOW', 'SUBMITTED')
      `).run();
    }).toThrow(/FOREIGN KEY/i);
  });
});
