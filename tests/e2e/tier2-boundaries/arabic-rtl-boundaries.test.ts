import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, getDirection, getTranslation } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 2: Arabic RTL Boundary Cases, Bidirectional Text & Numeral Alignments", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T2.RTL.1: preserves bidirectional mixed English & Arabic text without character corruption", () => {
    const mixed = "تكييف Carrier سبليت شغال بس بيسرب مياه بغزارة في Master Bedroom Unit 402";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_bidi', 'TKT-2026-8101', 'unit_101', 'trade_hvac', 'sub_hvac_split', 'sym_hvac_warm', 'Master Bedroom', 'غرفة النوم الرئيسية', ?, 'HIGH', 'SUBMITTED')
    `).run(mixed);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_bidi'").get() as any;
    expect(ticket.description).toBe(mixed);
  });

  it("T2.RTL.2: supports Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) in descriptions and units", () => {
    const easternNumerals = "العطل في شقة رقم ٥٠٢ بالدور الخامس - هاتف الطوارئ ٠١٠٠١٢٣٤٥٦٧";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_eastern', 'TKT-2026-8102', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Room', 'غرفة', ?, 'NORMAL', 'SUBMITTED')
    `).run(easternNumerals);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_eastern'").get() as any;
    expect(ticket.description).toBe(easternNumerals);
  });

  it("T2.RTL.3: preserves Arabic diacritics (تشكيل) in descriptions without stripping", () => {
    const tashkeel = "شَرْزٌ كَهْرَبَائِيٌّ شَدِيدٌ وَرَائِحَةُ شِيَاطٍ قَوِيَّةٌ مِنَ اللَّوْحَةِ";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_tashkeel', 'TKT-2026-8103', 'unit_101', 'trade_electrical', 'sub_elec_panel', 'sym_elec_sparks', 'Room', 'غرفة', ?, 'EMERGENCY', 'SUBMITTED')
    `).run(tashkeel);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_tashkeel'").get() as any;
    expect(ticket.description).toBe(tashkeel);
  });

  it("T2.RTL.4: preserves Arabic punctuation marks (، ؛ ؟)", () => {
    const arabicPunctuation = "الماسورة بتسرب مياه، هل يمكن إرسال الفني فوراً؟ الوضع طارئ؛ لأن المياه وصلت للكهرباء.";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_punct', 'TKT-2026-8104', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Room', 'غرفة', ?, 'HIGH', 'SUBMITTED')
    `).run(arabicPunctuation);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_punct'").get() as any;
    expect(ticket.description).toContain("،");
    expect(ticket.description).toContain("؟");
    expect(ticket.description).toContain("؛");
  });

  it("T2.RTL.5: handles leading plus on international phone (+20) in RTL context", () => {
    const resident = db.prepare("SELECT resident_phone FROM units WHERE id = 'unit_101'").get() as any;
    expect(resident.resident_phone).toMatch(/^\+20\s\d{3}\s\d{3}\s\d{4}$/);
    expect(resident.resident_phone.startsWith("+20")).toBe(true);
  });

  it("T2.RTL.6: verifies currency representation in both Arabic (ج.م) and English (EGP)", () => {
    function formatCurrency(amount: number, locale: "en" | "ar"): string {
      return locale === "ar" ? `${amount} ج.م` : `${amount} EGP`;
    }

    expect(formatCurrency(450, "en")).toBe("450 EGP");
    expect(formatCurrency(450, "ar")).toBe("450 ج.م");
  });

  it("T2.RTL.7: verifies Arabic layout direction enforces dir=rtl", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
  });

  it("T2.RTL.8: stores long compound Arabic room location names accurately", () => {
    const complexLocationAr = "جناح الضيوف الشرقي - الحمام الملحق بالصالون الرئيسي";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_loc', 'TKT-2026-8105', 'unit_101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'East Guest Suite', ?, 'Desc', 'NORMAL', 'SUBMITTED')
    `).run(complexLocationAr);

    const ticket = db.prepare("SELECT room_location_ar FROM tickets WHERE id = 'tkt_loc'").get() as any;
    expect(ticket.room_location_ar).toBe(complexLocationAr);
  });

  it("T2.RTL.9: stores nested English appliance serial code inside Arabic narrative", () => {
    const narrative = "الثلاجة عطلانة موديل Samsung NoFrost RT53K6271BS/MR الكمبروسر فاصل";
    db.prepare(`
      INSERT INTO tickets (
        id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
        room_location_en, room_location_ar, description, urgency, status
      ) VALUES ('tkt_serial', 'TKT-2026-8106', 'unit_101', 'trade_appliances', 'sub_app_refrig', 'sym_plumb_tap', 'Kitchen', 'المطبخ', ?, 'NORMAL', 'SUBMITTED')
    `).run(narrative);

    const ticket = db.prepare("SELECT description FROM tickets WHERE id = 'tkt_serial'").get() as any;
    expect(ticket.description).toContain("Samsung NoFrost RT53K6271BS/MR");
  });

  it("T2.RTL.10: falls back gracefully to English when unsupported locale code is supplied", () => {
    const fallbackTitle = getTranslation("app_title", "fr" as any);
    expect(fallbackTitle).toBe("Home Faults Report System");
  });
});
