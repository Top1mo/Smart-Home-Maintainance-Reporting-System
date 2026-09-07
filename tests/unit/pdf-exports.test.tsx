import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkOrderSlip } from "@/components/pdf/WorkOrderSlip";
import { PunchListReport, PunchListTicket } from "@/components/pdf/PunchListReport";

describe("PDF Export Components & Punch List Grouping Hierarchy", () => {
  const mockTickets: PunchListTicket[] = [
    {
      id: "tkt-001",
      reference_no: "TKT-2026-0001",
      property_name: "كمبوند جاردينيا",
      building_name: "عمارة B2",
      unit_number: "204",
      trade_name_ar: "سباكة",
      trade_name_en: "Plumbing",
      trade_slug: "plumbing",
      symptom_ar: "تسريب مياه تحت حوض المطبخ",
      symptom_en: "Water leak under sink",
      room_location_ar: "المطبخ",
      description: "تسريب مستمر من محبس الزاوية",
      status: "IN_PROGRESS",
      is_hazard: false,
      urgency: "NORMAL",
      resident_name: "أحمد السيد",
      resident_phone: "01001234567",
      created_at: "2026-09-01T10:00:00Z",
    },
    {
      id: "tkt-002",
      reference_no: "TKT-2026-0002",
      property_name: "كمبوند جاردينيا",
      building_name: "عمارة B2",
      unit_number: "204",
      trade_name_ar: "كهرباء",
      trade_name_en: "Electrical",
      trade_slug: "electrical",
      symptom_ar: "شرز في مفتاح الإضاءة الرئيسي",
      symptom_en: "Sparking switch",
      room_location_ar: "الصالة",
      description: "صوت طقطقة وشرز كهربي",
      status: "SUBMITTED",
      is_hazard: true,
      urgency: "EMERGENCY",
      resident_name: "أحمد السيد",
      resident_phone: "01001234567",
      created_at: "2026-09-02T14:30:00Z",
    },
    {
      id: "tkt-003",
      reference_no: "TKT-2026-0003",
      property_name: "كمبوند جاردينيا",
      building_name: "عمارة A1",
      unit_number: "101",
      trade_name_ar: "نجارة وأبواب",
      trade_name_en: "Carpentry",
      trade_slug: "carpentry",
      symptom_ar: "باب البلكونة يحك بالأرضية",
      symptom_en: "Door scraping floor",
      room_location_ar: "غرفة المعيشة",
      description: "يحتاج لضبط المفصلات",
      status: "RESOLVED",
      is_hazard: false,
      urgency: "NORMAL",
      resident_name: "فاطمة إبراهيم",
      resident_phone: "01119876543",
      created_at: "2026-08-28T09:00:00Z",
    },
    {
      id: "tkt-004",
      reference_no: "TKT-2026-0004",
      property_name: "كمبوند جاردينيا",
      building_name: "عمارة A1",
      unit_number: "101",
      trade_name_ar: "سباكة",
      trade_name_en: "Plumbing",
      trade_slug: "plumbing",
      symptom_ar: "انسداد في صرف الحمام",
      symptom_en: "Blocked shower drain",
      room_location_ar: "الحمام الرئيسي",
      description: "المياه تتراكم بعد الاستحمام",
      status: "IN_PROGRESS",
      is_hazard: false,
      urgency: "HIGH",
      resident_name: "فاطمة إبراهيم",
      resident_phone: "01119876543",
      created_at: "2026-08-30T11:00:00Z",
    },
  ];

  describe("WorkOrderSlip (Single Job Slip)", () => {
    it("renders ticket reference, location, trade, and resident data", () => {
      const ticket = mockTickets[0];
      const html = renderToStaticMarkup(
        <WorkOrderSlip ticket={ticket as any} onClose={() => {}} />
      );

      expect(html).toContain("أمر شغل وتكليف إصلاح عطل");
      expect(html).toContain(ticket.reference_no);
      expect(html).toContain(ticket.unit_number);
      expect(html).toContain(ticket.resident_name);
      expect(html).toContain(ticket.resident_phone);
      expect(html).toContain(ticket.symptom_ar);
      expect(html).toContain(ticket.description);
    });

    it("displays critical hazard warning banner when is_hazard is true", () => {
      const hazardTicket = mockTickets[1];
      const html = renderToStaticMarkup(
        <WorkOrderSlip ticket={hazardTicket as any} onClose={() => {}} />
      );

      expect(html).toContain("تنبيه سلامة ومخاطر داهمة");
      expect(html).toContain("CRITICAL HAZARD");
      expect(html).toContain("شرز في مفتاح الإضاءة الرئيسي");
    });

    it("renders technician quotation, spare parts lines, and sign-off table", () => {
      const ticket = mockTickets[0];
      const html = renderToStaticMarkup(
        <WorkOrderSlip ticket={ticket as any} onClose={() => {}} />
      );

      expect(html).toContain("إقرار إتمام الأعمال والمحاسبة");
      expect(html).toContain("بيان قطع الغيار والخامات المستخدمة");
      expect(html).toContain("إجمالي قيمة المصنعية");
      expect(html).toContain("المبلغ الإجمالي المستحق");
      expect(html).toContain("اسم وتوقيع الفني / المقاول");
      expect(html).toContain("توقيع المستلم / الساكن");
    });

    it("contains printable CSS classes for A4 output", () => {
      const ticket = mockTickets[0];
      const html = renderToStaticMarkup(
        <WorkOrderSlip ticket={ticket as any} onClose={() => {}} />
      );

      expect(html).toContain("printable-modal-overlay");
      expect(html).toContain("printable-modal-container");
      expect(html).toContain("print-avoid-break");
    });
  });

  describe("PunchListReport (Multi-Job Master Report)", () => {
    it("renders report title, summary metrics strip, and inspection sign-off block", () => {
      const html = renderToStaticMarkup(
        <PunchListReport tickets={mockTickets} isModal={false} />
      );

      expect(html).toContain("قائمة أعمال ومهام صيانة الوحدات (Punch List)");
      expect(html).toContain("Master Maintenance &amp; Inspection Punch List");
      expect(html).toContain("إجمالي المهام:");
      expect(html).toContain("4 بند");
      expect(html).toContain("عدد الوحدات:");
      expect(html).toContain("2 وحدة");
      expect(html).toContain("مخاطر وسلامة:");
      expect(html).toContain("1 عطل حرج");
      expect(html).toContain("محضر الفحص والمعاينة الميدانية");
      expect(html).toContain("اسم وتوقيع المالك / المشرف");
      expect(html).toContain("اسم وتوقيع مقاول الصيانة");
    });

    it("groups hierarchically by Unit Number, then by Trade Category", () => {
      const html = renderToStaticMarkup(
        <PunchListReport tickets={mockTickets} isModal={false} />
      );

      // Verify both units appear as group headers
      expect(html).toContain("وحدة 204");
      expect(html).toContain("وحدة 101");

      // Verify trade headers appear inside units
      expect(html).toContain("تخصص: سباكة");
      expect(html).toContain("تخصص: كهرباء");
      expect(html).toContain("تخصص: نجارة وأبواب");
    });

    it("renders printable inspection checkboxes [ ] and task reference details", () => {
      const html = renderToStaticMarkup(
        <PunchListReport tickets={mockTickets} isModal={false} />
      );

      mockTickets.forEach((t) => {
        expect(html).toContain(t.reference_no);
        expect(html).toContain(t.symptom_ar);
        expect(html).toContain(t.room_location_ar);
      });

      // Resolved task contains checkmark
      expect(html).toContain("✓");
    });

    it("renders in modal mode with overlay classes when isModal is true", () => {
      const html = renderToStaticMarkup(
        <PunchListReport tickets={mockTickets} isModal={true} onClose={() => {}} />
      );

      expect(html).toContain("printable-modal-overlay");
      expect(html).toContain("printable-modal-container");
    });
  });
});
