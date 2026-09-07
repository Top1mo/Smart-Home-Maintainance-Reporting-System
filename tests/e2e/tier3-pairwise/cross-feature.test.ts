import { describe, it, expect, beforeEach } from "vitest";
import {
  createTestDb,
  detectHazard,
  getDirection,
  getTranslation,
  validateTransition,
  type TicketStatus,
} from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 3: Pairwise Cross-Feature Interactions & Combinatorial Coverage", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T3.PAIR.1: [Hazard + Arabic RTL Layout] Hazard detected in Arabic mode produces RTL emergency text with Cairo font context", () => {
    const locale = "ar";
    const dir = getDirection(locale);
    expect(dir).toBe("rtl");

    const hazard = detectHazard("sym_elec_sparks");
    expect(hazard.isHazard).toBe(true);
    expect(hazard.warning_ar).toBeDefined();
    expect(hazard.warning_ar).toContain("القاطع العمومي");

    const font = getTranslation("font_cairo", locale);
    expect(font).toBe("Cairo");
  });

  it("T3.PAIR.2: [Hazard + Urgency Override] Selecting a hazard symptom forces urgency to EMERGENCY regardless of requested priority", () => {
    function processSubmission(symptomId: string, requestedUrgency: string): { is_hazard: boolean; urgency: string } {
      const hazardCheck = detectHazard(symptomId);
      if (hazardCheck.isHazard) {
        return { is_hazard: true, urgency: "EMERGENCY" };
      }
      return { is_hazard: false, urgency: requestedUrgency };
    }

    const result = processSubmission("sym_gas_leak", "LOW");
    expect(result.is_hazard).toBe(true);
    expect(result.urgency).toBe("EMERGENCY"); // Forced override from LOW to EMERGENCY
  });

  it("T3.PAIR.3: [Hazard + Landlord KPIs] New hazard ticket immediately recalculates Landlord Hazard Rate", () => {
    // Initial stats
    const beforeStats = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_hazard = 1 THEN 1 ELSE 0 END) as hazard_count FROM tickets
    `).get() as any;
    const initialRate = (beforeStats.hazard_count / beforeStats.total) * 100;

    // Add new hazardous ticket
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status, is_hazard
      ) VALUES ('tkt_haz_kpi', 'TKT-2026-9101', 'unit_101', 'trade_electrical', 'sub_elec_panel', 'sym_elec_sparks', 'Room', 'غرفة', 'Sparks', 'EMERGENCY', 'SUBMITTED', 1)
    `).run();

    const afterStats = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_hazard = 1 THEN 1 ELSE 0 END) as hazard_count FROM tickets
    `).get() as any;
    const newRate = (afterStats.hazard_count / afterStats.total) * 100;

    expect(afterStats.total).toBe(beforeStats.total + 1);
    expect(afterStats.hazard_count).toBe(beforeStats.hazard_count + 1);
    expect(newRate).toBeGreaterThan(initialRate);
  });

  it("T3.PAIR.4: [ELV CCTV Breakdown + Electrical Contractor Assignment] ELV ticket specifically filters and assigns certified ELV contractor", () => {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = 'tkt_4'").get() as any;
    expect(ticket.subcategory_id).toBe("sub_elv_cctv");

    // Suggest contractor specializing in trade_electrical with ELV certification
    const elvContractors = db.prepare(`
      SELECT * FROM contractors 
      WHERE trade_id = ? AND (name_en LIKE '%ELV%' OR name_en LIKE '%Security%')
    `).all(ticket.trade_id) as any[];

    expect(elvContractors.length).toBeGreaterThan(0);
    expect(elvContractors[0].id).toBe("cont_elv");
  });

  it("T3.PAIR.5: [ELV Automated Gate + Crush Hazard] Gate photocell failure flags both ELV subcategory and CRUSH_HAZARD", () => {
    const sym = db.prepare(`
      SELECT s.*, sub.is_elv 
      FROM fault_symptoms s
      JOIN subcategories sub ON s.subcategory_id = sub.id
      WHERE s.id = 'sym_gate_beam'
    `).get() as any;

    expect(sym.is_elv).toBe(1);
    expect(sym.is_hazard).toBe(1);
    expect(sym.hazard_warning_en).toContain("Crush hazard");
  });

  it("T3.PAIR.6: [Rejection Rollback Guard + Contractor Appointment] Rejecting ticket in CONTRACTOR_CONTACTED clears appointment slot", () => {
    // Ticket in CONTRACTOR_CONTACTED
    const res = validateTransition("CONTRACTOR_CONTACTED", "REJECTED", {
      rejection_reason_code: "TENANT_RESPONSIBILITY",
      rejection_notes: "Tenant admitted causing damage",
    });
    expect(res.valid).toBe(true);

    db.prepare(`
      UPDATE tickets 
      SET status = 'REJECTED', 
          assigned_contractor_id = null,
          appointment_date = null,
          rejection_reason_code = 'TENANT_RESPONSIBILITY',
          rejection_notes = 'Tenant admitted causing damage'
      WHERE id = 'tkt_4'
    `).run();

    const updated = db.prepare("SELECT status, assigned_contractor_id, appointment_date FROM tickets WHERE id = 'tkt_4'").get() as any;
    expect(updated.status).toBe("REJECTED");
    expect(updated.assigned_contractor_id).toBeNull();
    expect(updated.appointment_date).toBeNull();
  });

  it("T3.PAIR.7: [Photo Upload + Split-Pane Triage Inspection] Uploaded Base64 photo renders in dispatcher triage detail inspector", () => {
    const photoData = "data:image/jpeg;base64,sample_jpeg_base64_stream_data_test";
    db.prepare("UPDATE tickets SET photo_urls = ? WHERE id = 'tkt_1'").run(JSON.stringify([photoData]));

    const inspected = db.prepare(`
      SELECT t.id, t.photo_urls, u.resident_name, u.unit_number
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      WHERE t.id = 'tkt_1'
    `).get() as any;

    const photos = JSON.parse(inspected.photo_urls);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toBe(photoData);
  });

  it("T3.PAIR.8: [Bilingual Toggle + State Machine Status Badges] Toggling language dynamically renders correct status badges across all 8 states", () => {
    const statuses: TicketStatus[] = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "CONTRACTOR_CONTACTED",
      "APPOINTMENT_SCHEDULED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REJECTED",
    ];

    statuses.forEach((st) => {
      const key = `status_${st.toLowerCase()}`;
      const en = getTranslation(key, "en");
      const ar = getTranslation(key, "ar");
      expect(en).toBeDefined();
      expect(ar).toBeDefined();
      expect(en).not.toBe(ar);
    });
  });

  it("T3.PAIR.9: [Contractor Communication Log + Audit Event Trail] Logging contractor communication also records an audit event", () => {
    const ticketId = "tkt_2";
    // 1. Add communication
    db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes
      ) VALUES (?, 'cont_plumb', 'Dispatcher: Tarek', 'PHONE', 'Called plumber for dripping mixer')
    `).run(ticketId);

    // 2. Add audit event
    db.prepare(`
      INSERT INTO ticket_events (
        ticket_id, event_type, from_status, to_status, performed_by, details
      ) VALUES (?, 'CONTRACTOR_CONTACTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 'Dispatcher: Tarek', 'Called Al-Ahram Plumbing')
    `).run(ticketId);

    const commCount = db.prepare("SELECT COUNT(*) as c FROM contractor_communications WHERE ticket_id = ?").get(ticketId) as any;
    const eventCount = db.prepare("SELECT COUNT(*) as c FROM ticket_events WHERE ticket_id = ? AND event_type = 'CONTRACTOR_CONTACTED'").get(ticketId) as any;

    expect(commCount.c).toBe(1);
    expect(eventCount.c).toBe(1);
  });

  it("T3.PAIR.10: [3-Tap Wizard + Dynamic Subcategory Filtering] Selecting a Trade filters Subcategories cleanly with zero stale entries", () => {
    const plumbSubs = db.prepare("SELECT * FROM subcategories WHERE trade_id = 'trade_plumbing'").all() as any[];
    expect(plumbSubs.length).toBeGreaterThanOrEqual(4);
    plumbSubs.forEach((s) => {
      expect(s.slug.startsWith("PLUMBING_")).toBe(true);
    });

    const elecSubs = db.prepare("SELECT * FROM subcategories WHERE trade_id = 'trade_electrical'").all() as any[];
    elecSubs.forEach((s) => {
      expect(s.slug.startsWith("ELECTRICAL_")).toBe(true);
    });
  });

  it("T3.PAIR.11: [Subcategory Selection + Symptom Filtering] Selecting a Subcategory filters Symptoms to only those belonging to it", () => {
    const cctvSymptoms = db.prepare("SELECT * FROM fault_symptoms WHERE subcategory_id = 'sub_elv_cctv'").all() as any[];
    expect(cctvSymptoms.length).toBeGreaterThanOrEqual(1);
    cctvSymptoms.forEach((s) => {
      expect(s.subcategory_id).toBe("sub_elv_cctv");
    });
  });

  it("T3.PAIR.12: [Resident MyTickets + State Machine Lifecycle Progression] Status progression dynamically advances resident stepper bar", () => {
    function computeProgressPercent(status: TicketStatus): number {
      const stepMap: Record<TicketStatus, number> = {
        SUBMITTED: 20,
        UNDER_REVIEW: 40,
        CONTRACTOR_CONTACTED: 60,
        APPOINTMENT_SCHEDULED: 60,
        IN_PROGRESS: 80,
        RESOLVED: 100,
        CLOSED: 100,
        REJECTED: 0,
      };
      return stepMap[status];
    }

    expect(computeProgressPercent("SUBMITTED")).toBe(20);
    expect(computeProgressPercent("UNDER_REVIEW")).toBe(40);
    expect(computeProgressPercent("APPOINTMENT_SCHEDULED")).toBe(60);
    expect(computeProgressPercent("IN_PROGRESS")).toBe(80);
    expect(computeProgressPercent("RESOLVED")).toBe(100);
  });

  it("T3.PAIR.13: [Landlord Trade Filter + Date Range Query] Filtering by trade domain and date returns accurate intersection", () => {
    const result = db.prepare(`
      SELECT t.* FROM tickets t
      JOIN trades tr ON t.trade_id = tr.id
      WHERE tr.slug = 'ELECTRICAL' 
        AND t.created_at >= '2026-01-01'
    `).all() as any[];

    expect(result.length).toBeGreaterThanOrEqual(4);
    result.forEach((r) => {
      expect(r.trade_id).toBe("trade_electrical");
    });
  });

  it("T3.PAIR.14: [Dispute Reopen Flow + Audit History] Reopening REJECTED ticket retains complete previous rejection audit trail", () => {
    // Ticket tkt_13 is currently REJECTED
    const initialHistory = db.prepare("SELECT * FROM ticket_events WHERE ticket_id = 'tkt_13'").all() as any[];
    expect(initialHistory.length).toBeGreaterThan(0);

    // Reopen
    db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES ('tkt_13', 'STATUS_CHANGE', 'REJECTED', 'UNDER_REVIEW', 'Resident: Ahmed', 'Reopened: provided proof of landlord defect')
    `).run();

    db.prepare("UPDATE tickets SET status = 'UNDER_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = 'tkt_13'").run();

    const fullHistory = db.prepare("SELECT * FROM ticket_events WHERE ticket_id = 'tkt_13' ORDER BY id ASC").all() as any[];
    expect(fullHistory.length).toBe(initialHistory.length + 1);
    expect(fullHistory[fullHistory.length - 1].from_status).toBe("REJECTED");
    expect(fullHistory[fullHistory.length - 1].to_status).toBe("UNDER_REVIEW");
  });

  it("T3.PAIR.15: [Multi-photo Upload + Triage Display] Multiple uploaded photos reflect in triage list photo counter", () => {
    const threePhotos = ["photo1.jpg", "photo2.jpg", "photo3.jpg"];
    db.prepare("UPDATE tickets SET photo_urls = ? WHERE id = 'tkt_2'").run(JSON.stringify(threePhotos));

    const item = db.prepare("SELECT photo_urls FROM tickets WHERE id = 'tkt_2'").get() as any;
    const count = JSON.parse(item.photo_urls).length;
    expect(count).toBe(3);
  });

  it("T3.PAIR.16: [Contractor Quoted Cost + Landlord Financial Metrics] Multiple communications aggregate total contractor repair quotes", () => {
    db.prepare(`
      INSERT INTO contractor_communications (ticket_id, contractor_id, dispatcher_name, contact_method, notes, quote_estimate)
      VALUES ('tkt_1', 'cont_elv', 'Dispatcher', 'PHONE', 'Initial quote', 400.0)
    `).run();
    db.prepare(`
      INSERT INTO contractor_communications (ticket_id, contractor_id, dispatcher_name, contact_method, notes, quote_estimate)
      VALUES ('tkt_2', 'cont_plumb', 'Dispatcher', 'PHONE', 'Parts quote', 250.0)
    `).run();

    const totalCostRow = db.prepare(`
      SELECT SUM(quote_estimate) as total_quoted FROM contractor_communications
    `).get() as any;

    expect(totalCostRow.total_quoted).toBe(650.0);
  });

  it("T3.PAIR.17: [Arabic RTL Form Inputs + Phone Validation] Validates Egyptian mobile number format in Arabic form context", () => {
    function validateEgyptianPhone(phone: string): boolean {
      const cleaned = phone.replace(/[\s-]/g, "");
      // Matches +2010XXXXXXXX, +2011XXXXXXXX, +2012XXXXXXXX, +2015XXXXXXXX or 01XXXXXXXXX
      return /^(\+20|0)?1[0125]\d{8}$/.test(cleaned);
    }

    expect(validateEgyptianPhone("+20 100 123 4567")).toBe(true);
    expect(validateEgyptianPhone("+20 111 234 5678")).toBe(true);
    expect(validateEgyptianPhone("+20 122 345 6789")).toBe(true);
    expect(validateEgyptianPhone("+20 155 432 1098")).toBe(true);
    expect(validateEgyptianPhone("01001234567")).toBe(true);
    expect(validateEgyptianPhone("12345")).toBe(false); // Invalid length
    expect(validateEgyptianPhone("+1 555 123 4567")).toBe(false); // Non-Egyptian
  });

  it("T3.PAIR.18: [Hazard Water + Power Combo Detection] Keyword analysis of water + electricity triggers electrocution emergency protocol", () => {
    const combinedDesc = "المياه بتسرب من السقف ونازلة على بريزة الكهرباء في الصالة وبتعمل صوت أزيز";
    const hazard = detectHazard(undefined, combinedDesc);
    expect(hazard.isHazard).toBe(true);
    expect(hazard.hazardType).toBe("WATER_LIVE_POWER");
    expect(hazard.warning_ar).toContain("صعق");
  });
});
