import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';
import {
  canTransition,
  getAllowedTransitions,
  validateTransitionPayload,
  getStepperProgress,
  VALID_TRANSITIONS,
  STATE_METADATA,
  TicketStatus,
} from '@/lib/state-machine';
import { GET as getTrades } from '@/app/api/trades/route';
import { POST as postTickets } from '@/app/api/tickets/route';
import { POST as postTransition } from '@/app/api/tickets/[id]/transition/route';

describe('Milestone 1 Empirical Challenger 2: Taxonomy, ELV, Hazards, Arabic, State Machine Edge Cases', () => {
  beforeEach(() => {
    const db = getDb();
    seedDatabase(db, true);
  });

  describe('1. 11-Trade Taxonomy Completeness & Hierarchy (ORIGINAL_REQUEST R2)', () => {
    const REQUIRED_11_TRADES = [
      { slug: 'PLUMBING', en: 'Plumbing', ar: 'سباكة' },
      { slug: 'ELECTRICAL', en: 'Electrical', ar: 'كهرباء' },
      { slug: 'HVAC', en: 'HVAC & Air Conditioning', ar: 'تكييف وتبريد' },
      { slug: 'CARPENTRY', en: 'Carpentry & Joinery', ar: 'نجارة وأبواب' },
      { slug: 'ALUMINUM', en: 'Aluminum & Glazing Works', ar: 'ألوميتال وزجاج' },
      { slug: 'GYPSUM', en: 'Gypsum Boards & False Ceilings', ar: 'جبس بورد وأسقف معلقة' },
      { slug: 'PAINTING', en: 'Painting & Surface Finishes', ar: 'نقاشة ودهانات' },
      { slug: 'POOL', en: 'Swimming Pool & Water Amenities', ar: 'حمام سباحة' },
      { slug: 'CIVIL_TILING', en: 'Civil, Masonry & Tiling', ar: 'سيراميك وبلاط وبناء' },
      { slug: 'APPLIANCES', en: 'Major Landlord Appliances', ar: 'أجهزة منزلية' },
      { slug: 'GROUNDS_EXTERIOR', en: 'Grounds, Exterior & Roofing', ar: 'واجهات وأسطح وحدائق' },
    ];

    it('contains exactly the 11 required trade domains in SQLite database', () => {
      const db = getDb();
      const rows: any[] = db.prepare('SELECT * FROM trades ORDER BY order_index ASC').all();
      expect(rows).toHaveLength(11);

      for (const required of REQUIRED_11_TRADES) {
        const found = rows.find((r) => r.slug === required.slug);
        expect(found, `Missing trade: ${required.slug}`).toBeDefined();
        expect(found.name_en).toBe(required.en);
        expect(found.name_ar).toBe(required.ar);
        expect(found.icon).toBeTruthy();
        expect(found.order_index).toBeGreaterThanOrEqual(1);
        expect(found.order_index).toBeLessThanOrEqual(11);
      }
    });

    it('verifies 3-tier hierarchy: every trade has subcategories and every subcategory has symptoms', () => {
      const db = getDb();
      const trades: any[] = db.prepare('SELECT id, slug FROM trades').all();

      for (const trade of trades) {
        const subcats: any[] = db
          .prepare('SELECT id, slug, name_en, name_ar FROM subcategories WHERE trade_id = ?')
          .all(trade.id);
        expect(
          subcats.length,
          `Trade ${trade.slug} has no subcategories!`
        ).toBeGreaterThanOrEqual(3);

        for (const sub of subcats) {
          const symptoms: any[] = db
            .prepare('SELECT id, symptom_en, symptom_ar FROM fault_symptoms WHERE subcategory_id = ?')
            .all(sub.id);
          expect(
            symptoms.length,
            `Subcategory ${sub.slug} in trade ${trade.slug} has no symptoms!`
          ).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('confirms zero orphaned subcategories or symptoms in database', () => {
      const db = getDb();
      // Check for subcategories with invalid trade_id
      const orphanedSubcats: any[] = db
        .prepare('SELECT s.id, s.trade_id FROM subcategories s LEFT JOIN trades t ON s.trade_id = t.id WHERE t.id IS NULL')
        .all();
      expect(orphanedSubcats).toHaveLength(0);

      // Check for symptoms with invalid subcategory_id
      const orphanedSymptoms: any[] = db
        .prepare('SELECT fs.id, fs.subcategory_id FROM fault_symptoms fs LEFT JOIN subcategories s ON fs.subcategory_id = s.id WHERE s.id IS NULL')
        .all();
      expect(orphanedSymptoms).toHaveLength(0);
    });

    it('GET /api/trades returns full 3-tier hierarchy structure', async () => {
      const res = await getTrades();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.trades).toHaveLength(11);

      let totalSubcats = 0;
      let totalSymptoms = 0;
      for (const trade of data.trades) {
        expect(trade.subcategories).toBeDefined();
        expect(trade.subcategories.length).toBeGreaterThan(0);
        totalSubcats += trade.subcategories.length;
        for (const sub of trade.subcategories) {
          expect(sub.symptoms).toBeDefined();
          expect(sub.symptoms.length).toBeGreaterThan(0);
          totalSymptoms += sub.symptoms.length;
        }
      }

      // Should have 35+ subcategories and 100+ symptoms
      expect(totalSubcats).toBeGreaterThanOrEqual(37);
      expect(totalSymptoms).toBeGreaterThanOrEqual(120);
    });
  });

  describe('2. Dedicated Low-Voltage ELV Sub-branch Verification', () => {
    const EXPECTED_ELV_SUBCATS = [
      { id: 'sub_elv_cctv', slug: 'ELECTRICAL_ELV_CCTV', en: 'CCTV Camera Surveillance' },
      { id: 'sub_elv_intercom', slug: 'ELECTRICAL_ELV_INTERCOM', en: 'Intercom & Access Control' },
      { id: 'sub_elv_wifi', slug: 'ELECTRICAL_ELV_WIFI', en: 'Wi-Fi Access Points & LAN' },
      { id: 'sub_elv_gates', slug: 'ELECTRICAL_ELV_GATES', en: 'Automated Gates & Barriers' },
    ];

    it('verifies all 4 mandated ELV subcategories are nested under trade_electrical with is_elv = 1', () => {
      const db = getDb();
      const elvRows: any[] = db
        .prepare('SELECT * FROM subcategories WHERE trade_id = ? AND is_elv = 1')
        .all('trade_electrical');

      expect(elvRows).toHaveLength(4);

      for (const expected of EXPECTED_ELV_SUBCATS) {
        const found = elvRows.find((r) => r.id === expected.id);
        expect(found, `Missing ELV subcategory: ${expected.id}`).toBeDefined();
        expect(found.slug).toBe(expected.slug);
        expect(found.name_en).toBe(expected.en);
        expect(found.is_elv).toBe(1);
      }
    });

    it('verifies non-ELV electrical subcategories have is_elv = 0', () => {
      const db = getDb();
      const nonElvRows: any[] = db
        .prepare('SELECT * FROM subcategories WHERE trade_id = ? AND is_elv = 0')
        .all('trade_electrical');

      expect(nonElvRows.length).toBeGreaterThanOrEqual(4);
      for (const r of nonElvRows) {
        expect(r.is_elv).toBe(0);
      }
    });

    it('verifies ELV symptoms cover critical device failures (CCTV, intercom, wifi, gates)', () => {
      const db = getDb();
      for (const expected of EXPECTED_ELV_SUBCATS) {
        const symptoms: any[] = db
          .prepare('SELECT * FROM fault_symptoms WHERE subcategory_id = ?')
          .all(expected.id);

        expect(
          symptoms.length,
          `ELV subcategory ${expected.id} should have at least 3 symptoms`
        ).toBeGreaterThanOrEqual(3);

        for (const s of symptoms) {
          expect(s.symptom_en.length).toBeGreaterThan(5);
          expect(s.symptom_ar.length).toBeGreaterThan(5);
        }
      }
    });

    it('verifies specialized ELV contractor exists in seed data', () => {
      const db = getDb();
      const contractor: any = db.prepare('SELECT * FROM contractors WHERE id = ?').get('cont_elv');
      expect(contractor).toBeDefined();
      expect(contractor.trade_id).toBe('trade_electrical');
      const specialties = JSON.parse(contractor.specialties);
      expect(specialties).toContain('CCTV');
      expect(specialties).toContain('Intercom');
      expect(specialties).toContain('Automated Gates');
      expect(specialties).toContain('Wi-Fi Networks');
    });
  });

  describe('3. Hazard Definitions, Safety Flags & Emergency Instructions', () => {
    it('verifies hazardous faults exist for sparks, water near power, ceiling sag, gas, and electric shock', () => {
      const db = getDb();
      const hazards: any[] = db
        .prepare(`
          SELECT fs.*, sc.name_en as subcat_name, t.name_en as trade_name 
          FROM fault_symptoms fs
          JOIN subcategories sc ON fs.subcategory_id = sc.id
          JOIN trades t ON sc.trade_id = t.id
          WHERE fs.is_hazard = 1
        `)
        .all();

      expect(hazards.length).toBeGreaterThanOrEqual(15);

      // Verify specific mandatory hazard categories
      const sparksHazard = hazards.some(
        (h) => /spark|arc|شياط|شرز|ماس/i.test(h.symptom_en) || /spark|arc|شياط|شرز|ماس/i.test(h.symptom_ar)
      );
      expect(sparksHazard, 'Must have sparks / arcing hazard definition').toBe(true);

      const waterNearPowerHazard = hazards.some(
        (h) =>
          (/water.*electrical|water.*power|تسريب.*كهرباء/i.test(h.symptom_en) ||
           /مياه.*كهرباء|ماس.*مياه/i.test(h.symptom_ar)) ||
          h.hazard_type === 'WATER_ELECTRICAL_HAZARD'
      );
      expect(waterNearPowerHazard, 'Must have water near power hazard definition').toBe(true);

      const ceilingSagHazard = hazards.some(
        (h) =>
          (/sag|collapse|سقوط|هبوط|ترخيم/i.test(h.symptom_en) ||
           /سقوط|هبوط|ترخيم/i.test(h.symptom_ar)) ||
          h.hazard_type === 'STRUCTURAL_COLLAPSE_HAZARD'
      );
      expect(ceilingSagHazard, 'Must have ceiling sag risk hazard definition').toBe(true);

      const gasLeakHazard = hazards.some(
        (h) => /gas.*leak|ريحة غاز|تسريب غاز/i.test(h.symptom_en) || /غاز/i.test(h.symptom_ar)
      );
      expect(gasLeakHazard, 'Must have gas leak hazard definition').toBe(true);

      const shockHazard = hazards.some(
        (h) => /shock|electrocution|صعق/i.test(h.symptom_en) || /صعق|ماس/i.test(h.symptom_ar)
      );
      expect(shockHazard, 'Must have electric shock hazard definition').toBe(true);
    });

    it('verifies all hazard symptoms have mandatory safety flags, CRITICAL severity, and bilingual emergency instructions', () => {
      const db = getDb();
      const hazards: any[] = db
        .prepare('SELECT * FROM fault_symptoms WHERE is_hazard = 1')
        .all();

      for (const h of hazards) {
        expect(h.is_hazard).toBe(1);
        expect(['CRITICAL', 'HIGH']).toContain(h.default_severity);

        expect(h.hazard_type, `Hazard type missing for ${h.id}`).toBeTruthy();
        expect(typeof h.hazard_type).toBe('string');
        expect(h.hazard_type.length).toBeGreaterThan(3);

        expect(
          h.hazard_instruction_en,
          `English emergency instruction missing for ${h.id}`
        ).toBeTruthy();
        expect(h.hazard_instruction_en.length).toBeGreaterThan(15);

        expect(
          h.hazard_instruction_ar,
          `Arabic emergency instruction missing for ${h.id}`
        ).toBeTruthy();
        expect(h.hazard_instruction_ar.length).toBeGreaterThan(15);
      }
    });

    it('POST /api/tickets auto-flags hazard and elevates severity to CRITICAL on hazard keywords in description', async () => {
      // Create a ticket with a non-hazard symptom (e.g. sym_plumb_tap) but hazardous description
      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_number: '101',
          trade_id: 'trade_plumbing',
          subcategory_id: 'sub_plumb_valves',
          symptom_id: 'sym_plumb_tap', // non-hazard symptom
          custom_description: 'Tap dripping and there are sparks coming from nearby socket شرز كهرباء خطير',
          resident_name: 'Test Hazard Resident',
          resident_phone: '+20 100 999 8888',
        }),
      });

      const res = await postTickets(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ticket.is_hazard).toBe(true);
      expect(data.ticket.severity).toBe('CRITICAL');
      expect(data.ticket.urgency).toBe('EMERGENCY');
    });
  });

  describe('4. Arabic String Integrity & Authentic Egyptian Terminology', () => {
    it('verifies all Arabic strings are free of broken unicode escapes, mojibake, and corrupt chars', () => {
      const db = getDb();

      const checkStrings = (table: string, columns: string[]) => {
        const rows: any[] = db.prepare(`SELECT ${columns.join(', ')} FROM ${table}`).all();
        for (const row of rows) {
          for (const col of columns) {
            const val = row[col];
            if (typeof val === 'string' && val.length > 0) {
              // Check for unicode escapes like \u06xx or \x
              expect(val).not.toMatch(/\\u[0-9a-fA-F]{4}/);
              expect(val).not.toMatch(/\\x[0-9a-fA-F]{2}/);
              // Check for UTF-8 mojibake patterns
              expect(val).not.toMatch(/Ãƒ|Ã‚|Ã©|Ã |Ã¢/);
              // Check for replacement character
              expect(val).not.toContain('\uFFFD');
              // Check for suspicious question mark runs like "???"
              expect(val).not.toMatch(/\?{2,}/);
              // Verify presence of valid Arabic characters
              expect(val).toMatch(/[\u0600-\u06FF]/);
            }
          }
        }
      };

      checkStrings('trades', ['name_ar']);
      checkStrings('subcategories', ['name_ar']);
      checkStrings('fault_symptoms', ['symptom_ar', 'name_ar']);
      checkStrings('properties', ['name_ar', 'address_ar']);
      checkStrings('contractors', ['name_ar']);
    });

    it('verifies authentic Egyptian market maintenance terms are utilized', () => {
      const db = getDb();
      const allArabicText: string[] = [];

      const collect = (table: string, col: string) => {
        const rows: any[] = db.prepare(`SELECT ${col} FROM ${table}`).all();
        for (const r of rows) {
          if (r[col]) allArabicText.push(r[col]);
        }
      };

      collect('trades', 'name_ar');
      collect('subcategories', 'name_ar');
      collect('fault_symptoms', 'symptom_ar');

      const combinedText = allArabicText.join(' ');

      // Check key Egyptian technical terms
      const egyptianTerms = [
        'سباكة',
        'كهرباء',
        'تكييف',
        'نجارة',
        'ألوميتال',
        'جبس بورد',
        'نقاشة',
        'شطاف',
        'محبس',
        'برايز',
        'فيش',
        'ماس',
        'سيكوريت',
        'كوالين',
        'محارة',
        'بوتاجازات',
      ];

      for (const term of egyptianTerms) {
        expect(
          combinedText.includes(term),
          `Expected Egyptian market term "${term}" to be present in taxonomy`
        ).toBe(true);
      }
    });

    it('verifies state machine Arabic metadata labels are grammatically correct and authentic', () => {
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

      for (const status of statuses) {
        const meta = STATE_METADATA[status];
        expect(meta).toBeDefined();
        expect(meta.label_ar).toBeTruthy();
        expect(meta.label_ar).toMatch(/[\u0600-\u06FF]/);
        expect(meta.label_ar).not.toContain('\uFFFD');
      }

      expect(STATE_METADATA.SUBMITTED.label_ar).toBe('تم التقديم');
      expect(STATE_METADATA.UNDER_REVIEW.label_ar).toBe('قيد المراجعة');
      expect(STATE_METADATA.CONTRACTOR_CONTACTED.label_ar).toBe('تم التواصل مع الفني');
      expect(STATE_METADATA.APPOINTMENT_SCHEDULED.label_ar).toBe('موعد محدد');
      expect(STATE_METADATA.IN_PROGRESS.label_ar).toBe('جاري الإصلاح');
      expect(STATE_METADATA.RESOLVED.label_ar).toBe('تم الحل');
      expect(STATE_METADATA.CLOSED.label_ar).toBe('مغلق نهائياً');
      expect(STATE_METADATA.REJECTED.label_ar).toBe('مرفوض');
    });
  });

  describe('5. State Machine Edge Cases: Transitions, Rollbacks & Guards', () => {
    it('verifies forward standard progression paths', () => {
      expect(canTransition('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
      expect(canTransition('UNDER_REVIEW', 'CONTRACTOR_CONTACTED')).toBe(true);
      expect(canTransition('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED')).toBe(true);
      expect(canTransition('APPOINTMENT_SCHEDULED', 'IN_PROGRESS')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
      expect(canTransition('RESOLVED', 'CLOSED')).toBe(true);
    });

    it('verifies all valid rollback transitions', () => {
      // 1. Rollback from CONTRACTOR_CONTACTED back to UNDER_REVIEW
      expect(canTransition('CONTRACTOR_CONTACTED', 'UNDER_REVIEW')).toBe(true);

      // 2. Rollback from APPOINTMENT_SCHEDULED back to CONTRACTOR_CONTACTED
      expect(canTransition('APPOINTMENT_SCHEDULED', 'CONTRACTOR_CONTACTED')).toBe(true);

      // 3. Rollback from IN_PROGRESS back to APPOINTMENT_SCHEDULED
      expect(canTransition('IN_PROGRESS', 'APPOINTMENT_SCHEDULED')).toBe(true);

      // 4. Rollback from RESOLVED back to IN_PROGRESS (e.g. fix failed QA)
      expect(canTransition('RESOLVED', 'IN_PROGRESS')).toBe(true);

      // 5. Rollback from RESOLVED back to UNDER_REVIEW
      expect(canTransition('RESOLVED', 'UNDER_REVIEW')).toBe(true);

      // 6. CLOSED is terminal and cannot transition to UNDER_REVIEW
      expect(canTransition('CLOSED', 'UNDER_REVIEW')).toBe(false);
    });

    it('verifies reopening of REJECTED tickets upon tenant dispute', () => {
      // REJECTED can transition to UNDER_REVIEW
      expect(canTransition('REJECTED', 'UNDER_REVIEW')).toBe(true);

      // But cannot bypass straight to other states
      expect(canTransition('REJECTED', 'CONTRACTOR_CONTACTED')).toBe(false);
      expect(canTransition('REJECTED', 'APPOINTMENT_SCHEDULED')).toBe(false);
      expect(canTransition('REJECTED', 'IN_PROGRESS')).toBe(false);
      expect(canTransition('REJECTED', 'RESOLVED')).toBe(false);
      expect(canTransition('REJECTED', 'CLOSED')).toBe(false);

      // Guard check: Reopening REJECTED requires reopen_reason
      const withoutReason = validateTransitionPayload('REJECTED', 'UNDER_REVIEW', {});
      expect(withoutReason.valid).toBe(false);
      expect(withoutReason.error).toContain('reopen_reason');

      const withReason = validateTransitionPayload('REJECTED', 'UNDER_REVIEW', {
        reopen_reason: 'Resident provided additional warranty documentation proving landlord coverage',
      });
      expect(withReason.valid).toBe(true);
    });

    it('strictly rejects invalid leapfrog or illegal transitions', () => {
      const illegalCases: [TicketStatus, TicketStatus][] = [
        ['SUBMITTED', 'IN_PROGRESS'],
        ['SUBMITTED', 'APPOINTMENT_SCHEDULED'],
        ['SUBMITTED', 'RESOLVED'],
        ['SUBMITTED', 'CLOSED'],
        ['UNDER_REVIEW', 'IN_PROGRESS'],
        ['UNDER_REVIEW', 'RESOLVED'],
        ['UNDER_REVIEW', 'CLOSED'],
        ['CONTRACTOR_CONTACTED', 'RESOLVED'],
        ['CONTRACTOR_CONTACTED', 'CLOSED'],
        ['APPOINTMENT_SCHEDULED', 'RESOLVED'],
        ['APPOINTMENT_SCHEDULED', 'CLOSED'],
        ['IN_PROGRESS', 'CLOSED'],
        ['CLOSED', 'IN_PROGRESS'],
        ['CLOSED', 'RESOLVED'],
        ['CLOSED', 'CONTRACTOR_CONTACTED'],
        ['CLOSED', 'UNDER_REVIEW'],
        ['SUBMITTED', 'SUBMITTED'],
        ['IN_PROGRESS', 'IN_PROGRESS'],
      ];

      for (const [from, to] of illegalCases) {
        expect(canTransition(from, to), `Transition from ${from} to ${to} should be forbidden`).toBe(false);
        const res = validateTransitionPayload(from, to);
        expect(res.valid).toBe(false);
        expect(res.error).toContain(`Invalid transition from ${from} to ${to}`);
      }
    });

    it('enforces payload validation guards on target states', () => {
      // CONTRACTOR_CONTACTED guard
      const missingContractor = validateTransitionPayload('UNDER_REVIEW', 'CONTRACTOR_CONTACTED', {});
      expect(missingContractor.valid).toBe(false);
      expect(missingContractor.error).toContain('assigned_contractor_id');

      const validContractor = validateTransitionPayload('UNDER_REVIEW', 'CONTRACTOR_CONTACTED', {
        assigned_contractor_id: 'cont_elec',
      });
      expect(validContractor.valid).toBe(true);

      // APPOINTMENT_SCHEDULED guard
      const missingDate = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {});
      expect(missingDate.valid).toBe(false);
      expect(missingDate.error).toContain('appointment_date');

      const invalidDate = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        appointment_date: 'not-a-valid-date',
      });
      expect(invalidDate.valid).toBe(false);
      expect(invalidDate.error).toContain('valid date');

      const invalidTrailing = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        appointment_date: 'invalid-date-string-1234',
      });
      expect(invalidTrailing.valid).toBe(false);
      expect(invalidTrailing.error).toContain('valid date');

      const invalidYear = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        appointment_date: '2024-01-01',
      });
      expect(invalidYear.valid).toBe(false);
      expect(invalidYear.error).toContain('valid date');

      const validDate = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        appointment_date: '2026-09-15T10:00:00Z',
      });
      expect(validDate.valid).toBe(true);

      // REJECTED guard
      const missingRejectReason = validateTransitionPayload('UNDER_REVIEW', 'REJECTED', {});
      expect(missingRejectReason.valid).toBe(false);
      expect(missingRejectReason.error).toContain('rejection_reason');

      const shortRejectReason = validateTransitionPayload('UNDER_REVIEW', 'REJECTED', {
        rejection_reason: 'no',
      });
      expect(shortRejectReason.valid).toBe(false);

      const validRejectReason = validateTransitionPayload('UNDER_REVIEW', 'REJECTED', {
        rejection_reason: 'Damage caused by resident negligence; out of landlord scope',
      });
      expect(validRejectReason.valid).toBe(true);

      // RESOLVED guard
      const missingResolveNotes = validateTransitionPayload('IN_PROGRESS', 'RESOLVED', {});
      expect(missingResolveNotes.valid).toBe(false);
      expect(missingResolveNotes.error).toContain('resolution_notes');

      const validResolveNotes = validateTransitionPayload('IN_PROGRESS', 'RESOLVED', {
        resolution_notes: 'Replaced faulty circuit breaker and certified safety',
      });
      expect(validResolveNotes.valid).toBe(true);
    });

    it('verifies resident 5-segment stepper progression mapping', () => {
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

  describe('6. REST API State Transition Route Edge Cases (/api/tickets/[id]/transition)', () => {
    it('returns 404 for non-existent ticket ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets/non_existent_id_9999/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_status: 'UNDER_REVIEW' }),
      });

      const res = await postTransition(req, { params: Promise.resolve({ id: 'non_existent_id_9999' }) });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('Ticket not found');
    });

    it('returns 400 when to_status is omitted', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_1/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'missing to_status' }),
      });

      const res = await postTransition(req, { params: Promise.resolve({ id: 'tkt_1' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('to_status is required');
    });

    it('returns 400 when transitioning to CONTRACTOR_CONTACTED with non-existent contractor ID', async () => {
      // tkt_3 is UNDER_REVIEW
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_3/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: 'CONTRACTOR_CONTACTED',
          assigned_contractor_id: 'contractor_ghost_9999',
        }),
      });

      const res = await postTransition(req, { params: Promise.resolve({ id: 'tkt_3' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Assigned contractor not found');
    });

    it('successfully rolls back a ticket and records audit log transactionally', async () => {
      // tkt_6 is APPOINTMENT_SCHEDULED. Roll back to CONTRACTOR_CONTACTED
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_6/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: 'CONTRACTOR_CONTACTED',
          assigned_contractor_id: 'cont_hvac',
          actor_name: 'Dispatcher Sarah',
          notes: 'Contractor requested rescheduling due to emergency on another site',
        }),
      });

      const res = await postTransition(req, { params: Promise.resolve({ id: 'tkt_6' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ticket.status).toBe('CONTRACTOR_CONTACTED');

      // Verify audit event inserted
      const db = getDb();
      const events: any[] = db
        .prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY id DESC LIMIT 1')
        .all('tkt_6');
      expect(events).toHaveLength(1);
      expect(events[0].from_status).toBe('APPOINTMENT_SCHEDULED');
      expect(events[0].to_status).toBe('CONTRACTOR_CONTACTED');
      expect(events[0].notes).toContain('Contractor requested rescheduling');
    });

    it('successfully reopens a REJECTED ticket to UNDER_REVIEW with reopen reason', async () => {
      // tkt_13 is REJECTED
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_13/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: 'UNDER_REVIEW',
          actor_name: 'Supervisor Omar',
          reopen_reason: 'Resident filed appeal with invoice showing pre-existing issue',
        }),
      });

      const res = await postTransition(req, { params: Promise.resolve({ id: 'tkt_13' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ticket.status).toBe('UNDER_REVIEW');

      // Verify audit event
      const db = getDb();
      const event: any = db
        .prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY id DESC LIMIT 1')
        .get('tkt_13');
      expect(event.from_status).toBe('REJECTED');
      expect(event.to_status).toBe('UNDER_REVIEW');
      expect(event.notes).toContain('Reopened: Resident filed appeal');
    });
  });
});
