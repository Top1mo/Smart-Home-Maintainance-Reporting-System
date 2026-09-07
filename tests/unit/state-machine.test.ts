import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getAllowedTransitions,
  validateTransitionPayload,
  validateTransition,
  STATE_METADATA,
  getStepperProgress,
  TicketStatus,
} from '@/lib/state-machine';

describe('8-Stage State Machine Engine', () => {
  describe('Transition Graph Permissibility', () => {
    it('allows valid forward lifecycle progression', () => {
      expect(canTransition('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
      expect(canTransition('UNDER_REVIEW', 'CONTRACTOR_CONTACTED')).toBe(true);
      expect(canTransition('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED')).toBe(true);
      expect(canTransition('APPOINTMENT_SCHEDULED', 'IN_PROGRESS')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
      expect(canTransition('RESOLVED', 'CLOSED')).toBe(true);
    });

    it('allows rejection from early stages', () => {
      expect(canTransition('SUBMITTED', 'REJECTED')).toBe(true);
      expect(canTransition('UNDER_REVIEW', 'REJECTED')).toBe(true);
      expect(canTransition('CONTRACTOR_CONTACTED', 'REJECTED')).toBe(true);
    });

    it('allows safe fallback and reopening transitions', () => {
      expect(canTransition('CONTRACTOR_CONTACTED', 'UNDER_REVIEW')).toBe(true);
      expect(canTransition('APPOINTMENT_SCHEDULED', 'CONTRACTOR_CONTACTED')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'APPOINTMENT_SCHEDULED')).toBe(true);
      expect(canTransition('RESOLVED', 'IN_PROGRESS')).toBe(true);
      expect(canTransition('RESOLVED', 'UNDER_REVIEW')).toBe(true);
      expect(canTransition('REJECTED', 'UNDER_REVIEW')).toBe(true);
    });

    it('strictly forbids invalid illegal transitions', () => {
      expect(canTransition('SUBMITTED', 'CLOSED')).toBe(false);
      expect(canTransition('SUBMITTED', 'IN_PROGRESS')).toBe(false);
      expect(canTransition('SUBMITTED', 'RESOLVED')).toBe(false);
      expect(canTransition('UNDER_REVIEW', 'CLOSED')).toBe(false);
      expect(canTransition('REJECTED', 'IN_PROGRESS')).toBe(false);
      expect(canTransition('CLOSED', 'IN_PROGRESS')).toBe(false);
      expect(canTransition('CLOSED', 'UNDER_REVIEW')).toBe(false);
      expect(canTransition('SUBMITTED', 'SUBMITTED')).toBe(false);
    });

    it('returns correct allowed transitions per status', () => {
      expect(getAllowedTransitions('SUBMITTED')).toEqual(['UNDER_REVIEW', 'REJECTED']);
      expect(getAllowedTransitions('UNDER_REVIEW')).toEqual(['CONTRACTOR_CONTACTED', 'REJECTED']);
      expect(getAllowedTransitions('CLOSED')).toEqual([]);
    });

    it('rejects all transitions from terminal state CLOSED', () => {
      const targetStates: TicketStatus[] = [
        'SUBMITTED',
        'UNDER_REVIEW',
        'CONTRACTOR_CONTACTED',
        'APPOINTMENT_SCHEDULED',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'REJECTED',
      ];
      for (const target of targetStates) {
        expect(canTransition('CLOSED', target)).toBe(false);
        const res = validateTransitionPayload('CLOSED', target);
        expect(res.valid).toBe(false);
        expect(res.error).toContain('terminal state CLOSED');
      }
    });
  });

  describe('Transition Payload Guards', () => {
    it('requires assigned_contractor_id when transitioning to CONTRACTOR_CONTACTED', () => {
      const invalid = validateTransitionPayload('UNDER_REVIEW', 'CONTRACTOR_CONTACTED', {
        to_status: 'CONTRACTOR_CONTACTED',
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toMatch(/assigned_contractor_id is required/);

      const valid = validateTransitionPayload('UNDER_REVIEW', 'CONTRACTOR_CONTACTED', {
        to_status: 'CONTRACTOR_CONTACTED',
        assigned_contractor_id: 'cont_elec',
      });
      expect(valid.valid).toBe(true);

      // Compatible with contractor_id alias
      const validAlias = validateTransition('UNDER_REVIEW', 'CONTRACTOR_CONTACTED', {
        contractor_id: 'cont_elec',
      });
      expect(validAlias.valid).toBe(true);
    });

    it('requires valid appointment_date when transitioning to APPOINTMENT_SCHEDULED', () => {
      const missing = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
      });
      expect(missing.valid).toBe(false);
      expect(missing.error).toMatch(/appointment_date is required/);

      const invalidDate = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: 'invalid-date',
      });
      expect(invalidDate.valid).toBe(false);
      expect(invalidDate.error).toMatch(/valid date format/);

      // Reject non-date strings ending in digits (V8 leniency bypass)
      const invalidTrailingDigits = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: 'invalid-date-string-1234',
      });
      expect(invalidTrailingDigits.valid).toBe(false);
      expect(invalidTrailingDigits.error).toMatch(/valid date format/);

      // Reject historical years prior to 2026
      const invalidPastYear = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: '2025-12-31',
      });
      expect(invalidPastYear.valid).toBe(false);
      expect(invalidPastYear.error).toMatch(/valid date format/);

      const validIso = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: '2026-09-08T10:00:00Z',
      });
      expect(validIso.valid).toBe(true);

      // Verify SQL datetime format compatibility
      const validSql = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: '2026-09-08 11:00:00',
      });
      expect(validSql.valid).toBe(true);
    });

    it('requires rejection_reason (min 3 chars) when rejecting ticket', () => {
      const missing = validateTransitionPayload('UNDER_REVIEW', 'REJECTED', {
        to_status: 'REJECTED',
      });
      expect(missing.valid).toBe(false);
      expect(missing.error).toMatch(/rejection_reason is required/);

      const tooShort = validateTransitionPayload('UNDER_REVIEW', 'REJECTED', {
        to_status: 'REJECTED',
        rejection_reason: 'no',
      });
      expect(tooShort.valid).toBe(false);

      const valid = validateTransitionPayload('UNDER_REVIEW', 'REJECTED', {
        to_status: 'REJECTED',
        rejection_reason: 'Duplicate ticket filed by tenant',
      });
      expect(valid.valid).toBe(true);
    });

    it('requires resolution_notes (min 3 chars) when resolving ticket', () => {
      const missing = validateTransitionPayload('IN_PROGRESS', 'RESOLVED', {
        to_status: 'RESOLVED',
      });
      expect(missing.valid).toBe(false);
      expect(missing.error).toMatch(/resolution_notes is required/);

      const valid = validateTransitionPayload('IN_PROGRESS', 'RESOLVED', {
        to_status: 'RESOLVED',
        resolution_notes: 'Replaced faulty mixer valve and tested under pressure',
      });
      expect(valid.valid).toBe(true);
    });
  });

  describe('Bilingual State Metadata & Progression Stepper', () => {
    it('provides valid Egyptian Arabic and English names for all 8 states', () => {
      const statuses: TicketStatus[] = [
        'SUBMITTED',
        'UNDER_REVIEW',
        'CONTRACTOR_CONTACTED',
        'APPOINTMENT_SCHEDULED',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'REJECTED',
      ];

      for (const st of statuses) {
        const meta = STATE_METADATA[st];
        expect(meta).toBeDefined();
        expect(meta.label_en.length).toBeGreaterThan(0);
        expect(meta.label_ar.length).toBeGreaterThan(0);
        expect(meta.badge.bg).toBeDefined();
        expect(meta.badge.border).toBeDefined();
      }

      expect(STATE_METADATA.SUBMITTED.label_ar).toBe('تم التقديم');
      expect(STATE_METADATA.UNDER_REVIEW.label_ar).toBe('قيد المراجعة');
      expect(STATE_METADATA.RESOLVED.label_ar).toBe('تم الحل');
      expect(STATE_METADATA.REJECTED.label_ar).toBe('مرفوض');
    });

    it('maps lifecycle statuses to 5-segment resident progress steps correctly', () => {
      expect(getStepperProgress('SUBMITTED')).toBe(1);
      expect(getStepperProgress('UNDER_REVIEW')).toBe(2);
      expect(getStepperProgress('CONTRACTOR_CONTACTED')).toBe(3);
      expect(getStepperProgress('APPOINTMENT_SCHEDULED')).toBe(3);
      expect(getStepperProgress('IN_PROGRESS')).toBe(4);
      expect(getStepperProgress('RESOLVED')).toBe(5);
      expect(getStepperProgress('CLOSED')).toBe(5);
      expect(getStepperProgress('REJECTED')).toBe(0);
    });
  });
});
