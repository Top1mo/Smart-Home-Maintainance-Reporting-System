import { describe, it, expect } from "vitest";
import { getDirection, getTranslation, REFERENCE_TRADES, TRANSLATIONS } from "../test-helpers";

describe("Tier 1: Bilingual Support & Authentic Egyptian Arabic RTL Layout", () => {
  it("T1.I18N.1: verifies English locale returns LTR direction and Arabic returns RTL direction", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
  });

  it("T1.I18N.2: verifies Cairo font family is configured for authentic typography", () => {
    const cairoEn = getTranslation("font_cairo", "en");
    const cairoAr = getTranslation("font_cairo", "ar");
    expect(cairoEn).toBe("Cairo");
    expect(cairoAr).toBe("Cairo");
  });

  it("T1.I18N.3: verifies authentic Egyptian trade terminology in Arabic dictionary", () => {
    const tradesMap = new Map(REFERENCE_TRADES.map((t) => [t.slug, t.name_ar]));
    expect(tradesMap.get("PLUMBING")).toBe("سباكة");
    expect(tradesMap.get("ELECTRICAL")).toBe("كهرباء");
    expect(tradesMap.get("HVAC")).toBe("تكييف وتبريد");
    expect(tradesMap.get("ALUMINUM")).toBe("ألوميتال وزجاج");
    expect(tradesMap.get("GYPSUM")).toBe("جبس بورد وأسقف معلقة");
    expect(tradesMap.get("PAINTING")).toBe("نقاشة ودهانات");
  });

  it("T1.I18N.4: verifies all 8 lifecycle state labels have authentic Egyptian Arabic translations", () => {
    expect(getTranslation("status_submitted", "ar")).toBe("تم التقديم");
    expect(getTranslation("status_under_review", "ar")).toBe("قيد المراجعة");
    expect(getTranslation("status_contractor_contacted", "ar")).toBe("تم التواصل مع الفني");
    expect(getTranslation("status_appointment_scheduled", "ar")).toBe("موعد محدد");
    expect(getTranslation("status_in_progress", "ar")).toBe("جاري الإصلاح");
    expect(getTranslation("status_resolved", "ar")).toBe("تم الحل");
    expect(getTranslation("status_closed", "ar")).toBe("مغلق نهائياً");
    expect(getTranslation("status_rejected", "ar")).toBe("مرفوض");
  });

  it("T1.I18N.5: verifies urgency levels have accurate English and Egyptian Arabic translations", () => {
    expect(getTranslation("urgency_normal", "en")).toBe("Normal");
    expect(getTranslation("urgency_normal", "ar")).toBe("عادي");
    expect(getTranslation("urgency_emergency", "en")).toBe("Emergency");
    expect(getTranslation("urgency_emergency", "ar")).toBe("طارئ");
  });

  it("T1.I18N.6: verifies root application title is localized bilingually", () => {
    expect(getTranslation("app_title", "en")).toBe("Home Faults Report System");
    expect(getTranslation("app_title", "ar")).toBe("نظام الإبلاغ عن أعطال المنازل");
  });
});
