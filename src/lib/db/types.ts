/**
 * TypeScript Data Models for Home Faults Report System
 * Comprehensive types satisfying both PROJECT.md contracts and test suite oracles.
 */

export type TicketStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONTRACTOR_CONTACTED'
  | 'REJECTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';

export type ActorRole = 'RESIDENT' | 'DISPATCHER' | 'CONTRACTOR' | 'SYSTEM';

export type ContactMethod = 'PHONE' | 'WHATSAPP' | 'EMAIL' | 'IN_PERSON';

export interface Property {
  id: string;
  name_en: string;
  name_ar: string;
  address_en: string;
  address_ar: string;
  city?: string;
  created_at?: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  building_name: string;
  floor_number: number;
  resident_name: string;
  resident_phone: string;
  rooms?: string | string[];
  created_at?: string;
}

export interface Trade {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  order_index: number;
  sort_order?: number;
}

export interface Subcategory {
  id: string;
  trade_id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  is_elv: boolean;
}

export interface FaultSymptom {
  id: string;
  subcategory_id: string;
  symptom_en: string;
  symptom_ar: string;
  name_en?: string;
  name_ar?: string;
  default_severity: TicketSeverity;
  default_urgency?: Urgency;
  is_hazard: boolean;
  hazard_type?: string | null;
  hazard_instruction_en?: string | null;
  hazard_instruction_ar?: string | null;
  hazard_warning_en?: string | null;
  hazard_warning_ar?: string | null;
}

export interface Contractor {
  id: string;
  name_en: string;
  name_ar: string;
  trade_id: string;
  specialties?: string[];
  contact_person: string;
  phone: string;
  email?: string | null;
  rating: number;
  is_active?: boolean;
  created_at?: string;
}

export interface Ticket {
  id: string; // e.g. "TKT-2026-0001" or "tkt_1"
  reference_no?: string; // e.g. "TKT-2026-0001"
  property_id?: string | null;
  property_name: string;
  unit_id?: string | null;
  unit_number: string;
  trade_id: string;
  subcategory_id: string;
  symptom_id: string;
  room_location_en?: string | null;
  room_location_ar?: string | null;
  custom_description?: string | null;
  description?: string;
  severity: TicketSeverity;
  urgency?: Urgency;
  is_hazard: boolean;
  status: TicketStatus;
  resident_name: string;
  resident_phone: string;
  assigned_contractor_id?: string | null;
  appointment_date?: string | null;
  rejection_reason?: string | null;
  rejection_reason_code?: string | null;
  rejection_notes?: string | null;
  resolution_notes?: string | null;
  photos: string[]; // parsed from JSON
  photo_urls?: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface TicketEvent {
  id: number;
  ticket_id: string;
  from_status?: TicketStatus | null;
  to_status: TicketStatus;
  actor_name?: string;
  actor_role?: ActorRole;
  notes?: string | null;
  details?: string | null;
  event_type?: string;
  performed_by?: string;
  created_at: string;
}

export interface ContractorCommunication {
  id: number;
  ticket_id: string;
  contractor_id: string;
  contact_method: ContactMethod;
  quoted_cost?: number | null;
  quote_estimate?: number | null;
  scheduled_slot?: string | null;
  proposed_appointment?: string | null;
  notes: string;
  dispatcher_name: string;
  is_internal_only?: boolean;
  created_at: string;
}

export interface PortfolioStats {
  summary: {
    total_tickets: number;
    active_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
    rejected_tickets: number;
    hazard_tickets: number;
    critical_tickets: number;
    mttr_hours: number;
    sla_compliance_percent: number;
  };
  trade_distribution: {
    trade_id: string;
    name_en: string;
    name_ar: string;
    icon: string;
    count: number;
    percentage: number;
  }[];
  status_funnel: {
    status: TicketStatus;
    label_en: string;
    label_ar: string;
    count: number;
    percentage: number;
  }[];
  recent_activity: any[];
}
