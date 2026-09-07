/**
 * 8-Stage Deterministic Lifecycle State Machine
 * Governing transitions, guards, bilingual labels, and progression steps.
 */

export type TicketStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONTRACTOR_CONTACTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export interface TransitionPayload {
  to_status?: TicketStatus;
  actor_name?: string;
  actor_role?: 'RESIDENT' | 'DISPATCHER' | 'CONTRACTOR' | 'SYSTEM';
  notes?: string;
  contractor_id?: string;
  assigned_contractor_id?: string;
  appointment_date?: string;
  rejection_reason?: string;
  rejection_reason_code?: string;
  rejection_notes?: string;
  resolution_notes?: string;
  reopen_reason?: string;
}

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

export interface StateMetadata {
  status: TicketStatus;
  label_en: string;
  label_ar: string;
  step_number: number;
  badge: {
    bg: string;
    border: string;
    text: string;
  };
}

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['CONTRACTOR_CONTACTED', 'REJECTED'],
  CONTRACTOR_CONTACTED: ['APPOINTMENT_SCHEDULED', 'UNDER_REVIEW', 'REJECTED'],
  APPOINTMENT_SCHEDULED: ['IN_PROGRESS', 'CONTRACTOR_CONTACTED'],
  IN_PROGRESS: ['RESOLVED', 'APPOINTMENT_SCHEDULED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS', 'UNDER_REVIEW'],
  CLOSED: [],
  REJECTED: ['UNDER_REVIEW'],
};

export const STATE_METADATA: Record<TicketStatus, StateMetadata> = {
  SUBMITTED: {
    status: 'SUBMITTED',
    label_en: 'Submitted',
    label_ar: 'تم التقديم',
    step_number: 1,
    badge: {
      bg: 'bg-sky-500/10 dark:bg-sky-950/30',
      border: 'border-sky-500/30',
      text: 'text-sky-700 dark:text-sky-300',
    },
  },
  UNDER_REVIEW: {
    status: 'UNDER_REVIEW',
    label_en: 'Under Review',
    label_ar: 'قيد المراجعة',
    step_number: 2,
    badge: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-950/30',
      border: 'border-indigo-500/30',
      text: 'text-indigo-700 dark:text-indigo-300',
    },
  },
  CONTRACTOR_CONTACTED: {
    status: 'CONTRACTOR_CONTACTED',
    label_en: 'Contractor Contacted',
    label_ar: 'تم التواصل مع الفني',
    step_number: 3,
    badge: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/30',
      border: 'border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-300',
    },
  },
  APPOINTMENT_SCHEDULED: {
    status: 'APPOINTMENT_SCHEDULED',
    label_en: 'Appointment Scheduled',
    label_ar: 'موعد محدد',
    step_number: 4,
    badge: {
      bg: 'bg-purple-500/10 dark:bg-purple-950/30',
      border: 'border-purple-500/30',
      text: 'text-purple-700 dark:text-purple-300',
    },
  },
  IN_PROGRESS: {
    status: 'IN_PROGRESS',
    label_en: 'In Progress',
    label_ar: 'جاري الإصلاح',
    step_number: 5,
    badge: {
      bg: 'bg-blue-500/10 dark:bg-blue-950/30',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-300',
    },
  },
  RESOLVED: {
    status: 'RESOLVED',
    label_en: 'Resolved',
    label_ar: 'تم الحل',
    step_number: 6,
    badge: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
  },
  CLOSED: {
    status: 'CLOSED',
    label_en: 'Closed',
    label_ar: 'مغلق نهائياً',
    step_number: 6,
    badge: {
      bg: 'bg-zinc-500/10 dark:bg-zinc-800/30',
      border: 'border-zinc-500/30',
      text: 'text-zinc-600 dark:text-zinc-400',
    },
  },
  REJECTED: {
    status: 'REJECTED',
    label_en: 'Rejected',
    label_ar: 'مرفوض',
    step_number: 0,
    badge: {
      bg: 'bg-rose-500/10 dark:bg-rose-950/30',
      border: 'border-rose-500/30',
      text: 'text-rose-700 dark:text-rose-300',
    },
  },
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(currentStatus: TicketStatus): TicketStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

