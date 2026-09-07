import { describe, it, expect } from "vitest";
import { validateTransition, canTransition } from "../test-helpers";

describe("Tier 1: 8-Stage Deterministic Lifecycle State Machine", () => {
  it("T1.FSM.1: permits valid transition SUBMITTED -> UNDER_REVIEW", () => {
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    const res = validateTransition("SUBMITTED", "UNDER_REVIEW");
    expect(res.valid).toBe(true);
  });

  it("T1.FSM.2: permits valid transition UNDER_REVIEW -> CONTRACTOR_CONTACTED with contractor_id", () => {
    expect(canTransition("UNDER_REVIEW", "CONTRACTOR_CONTACTED")).toBe(true);
    const res = validateTransition("UNDER_REVIEW", "CONTRACTOR_CONTACTED", {
      contractor_id: "cont_plumb",
    });
    expect(res.valid).toBe(true);
  });

  it("T1.FSM.3: permits valid transition UNDER_REVIEW -> REJECTED with rejection code and notes", () => {
    expect(canTransition("UNDER_REVIEW", "REJECTED")).toBe(true);
    const res = validateTransition("UNDER_REVIEW", "REJECTED", {
      rejection_reason_code: "OUT_OF_SCOPE",
      rejection_notes: "Personal furniture repair not covered by landlord warranty.",
    });
    expect(res.valid).toBe(true);
  });

  it("T1.FSM.4: permits valid transition CONTRACTOR_CONTACTED -> APPOINTMENT_SCHEDULED with valid appointment date", () => {
    expect(canTransition("CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED")).toBe(true);
    const res = validateTransition("CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED", {
      appointment_date: "2026-09-10T10:00:00Z",
    });
    expect(res.valid).toBe(true);
  });

  it("T1.FSM.5: permits valid transition APPOINTMENT_SCHEDULED -> IN_PROGRESS upon contractor on-site arrival", () => {
    expect(canTransition("APPOINTMENT_SCHEDULED", "IN_PROGRESS")).toBe(true);
    const res = validateTransition("APPOINTMENT_SCHEDULED", "IN_PROGRESS");
    expect(res.valid).toBe(true);
  });

  it("T1.FSM.6: permits valid transition IN_PROGRESS -> RESOLVED with required resolution notes", () => {
    expect(canTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
    const res = validateTransition("IN_PROGRESS", "RESOLVED", {
      resolution_notes: "Replaced faulty circuit breaker and tested voltage under load.",
    });
    expect(res.valid).toBe(true);
  });

  it("T1.FSM.7: permits valid transition RESOLVED -> CLOSED upon resident sign-off", () => {
    expect(canTransition("RESOLVED", "CLOSED")).toBe(true);
    const res = validateTransition("RESOLVED", "CLOSED");
    expect(res.valid).toBe(true);
  });

  it("T1.FSM.8: permits valid transition REJECTED -> UNDER_REVIEW upon resident dispute clarification", () => {
    expect(canTransition("REJECTED", "UNDER_REVIEW")).toBe(true);
    const res = validateTransition("REJECTED", "UNDER_REVIEW", {
      reopen_reason: "Resident provided lease addendum proving appliance is landlord fixture.",
    });
    expect(res.valid).toBe(true);
  });
});
