/**
 * E2E Test Helpers & Reference Oracle Engine
 * 
 * Provides self-contained contracts, database fixtures, reference data,
 * and dynamic module resolution for the Home Faults Report System test suites.
 */

import { DatabaseSync } from "node:sqlite";

// ============================================================================
// 1. Interfaces & Domain Types (Authoritative Contracts from PROJECT.md)
// ============================================================================

export type TicketStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CONTRACTOR_CONTACTED"
  | "REJECTED"
  | "APPOINTMENT_SCHEDULED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Trade {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  order_index: number;
}

export interface Subcategory {
  id: string;
  trade_id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  is_elv?: boolean;
}

export interface FaultSymptom {
  id: string;
  subcategory_id: string;
  symptom_en: string;
  symptom_ar: string;
  default_severity: Severity;
  is_hazard: boolean;
  hazard_type?: string;
  hazard_instruction_en?: string;
  hazard_instruction_ar?: string;
}

export interface Contractor {
  id: string;
  name_en: string;
  name_ar: string;
  trade_id: string;
  contact_person: string;
  phone: string;
  rating: number;
  is_active?: boolean;
}

export interface Ticket {
  id: string;
  reference_no: string;
  property_name: string;
  unit_number: string;
  trade_id: string;
  subcategory_id: string;
  symptom_id: string;
  custom_description?: string;
  severity: Severity;
  is_hazard: boolean;
  status: TicketStatus;
  resident_name: string;
  resident_phone: string;
  assigned_contractor_id?: string;
  appointment_date?: string;
  rejection_reason?: string;
  rejection_reason_code?: string;
  resolution_notes?: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketEvent {
  id: number;
  ticket_id: string;
  from_status?: TicketStatus | null;
  to_status: TicketStatus;
  actor_name: string;
  actor_role: "RESIDENT" | "DISPATCHER" | "CONTRACTOR" | "SYSTEM";
  notes?: string;
  created_at: string;
}

export interface ContractorCommunication {
  id: number;
  ticket_id: string;
  contractor_id: string;
  contact_method: "PHONE" | "WHATSAPP" | "EMAIL" | "IN_PERSON";
  quoted_cost?: number;
  scheduled_slot?: string;
  notes?: string;
  dispatcher_name: string;
  created_at: string;
}

// ============================================================================
// 2. Authoritative Taxonomy & Hazard Reference Data
// ============================================================================

export const REFERENCE_TRADES: Trade[] = [
  { id: "trade_plumbing", slug: "PLUMBING", name_en: "Plumbing", name_ar: "سباكة", icon: "wrench", order_index: 1 },
  { id: "trade_electrical", slug: "ELECTRICAL", name_en: "Electrical", name_ar: "كهرباء", icon: "zap", order_index: 2 },
  { id: "trade_hvac", slug: "HVAC", name_en: "HVAC & Air Conditioning", name_ar: "تكييف وتبريد", icon: "fan", order_index: 3 },
  { id: "trade_carpentry", slug: "CARPENTRY", name_en: "Carpentry & Joinery", name_ar: "نجارة وأبواب", icon: "hammer", order_index: 4 },
  { id: "trade_aluminum", slug: "ALUMINUM", name_en: "Aluminum & Glazing Works", name_ar: "ألوميتال وزجاج", icon: "square", order_index: 5 },
  { id: "trade_gypsum", slug: "GYPSUM", name_en: "Gypsum Boards & False Ceilings", name_ar: "جبس بورد وأسقف معلقة", icon: "layers", order_index: 6 },
  { id: "trade_painting", slug: "PAINTING", name_en: "Painting & Surface Finishes", name_ar: "نقاشة ودهانات", icon: "paint-bucket", order_index: 7 },
  { id: "trade_pool", slug: "POOL", name_en: "Swimming Pool & Water Amenities", name_ar: "حمام سباحة", icon: "waves", order_index: 8 },
  { id: "trade_civil", slug: "CIVIL_TILING", name_en: "Civil, Masonry & Tiling", name_ar: "سيراميك وبلاط وبناء", icon: "grid", order_index: 9 },
  { id: "trade_appliances", slug: "APPLIANCES", name_en: "Major Landlord Appliances", name_ar: "أجهزة منزلية", icon: "tv", order_index: 10 },
  { id: "trade_grounds", slug: "GROUNDS_EXTERIOR", name_en: "Grounds, Exterior & Roofing", name_ar: "واجهات وأسطح وحدائق", icon: "home", order_index: 11 },
];

export const REFERENCE_SUBCATEGORIES: Subcategory[] = [
  // Plumbing
  { id: "sub_plumb_valves", trade_id: "trade_plumbing", slug: "PLUMBING_VALVES", name_en: "Taps, Mixers & Valves", name_ar: "خلاطات ومحابس" },
  { id: "sub_plumb_supply", trade_id: "trade_plumbing", slug: "PLUMBING_SUPPLY", name_en: "Water Supply Pipes", name_ar: "مواسير وتغذية مياه" },
  { id: "sub_plumb_drainage", trade_id: "trade_plumbing", slug: "PLUMBING_DRAINAGE", name_en: "Drainage & Traps", name_ar: "صرف صحي ومجاري" },
  { id: "sub_plumb_heaters", trade_id: "trade_plumbing", slug: "PLUMBING_HEATERS", name_en: "Water Heaters", name_ar: "سخانات المياه" },
  { id: "sub_plumb_pumps", trade_id: "trade_plumbing", slug: "PLUMBING_PUMPS", name_en: "Booster Pumps & Roof Tanks", name_ar: "مواتير وخزانات المياه" },

  // Electrical Mains
  { id: "sub_elec_panel", trade_id: "trade_electrical", slug: "ELECTRICAL_PANEL", name_en: "Distribution Boards & Breakers", name_ar: "لوحات التوزيع والقواطع" },
  { id: "sub_elec_outlets", trade_id: "trade_electrical", slug: "ELECTRICAL_OUTLETS", name_en: "Outlets, Switches & Power Points", name_ar: "برايز ومفاتيح وفيش" },
  { id: "sub_elec_lighting", trade_id: "trade_electrical", slug: "ELECTRICAL_LIGHTING", name_en: "Lighting Fixtures & Drivers", name_ar: "إضاءة وليد وسبوتات" },
  { id: "sub_elec_grounding", trade_id: "trade_electrical", slug: "ELECTRICAL_GROUNDING", name_en: "Earthing & Leakage Hazards", name_ar: "التأريض والماس الكهربائي" },

  // Electrical Dedicated ELV Sub-branch
  { id: "sub_elv_cctv", trade_id: "trade_electrical", slug: "ELECTRICAL_ELV_CCTV", name_en: "CCTV Camera Surveillance", name_ar: "كاميرات المراقبة", is_elv: true },
  { id: "sub_elv_intercom", trade_id: "trade_electrical", slug: "ELECTRICAL_ELV_INTERCOM", name_en: "Intercom & Access Control", name_ar: "الإنتركم والتحكم في الدخول", is_elv: true },
  { id: "sub_elv_wifi", trade_id: "trade_electrical", slug: "ELECTRICAL_ELV_WIFI", name_en: "Wi-Fi Access Points & LAN", name_ar: "نقاط الواي فاي والشبكات", is_elv: true },
  { id: "sub_elv_gates", trade_id: "trade_electrical", slug: "ELECTRICAL_ELV_GATES", name_en: "Automated Gates & Barriers", name_ar: "بوابات أوتوماتيكية وإلكترونية", is_elv: true },

  // HVAC
  { id: "sub_hvac_split", trade_id: "trade_hvac", slug: "HVAC_SPLIT", name_en: "Split A/C Units", name_ar: "تكييفات سبليت جدارية" },
  { id: "sub_hvac_central", trade_id: "trade_hvac", slug: "HVAC_CENTRAL", name_en: "Central & Ducted Systems", name_ar: "تكييف كونسيلد ومركزي" },
  { id: "sub_hvac_refrigerant", trade_id: "trade_hvac", slug: "HVAC_REFRIGERANT", name_en: "Refrigerant & Compressors", name_ar: "غاز الفريون والكمبروسور" },

  // Carpentry
  { id: "sub_carp_doors", trade_id: "trade_carpentry", slug: "CARPENTRY_DOORS", name_en: "Doors & Windows", name_ar: "أبواب وشبابيك خشب" },
  { id: "sub_carp_locks", trade_id: "trade_carpentry", slug: "CARPENTRY_LOCKS", name_en: "Locks, Latches & Hinges", name_ar: "كوالين ومقابض ومفصلات" },
  { id: "sub_carp_cabinets", trade_id: "trade_carpentry", slug: "CARPENTRY_CABINETS", name_en: "Cabinets & Wardrobes", name_ar: "مطابخ وخزائن ملابس" },

  // Aluminum & Glazing
  { id: "sub_alum_windows", trade_id: "trade_aluminum", slug: "ALUMINUM_WINDOWS", name_en: "Aluminum Windows & Balconies", name_ar: "شبابيك وبلكونات ألوميتال" },
  { id: "sub_alum_shower", trade_id: "trade_aluminum", slug: "ALUMINUM_SHOWER", name_en: "Shower Cabins & Tempered Glass", name_ar: "كبائن شاور وزجاج سيكوريت" },
  { id: "sub_alum_glass", trade_id: "trade_aluminum", slug: "ALUMINUM_GLASS", name_en: "Glass Panes & Mirrors", name_ar: "ألواح زجاج ومرايات" },

  // Gypsum & False Ceilings
  { id: "sub_gyp_suspension", trade_id: "trade_gypsum", slug: "GYPSUM_SUSPENSION", name_en: "Structural Suspension & Sagging", name_ar: "هبوط وترخيم الأسقف" },
  { id: "sub_gyp_water", trade_id: "trade_gypsum", slug: "GYPSUM_WATER", name_en: "Water Damage & Leaks", name_ar: "تأثر السقف بالمياه والرطوبة" },
  { id: "sub_gyp_joints", trade_id: "trade_gypsum", slug: "GYPSUM_JOINTS", name_en: "Joints, Cracks & Openings", name_ar: "شروخ وفواصل وفتحات" },

  // Painting
  { id: "sub_paint_peeling", trade_id: "trade_painting", slug: "PAINTING_PEELING", name_en: "Paint Peeling & Efflorescence", name_ar: "تقشير وتمليح الجدران" },
  { id: "sub_paint_cracks", trade_id: "trade_painting", slug: "PAINTING_CRACKS", name_en: "Cracks & Structural Joints", name_ar: "شروخ دهان وحوائط" },
  { id: "sub_paint_mold", trade_id: "trade_painting", slug: "PAINTING_MOLD", name_en: "Mold & Damp Blemishes", name_ar: "عفونة وبقع وتشطيبات" },

  // Pool
  { id: "sub_pool_filtration", trade_id: "trade_pool", slug: "POOL_FILTRATION", name_en: "Pumps & Filtration", name_ar: "طلمبات وفلاتر المسبح" },
  { id: "sub_pool_quality", trade_id: "trade_pool", slug: "POOL_WATER_QUALITY", name_en: "Water Quality & Chemicals", name_ar: "جودة ومعالجة المياه" },
  { id: "sub_pool_shell", trade_id: "trade_pool", slug: "POOL_SHELL", name_en: "Pool Shell & Drains", name_ar: "تسريبات وبلاط المسبح" },

  // Civil & Tiling
  { id: "sub_civil_tiles", trade_id: "trade_civil", slug: "CIVIL_TILES", name_en: "Floor & Wall Ceramic", name_ar: "سيراميك وبلاط أرضيات وحوائط" },
  { id: "sub_civil_masonry", trade_id: "trade_civil", slug: "CIVIL_MASONRY", name_en: "Plastering & Masonry", name_ar: "محارة وبناء ودرج السلالم" },
  { id: "sub_civil_waterproof", trade_id: "trade_civil", slug: "CIVIL_WATERPROOF", name_en: "Waterproofing Membranes", name_ar: "عزل مائي ورطوبة خرسانية" },

  // Appliances
  { id: "sub_app_refrig", trade_id: "trade_appliances", slug: "APPLIANCES_REFRIGERATION", name_en: "Refrigerators & Freezers", name_ar: "ثلاجات وديب فريزر" },
  { id: "sub_app_washers", trade_id: "trade_appliances", slug: "APPLIANCES_WASHERS", name_en: "Washing Machines & Dishwashers", name_ar: "غسالات أوتوماتيك وأطباق" },
  { id: "sub_app_cooking", trade_id: "trade_appliances", slug: "APPLIANCES_COOKING", name_en: "Cookers, Ovens & Hobs", name_ar: "بوتاجازات وأفران بلت إن" },

  // Grounds & Roofing
  { id: "sub_grd_roofing", trade_id: "trade_grounds", slug: "GROUNDS_ROOFING", name_en: "Roof Drainage & Waterproofing", name_ar: "عزل الأسطح ومزاريب المطر" },
  { id: "sub_grd_facades", trade_id: "trade_grounds", slug: "GROUNDS_FACADES", name_en: "Facades & Railings", name_ar: "واجهات وبروزات وسور السطح" },
  { id: "sub_grd_landscape", trade_id: "trade_grounds", slug: "GROUNDS_LANDSCAPE", name_en: "Landscape Irrigation & Lights", name_ar: "شبكات ري وإنارة الحدائق" },
];

export const REFERENCE_SYMPTOMS: FaultSymptom[] = [
  // High-priority Hazards
  {
    id: "sym_elec_sparks",
    subcategory_id: "sub_elec_panel",
    symptom_en: "Sparks / Arcing from Breaker Panel",
    symptom_ar: "شرز كهربائي أو فرقعة نارية من لوحة القواطع",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "ELECTRICAL_FIRE",
    hazard_instruction_en: "Turn off main breaker immediately. Do not touch charred fixtures.",
    hazard_instruction_ar: "افصل القاطع العمومي فوراً ولا تلمس المفاتيح المحترقة.",
  },
  {
    id: "sym_elec_water",
    subcategory_id: "sub_elec_lighting",
    symptom_en: "Water Dripping Through Light Fixture",
    symptom_ar: "مياه بتنزل من داخل بيت النور أو السبوت لايت",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "WATER_LIVE_POWER",
    hazard_instruction_en: "Deadly electrocution hazard! Disconnect main electrical breaker, then shut water stopcock.",
    hazard_instruction_ar: "خطر صعق مميت! افصل القاطع العمومي أولاً ثم أغلق محبس المياه العمومي.",
  },
  {
    id: "sym_gyp_sagging",
    subcategory_id: "sub_gyp_suspension",
    symptom_en: "Visible Sagging / Belly in Gypsum Ceiling",
    symptom_ar: "ترخيم وهبوط ملحوظ في منتصف لوح الجبس بورد",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "CEILING_COLLAPSE",
    hazard_instruction_en: "Collapse hazard! Evacuate area directly below ceiling immediately. Keep room clear.",
    hazard_instruction_ar: "خطر انهيار وسقوط السقف! أخلِ المنطقة أسفل السقف المعلق فوراً وامنع دخول الأطفال للغرفة.",
  },
  {
    id: "sym_gas_leak",
    subcategory_id: "sub_plumb_heaters",
    symptom_en: "Gas Water Heater Gas Smell / Leak",
    symptom_ar: "رائحة غاز نفاذة من سخان الغاز",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "GAS_EXPLOSION",
    hazard_instruction_en: "Explosion risk! Do NOT touch light switches. Shut off gas supply and open windows.",
    hazard_instruction_ar: "خطر انفجار! لا تشعل أو تطفئ الكهرباء واقفل محبس الغاز وافتح النوافذ.",
  },
  {
    id: "sym_elec_shock",
    subcategory_id: "sub_elec_grounding",
    symptom_en: "Electric Shock Touching Appliance or Tap",
    symptom_ar: "لدغة كهرباء عند لمس الغسالة أو الثلاجة أو الصنبور",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "EARTH_LEAKAGE",
    hazard_instruction_en: "Earthing failure! Stop using appliance/tap immediately and unplug safely.",
    hazard_instruction_ar: "عطل خطير في التأريض! توقف عن لمس الجهاز أو فتح الصنبور فوراً.",
  },
  {
    id: "sym_glass_crack",
    subcategory_id: "sub_alum_shower",
    symptom_en: "Cracked / Chipped Tempered Glass Shower Door",
    symptom_ar: "شرخ أو نقرة في زجاج الشاور السيكوريت",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "GLASS_SHATTER",
    hazard_instruction_en: "Shatter risk! Tempered glass may burst. Do not slide or force door.",
    hazard_instruction_ar: "خطر انفجار الزجاج! الزجاج السيكوريت المشروخ قد يتفتت فجأة.",
  },
  {
    id: "sym_pool_suction",
    subcategory_id: "sub_pool_shell",
    symptom_en: "Main Suction Drain Cover Missing/Broken",
    symptom_ar: "غطاء صفاية القاع مفقود أو مكسور",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "SUCTION_ENTRAPMENT",
    hazard_instruction_en: "Fatal suction entrapment hazard! Turn off pump and do not enter pool.",
    hazard_instruction_ar: "خطر احتجاز قاتل بالشفط! أوقف المضخة وامنع نزول المسبح نهائياً.",
  },
  {
    id: "sym_gate_beam",
    subcategory_id: "sub_elv_gates",
    symptom_en: "Safety Photocell Failure / Crushing Risk",
    symptom_ar: "حساس الأمان معطل والبوابة تغلق على السيارات/الأشخاص",
    default_severity: "CRITICAL",
    is_hazard: true,
    hazard_type: "CRUSH_HAZARD",
    hazard_instruction_en: "Crush hazard! Stop electric gate operation and switch to manual clutch.",
    hazard_instruction_ar: "خطر سحق ميكانيكي! أوقف تشغيل البوابة وحولها للفتح اليدوي.",
  },

  // Routine Non-Hazardous Symptoms
  {
    id: "sym_plumb_tap",
    subcategory_id: "sub_plumb_valves",
    symptom_en: "Dripping or Running Tap",
    symptom_ar: "حنفية بتنقط ومابتفصلش",
    default_severity: "LOW",
    is_hazard: false,
  },
  {
    id: "sym_cctv_black",
    subcategory_id: "sub_elv_cctv",
    symptom_en: "Camera Black Screen / Video Loss",
    symptom_ar: "شاشة سوداء أو فقدان إشارة الفيديو للكاميرا",
    default_severity: "MEDIUM",
    is_hazard: false,
  },
  {
    id: "sym_intercom_dead",
    subcategory_id: "sub_elv_intercom",
    symptom_en: "Handset / Indoor Monitor Does Not Ring",
    symptom_ar: "سماعة الإنتركم لا ترن عند الضغط من الخارج",
    default_severity: "MEDIUM",
    is_hazard: false,
  },
  {
    id: "sym_wifi_offline",
    subcategory_id: "sub_elv_wifi",
    symptom_en: "Ceiling Access Point Offline (No PoE Power)",
    symptom_ar: "نقطة توزيع الواي فاي فاصلة باور",
    default_severity: "MEDIUM",
    is_hazard: false,
  },
  {
    id: "sym_hvac_warm",
    subcategory_id: "sub_hvac_split",
    symptom_en: "A/C Blowing Warm Air / Compressor Inactive",
    symptom_ar: "التكييف شغال هواء عادي ومابيسقعش خالص",
    default_severity: "MEDIUM",
    is_hazard: false,
  },
  {
    id: "sym_carp_door_scrape",
    subcategory_id: "sub_carp_doors",
    symptom_en: "Door Scraping Floor / Binding Against Frame",
    symptom_ar: "الباب يحك في الأرضية أو الحلق",
    default_severity: "LOW",
    is_hazard: false,
  },
];

export const REFERENCE_CONTRACTORS: Contractor[] = [
  { id: "cont_elv", name_en: "Smart Link Security & ELV Systems", name_ar: "سمارت لينك للتيار الخفيف والأنظمة الذكية", trade_id: "trade_electrical", contact_person: "Eng. Hesham Farouk", phone: "+20 100 888 7766", rating: 4.9 },
  { id: "cont_elec", name_en: "Al-Nour Electrical Services", name_ar: "مؤسسة النور للأعمال الكهربائية", trade_id: "trade_electrical", contact_person: "Ibrahim Sharaf", phone: "+20 112 333 4455", rating: 4.8 },
  { id: "cont_plumb", name_en: "Al-Ahram Modern Plumbing Co.", name_ar: "شركة الأهرام للسباكة الحديثة", trade_id: "trade_plumbing", contact_person: "Hajj Mahmoud El-Naggar", phone: "+20 122 777 8899", rating: 4.7 },
  { id: "cont_hvac", name_en: "Taiba AC & Refrigeration Center", name_ar: "مركز طيبة للتكييف والتبريد", trade_id: "trade_hvac", contact_person: "Eng. Shady Adel", phone: "+20 106 555 4433", rating: 4.9 },
  { id: "cont_carp", name_en: "Al-Amal Joinery & Doors Workshop", name_ar: "ورشة الأمل للأبواب والنجارة", trade_id: "trade_carpentry", contact_person: "Osta Magdy Farag", phone: "+20 114 222 1100", rating: 4.6 },
  { id: "cont_alum", name_en: "Crystal Aluminum & Glazing Works", name_ar: "كريستال للألوميتال والزجاج المعماري", trade_id: "trade_aluminum", contact_person: "Sameh George", phone: "+20 109 444 3322", rating: 4.8 },
];

// ============================================================================
// 3. State Machine Engine (Rules & Transition Guards)
// ============================================================================

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["CONTRACTOR_CONTACTED", "REJECTED"],
  CONTRACTOR_CONTACTED: ["APPOINTMENT_SCHEDULED", "UNDER_REVIEW", "REJECTED"],
  APPOINTMENT_SCHEDULED: ["IN_PROGRESS", "CONTRACTOR_CONTACTED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "UNDER_REVIEW"], // UNDER_REVIEW on reopen dispute
  REJECTED: ["UNDER_REVIEW"], // UNDER_REVIEW on reopen dispute
  CLOSED: [], // Terminal state, immutable
};

export interface TransitionPayload {
  contractor_id?: string;
  rejection_reason_code?: string;
  rejection_notes?: string;
  reopen_reason?: string;
  appointment_date?: string;
  resolution_notes?: string;
  dispatcher_name?: string;
}

export function canTransition(current: TicketStatus, next: TicketStatus): boolean {
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function validateTransition(
  current: TicketStatus,
  next: TicketStatus,
  payload: TransitionPayload = {}
): { valid: boolean; error?: string } {
  if (current === next) {
    return { valid: false, error: `Cannot transition from ${current} to the same status.` };
  }

  if (current === "CLOSED") {
    return { valid: false, error: "Ticket is in terminal state CLOSED and cannot be modified." };
  }

  if (!canTransition(current, next)) {
    return {
      valid: false,
      error: `Illegal state transition from ${current} to ${next}. Must follow valid lifecycle paths.`,
    };
  }

  // Guard: Moving to CONTRACTOR_CONTACTED requires a contractor
  if (next === "CONTRACTOR_CONTACTED" && !payload.contractor_id) {
    return { valid: false, error: "Transition to CONTRACTOR_CONTACTED strictly requires contractor_id." };
  }

  // Guard: Moving to REJECTED requires a reason code
  if (next === "REJECTED" && (!payload.rejection_reason_code || !payload.rejection_notes)) {
    return { valid: false, error: "Transition to REJECTED strictly requires rejection_reason_code and rejection_notes." };
  }

  // Guard: Moving to APPOINTMENT_SCHEDULED requires valid appointment_date
  if (next === "APPOINTMENT_SCHEDULED") {
    if (!payload.appointment_date) {
      return { valid: false, error: "Transition to APPOINTMENT_SCHEDULED strictly requires appointment_date." };
    }
    const parsedDate = new Date(payload.appointment_date);
    if (isNaN(parsedDate.getTime())) {
      return { valid: false, error: "Invalid appointment_date format." };
    }
  }

  // Guard: Moving to RESOLVED requires resolution_notes
  if (next === "RESOLVED" && (!payload.resolution_notes || payload.resolution_notes.trim().length === 0)) {
    return { valid: false, error: "Transition to RESOLVED strictly requires resolution_notes detailing repairs completed." };
  }

  // Guard: Reopening a ticket to UNDER_REVIEW from REJECTED or RESOLVED requires reopen_reason
  if (next === "UNDER_REVIEW" && (current === "REJECTED" || current === "RESOLVED") && !payload.reopen_reason) {
    return { valid: false, error: `Reopening ticket from ${current} to UNDER_REVIEW requires reopen_reason.` };
  }

  return { valid: true };
}

// ============================================================================
// 4. In-Memory SQLite Database Test Engine
// ============================================================================

export function createTestDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");

  // Enable WAL and Foreign Keys
  db.exec("PRAGMA foreign_keys = ON;");

  // Create Schema DDL
  db.exec(`
    CREATE TABLE properties (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      address_en TEXT NOT NULL,
      address_ar TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE units (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      unit_number TEXT NOT NULL,
      building_name TEXT NOT NULL,
      floor_number INTEGER NOT NULL,
      resident_name TEXT NOT NULL,
      resident_phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE trades (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE subcategories (
      id TEXT PRIMARY KEY,
      trade_id TEXT NOT NULL REFERENCES trades(id),
      slug TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      is_elv BOOLEAN DEFAULT 0
    );

    CREATE TABLE fault_symptoms (
      id TEXT PRIMARY KEY,
      subcategory_id TEXT NOT NULL REFERENCES subcategories(id),
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      is_hazard BOOLEAN DEFAULT 0,
      hazard_warning_en TEXT,
      hazard_warning_ar TEXT,
      default_urgency TEXT DEFAULT 'NORMAL' CHECK (default_urgency IN ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY'))
    );

    CREATE TABLE contractors (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      trade_id TEXT NOT NULL REFERENCES trades(id),
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      rating REAL DEFAULT 4.8,
      is_active BOOLEAN DEFAULT 1
    );

    CREATE TABLE tickets (
      id TEXT PRIMARY KEY,
      reference_no TEXT UNIQUE NOT NULL,
      unit_id TEXT NOT NULL REFERENCES units(id),
      trade_id TEXT NOT NULL REFERENCES trades(id),
      subcategory_id TEXT NOT NULL REFERENCES subcategories(id),
      symptom_id TEXT NOT NULL REFERENCES fault_symptoms(id),
      room_location_en TEXT NOT NULL,
      room_location_ar TEXT NOT NULL,
      description TEXT NOT NULL,
      urgency TEXT NOT NULL CHECK (urgency IN ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY')),
      status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 
        'APPOINTMENT_SCHEDULED', 'IN_PROGRESS', 'RESOLVED', 
        'CLOSED', 'REJECTED'
      )),
      is_hazard BOOLEAN DEFAULT 0,
      photo_urls TEXT DEFAULT '[]',
      assigned_contractor_id TEXT REFERENCES contractors(id),
      appointment_date DATETIME,
      rejection_reason_code TEXT,
      rejection_notes TEXT,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE ticket_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      performed_by TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE contractor_communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      contractor_id TEXT NOT NULL REFERENCES contractors(id),
      dispatcher_name TEXT NOT NULL,
      contact_method TEXT NOT NULL CHECK (contact_method IN ('PHONE', 'WHATSAPP', 'EMAIL', 'IN_PERSON')),
      notes TEXT NOT NULL,
      quote_estimate REAL,
      proposed_appointment DATETIME,
      is_internal_only BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed reference data
  seedReferenceData(db);

  return db;
}

export function seedReferenceData(db: DatabaseSync): void {
  // 1. Properties & Units
  const insertProp = db.prepare(`
    INSERT INTO properties (id, name_en, name_ar, address_en, address_ar)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertProp.run("prop_palm", "Palm Hills Heights", "كمبوند بالم هيلز هايتس", "Plot 12, New Cairo", "قطعة 12، التجمع الخامس");

  const insertUnit = db.prepare(`
    INSERT INTO units (id, property_id, unit_number, building_name, floor_number, resident_name, resident_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUnit.run("unit_101", "prop_palm", "101", "Building A4", 1, "Ahmed El-Sayed", "+20 100 123 4567");
  insertUnit.run("unit_204", "prop_palm", "204", "Building A4", 2, "Mona Zaki", "+20 111 234 5678");
  insertUnit.run("unit_301", "prop_palm", "301", "Building B1", 3, "Karim Mansour", "+20 122 345 6789");
  insertUnit.run("unit_402", "prop_palm", "402", "Building B1", 4, "Hossam El-Din", "+20 109 876 5432");
  insertUnit.run("unit_502", "prop_palm", "502", "Building C2", 5, "Dina El-Gohary", "+20 155 432 1098");
  insertUnit.run("unit_603", "prop_palm", "603", "Building C2", 6, "Tamer Ashour", "+20 101 987 6543");

  // 2. Trades
  const insertTrade = db.prepare(`
    INSERT INTO trades (id, slug, name_en, name_ar, icon, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const t of REFERENCE_TRADES) {
    insertTrade.run(t.id, t.slug, t.name_en, t.name_ar, t.icon, t.order_index);
  }

  // 3. Subcategories
  const insertSub = db.prepare(`
    INSERT INTO subcategories (id, trade_id, slug, name_en, name_ar, is_elv)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const s of REFERENCE_SUBCATEGORIES) {
    insertSub.run(s.id, s.trade_id, s.slug, s.name_en, s.name_ar, s.is_elv ? 1 : 0);
  }

  // 4. Symptoms
  const insertSym = db.prepare(`
    INSERT INTO fault_symptoms (id, subcategory_id, name_en, name_ar, is_hazard, hazard_warning_en, hazard_warning_ar, default_urgency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const sym of REFERENCE_SYMPTOMS) {
    insertSym.run(
      sym.id,
      sym.subcategory_id,
      sym.symptom_en,
      sym.symptom_ar,
      sym.is_hazard ? 1 : 0,
      sym.hazard_instruction_en || null,
      sym.hazard_instruction_ar || null,
      sym.default_severity === "CRITICAL" ? "EMERGENCY" : "NORMAL"
    );
  }

  // 5. Contractors
  const insertCont = db.prepare(`
    INSERT INTO contractors (id, name_en, name_ar, trade_id, contact_person, phone, rating, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  for (const c of REFERENCE_CONTRACTORS) {
    insertCont.run(c.id, c.name_en, c.name_ar, c.trade_id, c.contact_person, c.phone, c.rating);
  }

  // 6. Pre-seeded 13 Sample Tickets spanning all 8 states
  const insertTkt = db.prepare(`
    INSERT INTO tickets (
      id, reference_no, unit_id, trade_id, subcategory_id, symptom_id,
      room_location_en, room_location_ar, description, urgency, status,
      is_hazard, photo_urls, assigned_contractor_id, appointment_date,
      rejection_reason_code, rejection_notes, resolution_notes, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // T1: SUBMITTED (ELV)
  insertTkt.run("tkt_1", "TKT-2026-0001", "unit_101", "trade_electrical", "sub_elv_intercom", "sym_intercom_dead", "Entrance Hall", "المدخل الرئيسي", "Intercom handset black display and no ring", "NORMAL", "SUBMITTED", 0, "[]", null, null, null, null, null, null);

  // T2: SUBMITTED (Plumbing)
  insertTkt.run("tkt_2", "TKT-2026-0002", "unit_204", "trade_plumbing", "sub_plumb_valves", "sym_plumb_tap", "Guest Bathroom", "حمام الضيوف", "Basin mixer dripping constantly", "LOW", "SUBMITTED", 0, "[]", null, null, null, null, null, null);

  // T3: UNDER_REVIEW (Electrical Hazard)
  insertTkt.run("tkt_3", "TKT-2026-0003", "unit_301", "trade_electrical", "sub_elec_panel", "sym_elec_sparks", "Hallway Panel", "لوحة التوزيع بالطرق", "Breaker sparks and burning smell", "EMERGENCY", "UNDER_REVIEW", 1, "[]", null, null, null, null, null, null);

  // T4: CONTRACTOR_CONTACTED (ELV CCTV)
  insertTkt.run("tkt_4", "TKT-2026-0004", "unit_402", "trade_electrical", "sub_elv_cctv", "sym_cctv_black", "Parking Slot 12", "الجراج رقم 12", "Parking dome camera feed lost", "NORMAL", "CONTRACTOR_CONTACTED", 0, "[]", "cont_elv", null, null, null, null, null);

  // T5: CONTRACTOR_CONTACTED (Gypsum Sagging Hazard)
  insertTkt.run("tkt_5", "TKT-2026-0005", "unit_502", "trade_gypsum", "sub_gyp_suspension", "sym_gyp_sagging", "Living Room", "غرفة المعيشة", "False ceiling sagging 5cm", "EMERGENCY", "CONTRACTOR_CONTACTED", 1, "[]", "cont_carp", null, null, null, null, null);

  // T6: APPOINTMENT_SCHEDULED (HVAC)
  insertTkt.run("tkt_6", "TKT-2026-0006", "unit_603", "trade_hvac", "sub_hvac_split", "sym_hvac_warm", "Master Bedroom", "غرفة النوم الرئيسية", "AC blowing warm air in summer heat", "HIGH", "APPOINTMENT_SCHEDULED", 0, "[]", "cont_hvac", "2026-09-08 11:00:00", null, null, null, null);

  // T7: APPOINTMENT_SCHEDULED (Carpentry)
  insertTkt.run("tkt_7", "TKT-2026-0007", "unit_101", "trade_carpentry", "sub_carp_doors", "sym_carp_door_scrape", "Balcony Door", "باب التراس", "Terrace door scraping floor hard", "LOW", "APPOINTMENT_SCHEDULED", 0, "[]", "cont_carp", "2026-09-09 14:00:00", null, null, null, null);

  // T8: IN_PROGRESS (Plumbing Hazard)
  insertTkt.run("tkt_8", "TKT-2026-0008", "unit_204", "trade_plumbing", "sub_plumb_heaters", "sym_gas_leak", "Kitchen Heater", "سخان المطبخ", "Gas smell near water heater", "EMERGENCY", "IN_PROGRESS", 1, "[]", "cont_plumb", "2026-09-07 10:00:00", null, null, null, null);

  // T9: IN_PROGRESS (Pool)
  insertTkt.run("tkt_9", "TKT-2026-0009", "unit_301", "trade_pool", "sub_pool_shell", "sym_pool_suction", "Main Pool", "المسبح الرئيسي", "Broken suction drain grill replaced", "EMERGENCY", "IN_PROGRESS", 1, "[]", "cont_plumb", "2026-09-07 12:00:00", null, null, null, null);

  // T10: RESOLVED (Aluminum)
  insertTkt.run("tkt_10", "TKT-2026-0010", "unit_402", "trade_aluminum", "sub_alum_shower", "sym_glass_crack", "Master Bath", "حمام الماستر", "Shower door cracked", "HIGH", "RESOLVED", 1, "[]", "cont_alum", null, null, null, "Replaced tempered glass panel with 10mm Securit", "2026-09-06 14:30:00");

  // T11: RESOLVED (Electrical Water Near Power Hazard)
  insertTkt.run("tkt_11", "TKT-2026-0011", "unit_502", "trade_electrical", "sub_elec_lighting", "sym_elec_water", "Guest Bath", "حمام الضيوف", "Water dripping from spotlight", "EMERGENCY", "RESOLVED", 1, "[]", "cont_elec", null, null, null, "Isolated light circuit and fixed upper pipe joint", "2026-09-06 15:00:00");

  // T12: CLOSED (Civil)
  insertTkt.run("tkt_12", "TKT-2026-0012", "unit_603", "trade_civil", "sub_civil_tiles", "sym_plumb_tap", "Entrance Lobby", "مدخل العمارة", "Cracked porcelain floor tile replaced", "LOW", "CLOSED", 0, "[]", "cont_carp", null, null, null, "Re-tiled and grouted seamlessly", "2026-09-05 16:00:00");

  // T13: REJECTED (Carpentry - Tenant Damage)
  insertTkt.run("tkt_13", "TKT-2026-0013", "unit_101", "trade_carpentry", "sub_carp_cabinets", "sym_carp_door_scrape", "Bathroom Vanity", "وحدة الحمام", "Vanity mirror broken by perfume drop", "LOW", "REJECTED", 0, "[]", null, null, "TENANT_RESPONSIBILITY", "Damage caused by accidental tenant impact, not building maintenance warranty.", null, null);

  // Initial event logs
  const insertEvent = db.prepare(`
    INSERT INTO ticket_events (ticket_id, event_type, from_status, to_status, performed_by, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertEvent.run("tkt_1", "STATUS_CHANGE", null, "SUBMITTED", "Resident: Ahmed El-Sayed", "Ticket submitted");
  insertEvent.run("tkt_3", "STATUS_CHANGE", "SUBMITTED", "UNDER_REVIEW", "Dispatcher: Tarek Helmy", "Dispatcher started review");
  insertEvent.run("tkt_4", "CONTRACTOR_CONTACTED", "UNDER_REVIEW", "CONTRACTOR_CONTACTED", "Dispatcher: Tarek Helmy", "Assigned Smart Link ELV");
  insertEvent.run("tkt_6", "APPOINTMENT_SET", "CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED", "Dispatcher: Tarek Helmy", "Scheduled 2026-09-08 11:00");
  insertEvent.run("tkt_8", "STATUS_CHANGE", "APPOINTMENT_SCHEDULED", "IN_PROGRESS", "Contractor: Al-Ahram Plumbing", "Technician arrived on site");
  insertEvent.run("tkt_10", "STATUS_CHANGE", "IN_PROGRESS", "RESOLVED", "Contractor: Crystal Aluminum", "Tempered panel replaced");
  insertEvent.run("tkt_12", "STATUS_CHANGE", "RESOLVED", "CLOSED", "Resident: Tamer Ashour", "Resident confirmed satisfaction");
  insertEvent.run("tkt_13", "REJECTED", "UNDER_REVIEW", "REJECTED", "Dispatcher: Tarek Helmy", "Rejected: Tenant Responsibility");
}

// ============================================================================
// 5. Hazard Detection Engine
// ============================================================================

export function detectHazard(
  symptomId?: string,
  description: string = ""
): { isHazard: boolean; hazardType?: string; warning_en?: string; warning_ar?: string } {
  // Check known symptom IDs
  if (symptomId) {
    const matched = REFERENCE_SYMPTOMS.find((s) => s.id === symptomId);
    if (matched && matched.is_hazard) {
      return {
        isHazard: true,
        hazardType: matched.hazard_type,
        warning_en: matched.hazard_instruction_en,
        warning_ar: matched.hazard_instruction_ar,
      };
    }
  }

  // Keyword check (Arabic & English)
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes("شرز") || lowerDesc.includes("spark") || lowerDesc.includes("شياط") || lowerDesc.includes("arcing")) {
    return {
      isHazard: true,
      hazardType: "ELECTRICAL_FIRE",
      warning_en: "DANGER! Electrical sparks detected. Turn off main circuit breaker immediately.",
      warning_ar: "خطر! شرز كهربائي داهم. افصل القاطع العمومي فوراً.",
    };
  }

  if (
    (lowerDesc.includes("مياه") || lowerDesc.includes("water") || lowerDesc.includes("تسريب")) &&
    (lowerDesc.includes("كهرباء") || lowerDesc.includes("power") || lowerDesc.includes("سبوت") || lowerDesc.includes("فيشة") || lowerDesc.includes("socket"))
  ) {
    return {
      isHazard: true,
      hazardType: "WATER_LIVE_POWER",
      warning_en: "ELECTROCUTION HAZARD! Water near live power. Do not touch switches; shut off main breaker.",
      warning_ar: "خطر صعق كهربائي! تسريب مياه بجوار الكهرباء. افصل القاطع الرئيسي فوراً.",
    };
  }

  if (lowerDesc.includes("غاز") || lowerDesc.includes("gas leak") || lowerDesc.includes("gas smell") || lowerDesc.includes("ريحة غاز")) {
    return {
      isHazard: true,
      hazardType: "GAS_EXPLOSION",
      warning_en: "EXPLOSION HAZARD! Shut off gas valve, ventilate room, do not use electrical switches.",
      warning_ar: "خطر انفجار! اقفل محبس الغاز وافتح النوافذ ولا تلمس مفاتيح الكهرباء.",
    };
  }

  if (lowerDesc.includes("ترخيم") || lowerDesc.includes("سقوط السقف") || lowerDesc.includes("ceiling sag") || lowerDesc.includes("collapse")) {
    return {
      isHazard: true,
      hazardType: "CEILING_COLLAPSE",
      warning_en: "COLLAPSE HAZARD! Clear area under sagging ceiling immediately.",
      warning_ar: "خطر انهيار! أخلِ المنطقة أسفل السقف المعلق فوراً.",
    };
  }

  return { isHazard: false };
}

// ============================================================================
// 6. Bilingual & RTL Layout Translation Reference
// ============================================================================

export const TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  app_title: { en: "Home Faults Report System", ar: "نظام الإبلاغ عن أعطال المنازل" },
  status_submitted: { en: "Submitted", ar: "تم التقديم" },
  status_under_review: { en: "Under Review", ar: "قيد المراجعة" },
  status_contractor_contacted: { en: "Contractor Contacted", ar: "تم التواصل مع الفني" },
  status_appointment_scheduled: { en: "Appointment Scheduled", ar: "موعد محدد" },
  status_in_progress: { en: "In Progress", ar: "جاري الإصلاح" },
  status_resolved: { en: "Resolved", ar: "تم الحل" },
  status_closed: { en: "Closed", ar: "مغلق نهائياً" },
  status_rejected: { en: "Rejected", ar: "مرفوض" },
  urgency_low: { en: "Low", ar: "منخفض" },
  urgency_normal: { en: "Normal", ar: "عادي" },
  urgency_high: { en: "High", ar: "عاجل" },
  urgency_emergency: { en: "Emergency", ar: "طارئ" },
  font_cairo: { en: "Cairo", ar: "Cairo" },
};

export function getTranslation(key: string, locale: "en" | "ar"): string {
  const item = TRANSLATIONS[key];
  if (!item) return key;
  return item[locale] || item.en;
}

export function getDirection(locale: "en" | "ar"): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
