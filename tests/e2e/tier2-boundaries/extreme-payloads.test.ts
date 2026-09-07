import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 2: Extreme Payloads, Boundary Sizes & Injection Resistance", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T2.EXT.1: safely stores and retrieves 5,000-character description without truncation", () => {
    const longText = "Fault description detail: " + "A".repeat(4970);
    expect(longText.length).toBe(4996);

    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_long', 'TKT-2026-8001', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Bath', 'حمام', ?, 'NORMAL', 'SUBMITTED')
    `).run(longText);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_long'").get() as any;
    expect(ticket.description.length).toBe(4996);
    expect(ticket.description).toBe(longText);
  });

  it("T2.EXT.2: preserves Unicode emoji characters in fault description", () => {
    const emojiDesc = "Urgent: Sparks from socket ⚡💥! Smells dangerous ⚠️. Need technician 🔧 at building 🏢 door 🚪.";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_emoji', 'TKT-2026-8002', 'unit_101', 'trade_electrical', 'sub_elec_outlets', 'sym_elec_sparks', 'Room', 'غرفة', ?, 'EMERGENCY', 'SUBMITTED')
    `).run(emojiDesc);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_emoji'").get() as any;
    expect(ticket.description).toBe(emojiDesc);
  });

  it("T2.EXT.3: resists SQL injection attack payloads using parameterized queries", () => {
    const injection = "Normal description'; DROP TABLE tickets; SELECT * FROM 'users";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_inject', 'TKT-2026-8003', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Room', 'غرفة', ?, 'NORMAL', 'SUBMITTED')
    `).run(injection);

    // Verify tickets table still exists and record was safely stored as literal text
    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_inject'").get() as any;
    expect(ticket.description).toBe(injection);

    const count = db.prepare("SELECT COUNT(*) as c FROM tickets").get() as any;
    expect(count.c).toBeGreaterThan(10);
  });

  it("T2.EXT.4: safely persists HTML/XSS script tag payloads without interpretation", () => {
    const xssPayload = `<script>alert("XSS Attack!"); window.location="http://attacker.com";</script>`;
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_xss', 'TKT-2026-8004', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Room', 'غرفة', ?, 'NORMAL', 'SUBMITTED')
    `).run(xssPayload);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_xss'").get() as any;
    expect(ticket.description).toBe(xssPayload);
  });

  it("T2.EXT.5: handles high financial quote estimates (1,000,000.00 EGP) without overflow", () => {
    const highQuote = 1000000.0;
    db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes, quote_estimate
      ) VALUES ('tkt_1', 'cont_elv', 'Dispatcher: Tarek', 'PHONE', 'Major building rewiring quote', ?)
    `).run(highQuote);

    const log = db.prepare("SELECT quote_estimate FROM contractor_communications WHERE ticket_id = 'tkt_1' ORDER BY id DESC LIMIT 1").get() as any;
    expect(log.quote_estimate).toBe(1000000.0);
  });

  it("T2.EXT.6: supports 0.00 EGP quote estimate for gratis / warranty repair work", () => {
    db.prepare(`
      INSERT INTO contractor_communications (
        ticket_id, contractor_id, dispatcher_name, contact_method, notes, quote_estimate
      ) VALUES ('tkt_2', 'cont_plumb', 'Dispatcher: Tarek', 'PHONE', 'Warranty follow-up (free of charge)', 0.0)
    `).run();

    const log = db.prepare("SELECT quote_estimate FROM contractor_communications WHERE ticket_id = 'tkt_2' ORDER BY id DESC LIMIT 1").get() as any;
    expect(log.quote_estimate).toBe(0.0);
  });

  it("T2.EXT.7: handles empty photo array ([]) cleanly for tickets without uploaded images", () => {
    const ticket = db.prepare("SELECT photo_urls FROM tickets WHERE id = 'tkt_1'").get() as any;
    expect(ticket.photo_urls).toBe("[]");
    const parsed = JSON.parse(ticket.photo_urls);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(0);
  });

  it("T2.EXT.8: supports multi-photo gallery payload with 5 large Base64 images", () => {
    const mockPhotos = Array.from({ length: 5 }, (_, i) => `data:image/jpeg;base64,mockImageDataString_${i}_${"X".repeat(500)}`);
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status, photo_urls
      ) VALUES ('tkt_gallery', 'TKT-2026-8005', 'unit_101', 'trade_hvac', 'sub_hvac_split', 'sym_hvac_warm', 'Room', 'غرفة', 'Desc', 'NORMAL', 'SUBMITTED', ?)
    `).run(JSON.stringify(mockPhotos));

    const ticket = db.prepare("SELECT photo_urls FROM tickets WHERE id = 'tkt_gallery'").get() as any;
    const loaded = JSON.parse(ticket.photo_urls);
    expect(loaded).toHaveLength(5);
    expect(loaded[4]).toContain("mockImageDataString_4");
  });

  it("T2.EXT.9: preserves multiline text with Windows/Unix line breaks and tabs in notes", () => {
    const multiline = "Line 1: Issue started at 9AM\r\n\tSub-bullet: Water pooling\nLine 3: Shut valve";
    db.prepare(`
      INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
      VALUES ('tkt_1', 'NOTE_ADDED', null, 'SUBMITTED', 'Dispatcher', ?)
    `).run(multiline);

    const event = db.prepare("SELECT details FROM ticket_events WHERE ticket_id = 'tkt_1' ORDER BY id DESC LIMIT 1").get() as any;
    expect(event.details).toBe(multiline);
  });

  it("T2.EXT.10: stores various Egyptian telephone format variants cleanly", () => {
    const phoneFormats = ["+20 100 123 4567", "+201001234567", "01001234567", "+20 (11) 2345-6789"];
    phoneFormats.forEach((ph, idx) => {
      db.prepare(`
        INSERT INTO contractors (id, name_en, name_ar, trade_id, contact_person, phone)
        VALUES (?, 'Test Cont', 'مقاول تجريبي', 'trade_plumbing', 'Person', ?)
      `).run(`cont_phone_${idx}`, ph);

      const cont = db.prepare("SELECT phone FROM contractors WHERE id = ?").get(`cont_phone_${idx}`) as any;
      expect(cont.phone).toBe(ph);
    });
  });
});