export function validateTransitionPayload(
  from: TicketStatus,
  to: TicketStatus,
  payload: TransitionPayload = {}
): TransitionValidationResult {
  if (!canTransition(from, to)) {
    if (from === 'CLOSED') {
      return {
        valid: false,
        error: `Invalid transition from ${from} to ${to}. Ticket is in terminal state CLOSED and cannot be modified.`,
      };
    }
    const allowed = getAllowedTransitions(from).join(', ') || 'None';
    return {
      valid: false,
      error: `Invalid transition from ${from} to ${to}. Allowed transitions: [${allowed}]`,
    };
  }

  // Guard: CONTRACTOR_CONTACTED requires assigned_contractor_id or contractor_id
  if (to === 'CONTRACTOR_CONTACTED') {
    const contractorId = payload.assigned_contractor_id || payload.contractor_id;
    if (!contractorId || contractorId.trim() === '') {
      return {
        valid: false,
        error: 'assigned_contractor_id is required when transitioning to CONTRACTOR_CONTACTED',
      };
    }
  }

  // Guard: APPOINTMENT_SCHEDULED requires valid appointment_date
  if (to === 'APPOINTMENT_SCHEDULED') {
    if (!payload.appointment_date || payload.appointment_date.trim() === '') {
      return {
        valid: false,
        error: 'appointment_date is required when transitioning to APPOINTMENT_SCHEDULED',
      };
    }
    const raw = payload.appointment_date.trim();
    // Verify ISO 8601 date or datetime format (YYYY-MM-DD or YYYY-MM-DD[T ]HH:mm(:ss(.sss)?)?(Z|[+-]HH:mm)?)
    const isoPattern = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
    if (!isoPattern.test(raw)) {
      return {
        valid: false,
        error: 'appointment_date must be a valid date format (ISO 8601, e.g. YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)',
      };
    }
    const parsedDate = new Date(raw.replace(' ', 'T'));
    if (isNaN(parsedDate.getTime())) {
      return {
        valid: false,
        error: 'appointment_date must be a valid date format',
      };
    }
    const [yearStr, monthStr, dayStr] = raw.slice(0, 10).split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return {
        valid: false,
        error: 'appointment_date must be a valid date format (invalid calendar month or day)',
      };
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      return {
        valid: false,
        error: 'appointment_date must be a valid date format (invalid calendar day)',
      };
    }
    if (year < 2026) {
      return {
        valid: false,
        error: 'appointment_date must be a valid date format with year >= 2026',
      };
    }
  }

  // Guard: REJECTED requires rejection_reason or rejection_reason_code + rejection_notes
  if (to === 'REJECTED') {
    const reason = payload.rejection_reason || payload.rejection_notes || payload.rejection_reason_code;
    if (!reason || reason.trim().length < 3) {
      return {
        valid: false,
        error: 'rejection_reason is required (minimum 3 characters) when rejecting a ticket',
      };
    }
  }

  // Guard: RESOLVED requires resolution_notes
  if (to === 'RESOLVED') {
    if (!payload.resolution_notes || payload.resolution_notes.trim().length < 3) {
      return {
        valid: false,
        error: 'resolution_notes is required (minimum 3 characters) when resolving a ticket',
      };
    }
  }

  // Guard: Reopening to UNDER_REVIEW from REJECTED or RESOLVED requires reopen_reason or notes
  if (to === 'UNDER_REVIEW' && (from === 'REJECTED' || from === 'RESOLVED')) {
    const reason = payload.reopen_reason || payload.notes;
    if (!reason || reason.trim().length === 0) {
      return {
        valid: false,
        error: `Reopening ticket from ${from} to UNDER_REVIEW requires reopen_reason`,
      };
    }
  }

  return { valid: true };
}

/**
 * Compatible alias function matching the test helper signature
 */
export function validateTransition(
  current: TicketStatus,
  next: TicketStatus,
  payload: TransitionPayload = {}
): { valid: boolean; error?: string } {
  return validateTransitionPayload(current, next, payload);
}

/**
 * Maps any lifecycle status to the resident 5-segment progression stepper
 */
export function getStepperProgress(status: TicketStatus | string): number {
  switch (status) {
    case 'SUBMITTED':
      return 1;
    case 'UNDER_REVIEW':
      return 2;
    case 'CONTRACTOR_CONTACTED':
    case 'APPOINTMENT_SCHEDULED':
      return 3;
    case 'IN_PROGRESS':
      return 4;
    case 'RESOLVED':
    case 'CLOSED':
      return 5;
    case 'REJECTED':
      return 0; // Special alert state
    default:
      return 1;
  }
}
