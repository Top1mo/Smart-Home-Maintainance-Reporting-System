"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const DICTIONARY: Translations = {
  // App Header & Navigation
  app_title: { en: "Home Maintenance Portal", ar: "نظام إدارة وصيانة المنزل" },
  app_tagline: { en: "Fault Reporting & Work Orders", ar: "متابعة وإصلاح الأعطال المنزلية وأوامر الشغل" },
  nav_resident: { en: "Report Fault", ar: "تسجيل عطل" },
  nav_dispatcher: { en: "Follow-up", ar: "المتابعة" },
  nav_landlord: { en: "Management & Units", ar: "الإدارة والوحدات" },
  font_cairo: { en: "Cairo", ar: "Cairo" },

  // Role Badges
  role_resident: { en: "Resident", ar: "الساكن" },
  role_dispatcher: { en: "Operations", ar: "المتابعة الميدانية" },
  role_landlord: { en: "Owner", ar: "المالك / الإدارة" },

  // Resident Wizard Steps
  wizard_step1: { en: "1. Select Trade", ar: "١. اختر التخصص" },
  wizard_step2: { en: "2. System & Symptom", ar: "٢. النظام ونوع العطل" },
  wizard_step3: { en: "3. Unit & Details", ar: "٣. رقم الوحدة والتفاصيل" },
  wizard_step4: { en: "4. Review & Submit", ar: "٤. مراجعة وتأكيد البلاغ" },

  // Categories / Trades (Authentic Egyptian Wording)
  trade_plumbing: { en: "Plumbing", ar: "سباكة" },
  trade_electrical: { en: "Electrical", ar: "كهرباء" },
  trade_hvac: { en: "HVAC & Air Conditioning", ar: "تكييف وتبريد" },
  trade_carpentry: { en: "Carpentry & Joinery", ar: "نجارة وأبواب" },
  trade_aluminum: { en: "Aluminum & Glazing", ar: "ألوميتال وزجاج" },
  trade_gypsum: { en: "Gypsum Boards & Ceilings", ar: "جبس بورد وأسقف معلقة" },
  trade_painting: { en: "Painting & Finishes", ar: "نقاشة ودهانات" },
  trade_pool: { en: "Swimming Pool", ar: "حمام سباحة" },
  trade_civil: { en: "Civil & Tiling", ar: "سيراميك وبلاط وبناء" },
  trade_appliances: { en: "Major Appliances", ar: "أجهزة منزلية" },
  trade_grounds: { en: "Grounds & Roofing", ar: "واجهات وأسطح وحدائق" },

  // Statuses (Exact 8-stage state machine)
  status_submitted: { en: "Submitted", ar: "تم التقديم" },
  status_under_review: { en: "Under Review", ar: "قيد المراجعة" },
  status_contractor_contacted: { en: "Contractor Contacted", ar: "تم التواصل مع الفني" },
  status_appointment_scheduled: { en: "Appointment Scheduled", ar: "موعد محدد" },
  status_in_progress: { en: "In Progress", ar: "جاري الإصلاح" },
  status_resolved: { en: "Resolved", ar: "تم الحل" },
  status_closed: { en: "Closed", ar: "مغلق نهائياً" },
  status_rejected: { en: "Rejected", ar: "مرفوض" },

  // Urgency
  urgency_low: { en: "Low", ar: "منخفض" },
  urgency_normal: { en: "Normal", ar: "عادي" },
  urgency_high: { en: "High", ar: "عاجل" },
  urgency_emergency: { en: "Emergency", ar: "طارئ" },

  // Hazard Alert
  hazard_detected: { en: "SAFETY HAZARD DETECTED", ar: "تنبيه خطر وسلامة داهم" },
  hazard_instruction_header: { en: "Immediate Safety Action Required:", ar: "إجراء سلامة فوري مطلوب منكم:" },

  // Common UI Actions
  action_next: { en: "Continue", ar: "التالي" },
  action_back: { en: "Back", ar: "السابق" },
  action_submit: { en: "Submit Report", ar: "إرسال البلاغ الآن" },
  action_submitting: { en: "Submitting...", ar: "جاري الإرسال..." },
  action_cancel: { en: "Cancel", ar: "إلغاء" },
  action_filter: { en: "Filter", ar: "تصفية" },
  action_search: { en: "Search tickets...", ar: "بحث في البلاغات..." },
  action_new_report: { en: "Report New Fault", ar: "إبلاغ عن عطل جديد" },
  action_my_tickets: { en: "My Tickets", ar: "بلاغاتي السابقة" },
  action_contact_contractor: { en: "Contact Contractor", ar: "توجيه لفني / مقاول" },
  action_schedule_visit: { en: "Schedule Visit", ar: "تحديد موعد الزيارة" },
  action_mark_progress: { en: "Start Repair Work", ar: "بدء العمل بالوحدة" },
  action_mark_resolved: { en: "Mark as Resolved", ar: "تأكيد إنهاء العطل" },
  action_close_ticket: { en: "Confirm & Close", ar: "إغلاق نهائي للبلاغ" },
  action_reject_ticket: { en: "Reject / Duplicate", ar: "رفض أو بلاغ مكرر" },
  action_reopen_ticket: { en: "Re-open Ticket", ar: "إعادة فتح البلاغ" },

  // Form Fields
  field_unit_number: { en: "Unit Number", ar: "رقم الوحدة" },
  field_building: { en: "Building / Block", ar: "العمارة / المجمع" },
  field_room_location: { en: "Room / Location", ar: "المكان بالتفصيل (مثل: المطبخ، الحمام)" },
  field_resident_name: { en: "Resident Name", ar: "اسم الساكن" },
  field_resident_phone: { en: "Contact Phone", ar: "رقم الموبايل للتواصل" },
  field_description: { en: "Fault Description", ar: "وصف العطل بدقة" },
  field_photos: { en: "Photo Attachments", ar: "صور العطل (اختياري)" },
  field_drag_photos: { en: "Drag and drop photos or click to browse", ar: "اسحب الصور هنا أو اضغط للاختيار من الهاتف" },

  // Dispatcher & Landlord
  total_tickets: { en: "Total Tickets", ar: "إجمالي البلاغات" },
  active_tickets: { en: "Active in Pipeline", ar: "قيد المتابعة والإصلاح" },
  resolved_tickets: { en: "Resolved", ar: "تم حلها بنجاح" },
  sla_compliance: { en: "SLA Response Rate", ar: "نسبة الالتزام بالوقت" },
  mttr: { en: "Average MTTR", ar: "متوسط وقت الإصلاح" },
  hazard_warning_count: { en: "Critical Hazards", ar: "بلاغات مخاطر حرجة" },
  assigned_to: { en: "Assigned Contractor", ar: "الفني المسؤول" },
  appointment_time: { en: "Scheduled Visit", ar: "موعد الزيارة المحدد" },
  notes_log: { en: "Audit & Communication Log", ar: "سجل التواصل والملاحظات" },
};

interface I18nContextType {
  locale: Locale;
  direction: Direction;
  setLocale: (loc: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "ar",
  direction: "rtl",
  setLocale: () => {},
  t: (key) => key,
});

export const LOCALE_STORAGE_KEY = "home_faults_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar"); // Arabic default as requested!
  const direction: Direction = locale === "ar" ? "rtl" : "ltr";

  // Restore saved locale preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (saved === "en" || saved === "ar") {
          setLocaleState(saved);
        }
      } catch {
        // localStorage not available or restricted
      }
    }
  }, []);

  useEffect(() => {
    // Sync document attributes
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
    }
  }, [locale, direction]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      } catch {
        // ignore
      }
    }
  };

  const t = (key: string): string => {
    const item = DICTIONARY[key];
    if (!item) return key;
    return item[locale] || item.en || key;
  };

  return (
    <I18nContext.Provider value={{ locale, direction, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
