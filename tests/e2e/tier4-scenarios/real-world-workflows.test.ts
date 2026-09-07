import { describe, it, expect, beforeEach } from "vitest";
import {
  createTestDb,
  detectHazard,
  getDirection,
  validateTransition,
  type TicketStatus,
} from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 4: Real-World Application Scenarios & End-to-End User Workflows", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T4.SCN.1: [Scenario 1: Resident Reports Electrical Spark in Egyptian Arabic] Complete resident reporting workflow with hazard alert, Arabic RTL layout, and photo upload", () => {
    // 1. Resident selects Egyptian Arabic locale
    const locale = "ar";
    const dir = getDirection(locale);
    expect(dir).toBe("rtl");

    // 2. 3-Tap Categorization: Electrical -> Distribution Board -> Sparks
    const trade = db.prepare("SELECT * FROM trades WHERE slug = 'ELECTRICAL'").get() as any;
    expect(trade.name_ar).toBe("كهرباء");

    const sub = db.prepare("SELECT * FROM subcategories WHERE trade_id = ? AND slug = 'ELECTRICAL_PANEL'").get(trade.id) as any;
    expect(sub.name_ar).toBe("لوحات التوزيع والقواطع");

    const symptom = db.prepare("SELECT * FROM fault_symptoms WHERE subcategory_id = ? AND id = 'sym_elec_sparks'").get(sub.id) as any;
    expect(symptom.name_ar).toBe("شرز كهربائي أو فرقعة نارية من لوحة القواطع");

    // 3. Immediate Hazard Warning Trigger
    const hazard = detectHazard(symptom.id, "شرز كهربائي وفرقعة قوية");
    expect(hazard.isHazard).toBe(true);
    expect(hazard.hazardType).toBe("ELECTRICAL_FIRE");
    expect(hazard.warning_ar).toContain("القاطع العمومي");

    // 4. Resident inputs property/unit and uploads photo
    const unit = db.prepare("SELECT * FROM units WHERE unit_number = '301'").get() as any;
    expect(unit).toBeDefined();

    const photoPayload = JSON.stringify(["data:image/jpeg;base64,resident_electrical_spark_photo_sample"]);

    // 5. Submit fault report
    const newRef = "TKT-2026-1001";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status, is_hazard, photo_urls
      ) VALUES ('tkt_scn1', ?, ?, ?, ?, ?, 'Living Room Panel', 'لوحة الصالة الرئيسية', 'شرز كهربائي مستمر مع رائحة احتراق بلاستيك', 'EMERGENCY', 'SUBMITTED', 1, ?)
    `).run(newRef, unit.id, trade.id, sub.id, symptom.id, photoPayload);

    // 6. Record creation event
    db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES ('tkt_scn1', 'STATUS_CHANGE', null, 'SUBMITTED', 'Resident: ' || ?, 'New emergency electrical report submitted in Arabic')
    `).run(unit.resident_name);

    // Verify submitted ticket state
    const createdTicket = db.prepare("SELECT * FROM tickets WHERE id = 'tkt_scn1'").get() as any;
    expect(createdTicket.reference_no).toBe(newRef);
    expect(createdTicket.status).toBe("SUBMITTED");
    expect(createdTicket.is_hazard).toBe(1);
    expect(createdTicket.urgency).toBe("EMERGENCY");
    expect(JSON.parse(createdTicket.photo_urls)).toHaveLength(1);
  });

  it("T4.SCN.2: [Scenario 2: Dispatcher Triages Hazardous Leak & Dispatches Plumber via WhatsApp] Master-detail triage, WhatsApp communication logging, and appointment scheduling", () => {
    // 1. Dispatcher inspects incoming triage queue
    const topHazard = db.prepare(`
      SELECT t.*, u.resident_name, u.resident_phone, u.unit_number
      FROM tickets t
      JOIN units u ON t.unit_id = u.id
      WHERE t.is_hazard = 1 AND t.status = 'UNDER_REVIEW'
      LIMIT 1
    `).get() as any;

    expect(topHazard).toBeDefined();

    // 2. Dispatcher reviews ticket and contacts contractor Al-Ahram Plumbing
    const plumber = db.prepare("SELECT * FROM contractors WHERE id = 'cont_plumb'").get() as any;
    expect(plumber).toBeDefined();

    // 3. Log WhatsApp communication with quotation and visit slot
    db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes, quote_estimate, proposed_appointment
      ) VALUES (?, ?, 'Dispatcher: Mostafa', 'WHATSAPP', 'Sent photos of water heater leak; plumber confirmed arrival within 1 hour', 350.0, '2026-09-06 20:00:00')
    `).run(topHazard.id, plumber.id);

    // 4. Transition status: UNDER_REVIEW -> CONTRACTOR_CONTACTED
    const step1 = validateTransition(topHazard.status, "CONTRACTOR_CONTACTED", {
      contractor_id: plumber.id,
    });
    expect(step1.valid).toBe(true);

    db.prepare(`
      UPDATE tickets 
      SET status = 'CONTRACTOR_CONTACTED', assigned_contractor_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(plumber.id, topHazard.id);

    db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES (?, 'CONTRACTOR_CONTACTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 'Dispatcher: Mostafa', 'Assigned Al-Ahram Plumbing via WhatsApp')
    `).run(topHazard.id);

    // 5. Transition status: CONTRACTOR_CONTACTED -> APPOINTMENT_SCHEDULED
    const step2 = validateTransition("CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED", {
      appointment_date: "2026-09-06 20:00:00",
    });
    expect(step2.valid).toBe(true);

    db.prepare(`
      UPDATE tickets 
      SET status = 'APPOINTMENT_SCHEDULED', appointment_date = '2026-09-06 20:00:00', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(topHazard.id);

    db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES (?, 'APPOINTMENT_SET', 'CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', 'Dispatcher: Mostafa', 'Scheduled appointment for 20:00')
    `).run(topHazard.id);

    // Verify ticket and comms audit
    const updated = db.prepare("SELECT * FROM tickets WHERE id = ?").get(topHazard.id) as any;
    expect(updated.status).toBe("APPOINTMENT_SCHEDULED");
    expect(updated.assigned_contractor_id).toBe("cont_plumb");

    const comms = db.prepare("SELECT * FROM contractor_communications WHERE ticket_id = ?").all(topHazard.id) as any[];
    expect(comms.length).toBeGreaterThanOrEqual(1);
    expect(comms[0].contact_method).toBe("WHATSAPP");
    expect(comms[0].quote_estimate).toBe(350.0);
  });

  it("T4.SCN.3: [Scenario 3: Landlord Inspects Portfolio Health & Filter by Trade] Dashboard summary KPI analysis, MTTR, and HVAC drill-down", () => {
    // 1. Overall portfolio volume and active tickets
    const volumeRow = db.prepare("SELECT COUNT(*) as total FROM tickets").get() as any;
    expect(volumeRow.total).toBe(13);

    const activeRow = db.prepare(`
      SELECT COUNT(*) as active FROM tickets 
      WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', 'IN_PROGRESS')
    `).get() as any;
    expect(activeRow.active).toBe(9);

    // 2. Mean Time To Resolution (MTTR) in hours
    const mttrRow = db.prepare(`
      SELECT AVG((strftime('%s', resolved_at) - strftime('%s', created_at)) / 3600.0) as avg_mttr_hours
      FROM tickets 
      WHERE status IN ('RESOLVED', 'CLOSED') AND resolved_at IS NOT NULL
    `).get() as any;
    expect(mttrRow.avg_mttr_hours).toBeDefined();

    // 3. Trade Distribution Breakdown
    const tradeDist = db.prepare(`
      SELECT tr.slug, tr.name_en, tr.name_ar, COUNT(t.id) as count
      FROM trades tr
      LEFT JOIN tickets t ON tr.id = t.trade_id
      GROUP BY tr.id
      ORDER BY count DESC
    `).all() as any[];
    expect(tradeDist.length).toBe(11);

    // 4. Drill-down into HVAC trade
    const hvacTickets = db.prepare(`
      SELECT t.*, u.building_name, u.unit_number 
      FROM tickets t
      JOIN trades tr ON t.trade_id = tr.id
      JOIN units u ON t.unit_id = u.id
      WHERE tr.slug = 'HVAC'
    `).all() as any[];

    expect(hvacTickets.length).toBeGreaterThan(0);
    hvacTickets.forEach((t) => {
      expect(t.trade_id).toBe("trade_hvac");
    });
  });

  it("T4.SCN.4: [Scenario 4: Complete Lifecycle of CCTV Intercom Breakdown to Resolution] Full 7-step lifecycle progression from SUBMITTED through CLOSED", () => {
    const ticketId = "tkt_full_cycle";

    // Step 1: SUBMITTED
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES (?, 'TKT-2026-1004', 'unit_101', 'trade_electrical', 'sub_elv_intercom', 'sym_intercom_dead', 'Entrance', 'المدخل', 'Intercom outdoor station buzzer dead', 'HIGH', 'SUBMITTED')
    `).run(ticketId);

    // Step 2: SUBMITTED -> UNDER_REVIEW
    expect(validateTransition("SUBMITTED", "UNDER_REVIEW").valid).toBe(true);
    db.prepare("UPDATE tickets SET status = 'UNDER_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticketId);
    db.prepare("INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details) VALUES (?, 'STATUS_CHANGE', 'SUBMITTED', 'UNDER_REVIEW', 'Dispatcher', 'Started review')").run(ticketId);

    // Step 3: UNDER_REVIEW -> CONTRACTOR_CONTACTED
    expect(validateTransition("UNDER_REVIEW", "CONTRACTOR_CONTACTED", { contractor_id: "cont_elv" }).valid).toBe(true);
    db.prepare("UPDATE tickets SET status = 'CONTRACTOR_CONTACTED', assigned_contractor_id = 'cont_elv', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticketId);
    db.prepare("INSERT INTO contractor_communications (ticket_id, contractor_id, dispatcher_name, contact_method, notes, quote_estimate) VALUES (?, 'cont_elv', 'Dispatcher', 'PHONE', 'Called Smart Link ELV', 500.0)").run(ticketId);
    db.prepare("INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details) VALUES (?, 'CONTRACTOR_CONTACTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 'Dispatcher', 'Assigned Smart Link ELV')").run(ticketId);

    // Step 4: CONTRACTOR_CONTACTED -> APPOINTMENT_SCHEDULED
    expect(validateTransition("CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED", { appointment_date: "2026-09-08 14:00:00" }).valid).toBe(true);
    db.prepare("UPDATE tickets SET status = 'APPOINTMENT_SCHEDULED', appointment_date = '2026-09-08 14:00:00', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticketId);
    db.prepare("INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details) VALUES (?, 'APPOINTMENT_SET', 'CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', 'Dispatcher', 'Scheduled visit')").run(ticketId);

    // Step 5: APPOINTMENT_SCHEDULED -> IN_PROGRESS
    expect(validateTransition("APPOINTMENT_SCHEDULED", "IN_PROGRESS").valid).toBe(true);
    db.prepare("UPDATE tickets SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticketId);
    db.prepare("INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details) VALUES (?, 'STATUS_CHANGE', 'APPOINTMENT_SCHEDULED', 'IN_PROGRESS', 'Contractor: Smart Link', 'Commenced on-site repairs')").run(ticketId);

    // Step 6: IN_PROGRESS -> RESOLVED
    const resolutionNote = "Replaced 12V DC power transformer and calibrated electric magnetic strike";
    expect(validateTransition("IN_PROGRESS", "RESOLVED", { resolution_notes: resolutionNote }).valid).toBe(true);
    db.prepare("UPDATE tickets SET status = 'RESOLVED', resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(resolutionNote, ticketId);
    db.prepare("INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details) VALUES (?, 'STATUS_CHANGE', 'IN_PROGRESS', 'RESOLVED', 'Contractor: Smart Link', ?)").run(ticketId, resolutionNote);

    // Step 7: RESOLVED -> CLOSED
    expect(validateTransition("RESOLVED", "CLOSED").valid).toBe(true);
    db.prepare("UPDATE tickets SET status = 'CLOSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticketId);
    db.prepare("INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details) VALUES (?, 'STATUS_CHANGE', 'RESOLVED', 'CLOSED', 'Resident: Ahmed', 'Resident confirmed and signed off')").run(ticketId);

    // Verify final state and complete audit event history
    const finalTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId) as any;
    expect(finalTicket.status).toBe("CLOSED");
    expect(finalTicket.resolved_at).toBeDefined();
    expect(finalTicket.resolution_notes).toBe(resolutionNote);

    const history = db.prepare("SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY id ASC").all(ticketId) as any[];
    expect(history).toHaveLength(6);
    expect(history[0].to_status).toBe("UNDER_REVIEW");
    expect(history[history.length - 1].to_status).toBe("CLOSED");
  });

  it("T4.SCN.5: [Scenario 5: Resident Dispute / Rejection Flow with Mandatory Reason] Dispatcher rejects tenant-caused damage, resident disputes, ticket reopens to UNDER_REVIEW", () => {
    const ticketId = "tkt_dispute_flow";

    // Resident submits ticket for broken window
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES (?, 'TKT-2026-1005', 'unit_101', 'trade_aluminum', 'sub_alum_glass', 'sym_glass_crack', 'Balcony', 'البلكونة', 'Glass broken after storm', 'HIGH', 'SUBMITTED')
    `).run(ticketId);

    // Dispatcher reviews ticket
    db.prepare("UPDATE tickets SET status = 'UNDER_REVIEW' WHERE id = ?").run(ticketId);

    // Dispatcher inspects: discovers resident hit window with heavy chair (tenant negligence)
    // Dispatcher rejects ticket with mandatory code and explanatory notes
    const rejectionCheck = validateTransition("UNDER_REVIEW", "REJECTED", {
      rejection_reason_code: "TENANT_RESPONSIBILITY",
      rejection_notes: "Physical impact crack caused by resident moving heavy furniture, outside structural warranty.",
    });
    expect(rejectionCheck.valid).toBe(true);

    db.prepare(`
      UPDATE tickets 
      SET status = 'REJECTED', 
          rejection_reason_code = 'TENANT_RESPONSIBILITY',
          rejection_notes = 'Physical impact crack caused by resident moving heavy furniture, outside structural warranty.',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ticketId);

    db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES (?, 'REJECTED', 'UNDER_REVIEW', 'REJECTED', 'Dispatcher: Tarek', 'Rejected as Tenant Responsibility')
    `).run(ticketId);

    // Resident reviews rejection in "My Tickets" and files a dispute clarification
    const disputeNote = "Resident clarified: Storm wind slammed unsecured shutter into glass; CCTV footage submitted as proof";
    const reopenCheck = validateTransition("REJECTED", "UNDER_REVIEW", {
      reopen_reason: disputeNote,
    });
    expect(reopenCheck.valid).toBe(true);

    db.prepare(`
      UPDATE tickets 
      SET status = 'UNDER_REVIEW', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ticketId);

    db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES (?, 'STATUS_CHANGE', 'REJECTED', 'UNDER_REVIEW', 'Resident: Ahmed', ?)
    `).run(ticketId, disputeNote);

    const reOpenedTicket = db.prepare("SELECT status FROM tickets WHERE id = ?").get(ticketId) as any;
    expect(reOpenedTicket.status).toBe("UNDER_REVIEW");

    const auditTrail = db.prepare("SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY id ASC").all(ticketId) as any[];
    expect(auditTrail.some((e) => e.event_type === "REJECTED")).toBe(true);
    expect(auditTrail[auditTrail.length - 1].to_status).toBe("UNDER_REVIEW");
  });

  it("T4.SCN.6: [Scenario 6: End-to-End Bilingual Multi-Persona Compound Day-in-the-Life] Simultaneous English and Arabic resident reports, dispatcher triage, and real-time landlord metrics update", () => {
    // 1. Resident A submits AC leak in English
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_day_a', 'TKT-2026-1006A', 'unit_101', 'trade_hvac', 'sub_hvac_split', 'sym_hvac_warm', 'Living Room', 'غرفة المعيشة', 'AC leaking refrigerant and room is 32C', 'HIGH', 'SUBMITTED')
    `).run();

    // 2. Resident B submits sewage backup in Egyptian Arabic
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status, is_hazard
      ) VALUES ('tkt_day_b', 'TKT-2026-1006B', 'unit_204', 'trade_plumbing', 'sub_plumb_drainage', 'sym_plumb_tap', 'Bathroom', 'حمام الماستر', 'طفح صرف صحي شديد في بالوعة الحمام ورائحة كريهة', 'EMERGENCY', 'SUBMITTED', 1)
    `).run();

    // 3. Dispatcher reviews triage queue with 2 new tickets
    const unreviewed = db.prepare("SELECT * FROM tickets WHERE status = 'SUBMITTED'").all() as any[];
    expect(unreviewed.length).toBeGreaterThanOrEqual(4);

    // 4. Dispatcher assigns plumbing contractor to Resident B's emergency
    db.prepare(`
      UPDATE tickets 
      SET status = 'CONTRACTOR_CONTACTED', assigned_contractor_id = 'cont_plumb', updated_at = CURRENT_TIMESTAMP
      WHERE id = 'tkt_day_b'
    `).run();

    // 5. Landlord dashboard recalculates metrics
    const totalCount = db.prepare("SELECT COUNT(*) as c FROM tickets").get() as any;
    expect(totalCount.c).toBe(15); // 13 pre-seeded + 2 new

    const tradeBreakdown = db.prepare(`
      SELECT tr.slug, COUNT(t.id) as count
      FROM trades tr
      LEFT JOIN tickets t ON tr.id = t.trade_id
      GROUP BY tr.id
    `).all() as any[];

    const hvacCount = tradeBreakdown.find((b) => b.slug === "HVAC")?.count;
    const plumbCount = tradeBreakdown.find((b) => b.slug === "PLUMBING")?.count;
    expect(hvacCount).toBeGreaterThanOrEqual(2);
    expect(plumbCount).toBeGreaterThanOrEqual(3);
  });
});
