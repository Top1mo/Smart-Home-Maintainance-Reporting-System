import { describe, it, expect } from "vitest";
import { validateTransition, canTransition, type TicketStatus } from "../test-helpers";

describe("Tier 2: Boundary Value Analysis — Illegal State Transitions & Invariant Guards", () => {
  it("T2.FSM.1: rejects direct jump from SUBMITTED directly to RESOLVED", () => {
    expect(canTransition("SUBMITTED", "RESOLVED")).toBe(false);
    const res = validateTransition("SUBMITTED", "RESOLVED", { resolution_notes: "Done" });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Illegal state transition");
  });

  it("T2.FSM.2: rejects direct jump from SUBMITTED directly to CLOSED", () => {
    expect(canTransition("SUBMITTED", "CLOSED")).toBe(false);
    const res = validateTransition("SUBMITTED", "CLOSED");
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.3: rejects direct jump from SUBMITTED directly to IN_PROGRESS", () => {
    expect(canTransition("SUBMITTED", "IN_PROGRESS")).toBe(false);
    const res = validateTransition("SUBMITTED", "IN_PROGRESS");
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.4: rejects direct jump from SUBMITTED directly to APPOINTMENT_SCHEDULED", () => {
    expect(canTransition("SUBMITTED", "APPOINTMENT_SCHEDULED")).toBe(false);
    const res = validateTransition("SUBMITTED", "APPOINTMENT_SCHEDULED", {
      appointment_date: "2026-09-10",
    });
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.5: rejects skipping UNDER_REVIEW by jumping SUBMITTED to CONTRACTOR_CONTACTED", () => {
    expect(canTransition("SUBMITTED", "CONTRACTOR_CONTACTED")).toBe(false);
    const res = validateTransition("SUBMITTED", "CONTRACTOR_CONTACTED", {
      contractor_id: "cont_plumb",
    });
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.6: rejects direct jump from UNDER_REVIEW directly to IN_PROGRESS", () => {
    expect(canTransition("UNDER_REVIEW", "IN_PROGRESS")).toBe(false);
    const res = validateTransition("UNDER_REVIEW", "IN_PROGRESS");
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.7: rejects direct jump from UNDER_REVIEW directly to RESOLVED", () => {
    expect(canTransition("UNDER_REVIEW", "RESOLVED")).toBe(false);
    const res = validateTransition("UNDER_REVIEW", "RESOLVED", { resolution_notes: "Fixed" });
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.8: rejects direct jump from UNDER_REVIEW directly to CLOSED", () => {
    expect(canTransition("UNDER_REVIEW", "CLOSED")).toBe(false);
    const res = validateTransition("UNDER_REVIEW", "CLOSED");
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.9: rejects direct jump from CONTRACTOR_CONTACTED directly to RESOLVED", () => {
    expect(canTransition("CONTRACTOR_CONTACTED", "RESOLVED")).toBe(false);
    const res = validateTransition("CONTRACTOR_CONTACTED", "RESOLVED", { resolution_notes: "Fixed" });
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.10: rejects direct jump from CONTRACTOR_CONTACTED directly to CLOSED", () => {
    expect(canTransition("CONTRACTOR_CONTACTED", "CLOSED")).toBe(false);
    const res = validateTransition("CONTRACTOR_CONTACTED", "CLOSED");
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.11: rejects direct jump from APPOINTMENT_SCHEDULED directly to CLOSED", () => {
    expect(canTransition("APPOINTMENT_SCHEDULED", "CLOSED")).toBe(false);
    const res = validateTransition("APPOINTMENT_SCHEDULED", "CLOSED");
    expect(res.valid).toBe(false);
  });

  it("T2.FSM.12: rejects modifying CLOSED ticket to any other status (terminal state immutability)", () => {
    const targetStates: TicketStatus[] = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "CONTRACTOR_CONTACTED",
      "APPOINTMENT_SCHEDULED",
      "IN_PROGRESS",
      "RESOLVED",
      "REJECTED",
    ];

    for (const target of targetStates) {
      expect(canTransition("CLOSED", target)).toBe(false);
      const res = validateTransition("CLOSED", target);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("terminal state CLOSED");
    }
  });

  it("T2.FSM.13: rejects self-transition attempting to transition ticket to its current state", () => {
    const states: TicketStatus[] = ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED"];
    for (const state of states) {
      const res = validateTransition(state, state);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Cannot transition from " + state + " to the same status");
    }
  });

  it("T2.FSM.14: rejects transition with invalid or unknown target status string", () => {
    const res = validateTransition("SUBMITTED", "UNKNOWN_STATUS" as any);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Illegal state transition");
  });
});
