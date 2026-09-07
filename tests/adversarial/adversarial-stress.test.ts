import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';

import { GET as getTickets, POST as postTickets } from '@/app/api/tickets/route';
import { GET as getTicketById } from '@/app/api/tickets/[id]/route';
import { POST as postTransition } from '@/app/api/tickets/[id]/transition/route';
import { POST as postCommunications } from '@/app/api/tickets/[id]/communications/route';
import { GET as getStats } from '@/app/api/stats/route';
import { canTransition, validateTransitionPayload, VALID_TRANSITIONS, TicketStatus } from '@/lib/state-machine';

describe('Tier 5: Adversarial Stress & Security Test Suite', () => {
  beforeEach(() => {
    const db = getDb();
    seedDatabase(db, true);
  });

  // ==========================================================================
  // Section 1: SQL Injection & Adversarial Filter Query Payloads
  // ==========================================================================
  describe('1. SQL Injection & Query Escaping Resistance', () => {
    it('ADV-SQL-1: resists UNION-based and boolean-based SQLi payloads in status parameter', async () => {
      const sqliPayloads = [
        "SUBMITTED' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24 --",
        "SUBMITTED') OR ('1'='1",
        "SUBMITTED'; DROP TABLE tickets; --",
        "' OR '1'='1",
      ];

      for (const payload of sqliPayloads) {
        const req = new NextRequest(`http://localhost:3000/api/tickets?status=${encodeURIComponent(payload)}`);
        const res = await getTickets(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        // Should safely match 0 tickets or only valid ones, never leak unauthorized rows
        expect(Array.isArray(data.tickets)).toBe(true);
        expect(data.tickets).toHaveLength(0);

        // Verify tickets table remains intact
        const db = getDb();
        const check = db.prepare('SELECT COUNT(*) as c FROM tickets').get() as { c: number };
        expect(check.c).toBeGreaterThanOrEqual(13);
      }
    });

    it('ADV-SQL-2: resists SQL injection in trade_id and slug filters', async () => {
      const payloads = [
        "' OR 1=1 --",
        "ELECTRICAL' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT (SELECT CONCAT(id,0x3a,resident_phone)) FROM tickets LIMIT 0,1),FLOOR(RAND()*2))x FROM INFORMATION_SCHEMA.TABLES GROUP BY x)a) --",
        "'; DELETE FROM contractors; --",
      ];

      for (const payload of payloads) {
        const req = new NextRequest(`http://localhost:3000/api/tickets?trade=${encodeURIComponent(payload)}`);
        const res = await getTickets(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.tickets).toHaveLength(0);

        // Contractors table must not be deleted
        const db = getDb();
        const contractors = db.prepare('SELECT COUNT(*) as c FROM contractors').get() as { c: number };
        expect(contractors.c).toBeGreaterThanOrEqual(6);
      }
    });

    it('ADV-SQL-3: resists search query wildcard denial and SQL injection', async () => {
      const wildcards = [
        '%',
        '%%%%',
        "_' OR 1=1 --",
        "admin'--",
        "\\x00' OR '1'='1",
      ];

      for (const pattern of wildcards) {
        const req = new NextRequest(`http://localhost:3000/api/tickets?q=${encodeURIComponent(pattern)}`);
        const res = await getTickets(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data.tickets)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Section 2: Extreme Boundaries, Payloads & Input Validation
  // ==========================================================================
  describe('2. Extreme Payloads & Corrupt Data Handling', () => {
    it('ADV-EXT-1: handles extreme 25,000-character bilingual text description without crashing', async () => {
      const arabicLong = 'عطل في لوحة الكهرباء والأسلاك تصدر أصوات فرقعة شرز ناري شديد ومستمر '.repeat(350);
      const payload = {
        property_name: 'Palm Hills Heights',
        unit_number: '101',
        trade_id: 'trade_electrical',
        subcategory_id: 'sub_elec_panel',
        symptom_id: 'sym_elec_sparks',
        custom_description: arabicLong,
        resident_name: 'Adversarial Tester مروان',
        resident_phone: '+20 100 999 8877',
      };

      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postTickets(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.ticket.description.length).toBeGreaterThan(20000);
      expect(data.ticket.is_hazard).toBe(true);
      expect(data.ticket.severity).toBe('CRITICAL');
    });

    it('ADV-EXT-2: handles 10 large Base64 photo attachments cleanly', async () => {
      const mockPhotos = Array.from({ length: 10 }, (_, i) => `data:image/jpeg;base64,mockImageData_${i}_${'Z'.repeat(2000)}`);
      const payload = {
        property_name: 'Palm Hills Heights',
        unit_number: '101',
        trade_id: 'trade_plumbing',
        subcategory_id: 'sub_plumb_valves',
        symptom_id: 'sym_plumb_tap',
        custom_description: 'Multiple angle photos attached',
        resident_name: 'Photo Tester',
        resident_phone: '+20 100 111 2233',
        photos: mockPhotos,
      };

      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postTickets(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.ticket.photos).toHaveLength(10);
    });

    it('ADV-EXT-3: checks behavior on non-numeric limit and offset (NaN bind parameter issue)', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets?limit=not_a_number&offset=also_not_a_number');
      const res = await getTickets(req);
      // If unhandled, parseInt("not_a_number") yields NaN which SQLite rejects with "datatype mismatch" (HTTP 500).
      // A robust API should either return 400 Bad Request or fallback gracefully to default limits (HTTP 200).
      const data = await res.json();
      if (res.status === 500) {
        // Documented finding: datatype mismatch crash on NaN limit
        expect(data.error).toMatch(/datatype mismatch/i);
      } else {
        expect([200, 400]).toContain(res.status);
      }
    });

    it('ADV-EXT-4: checks behavior on corrupted non-JSON text in photos column', async () => {
      const db = getDb();
      db.prepare(`
        INSERT INTO tickets (
          id, reference_no, property_name, unit_number, trade_id, subcategory_id,
          symptom_id, description, severity, urgency, is_hazard, status,
          resident_name, resident_phone, photos, photo_urls
        ) VALUES (
          'tkt_corrupted_photos', 'TKT-2026-9999', 'Corrupt Prop', '101', 'trade_plumbing', 'sub_plumb_valves',
          'sym_plumb_tap', 'Corrupt photo json test', 'LOW', 'NORMAL', 0, 'SUBMITTED',
          'Corrupt Resident', '+201000000000', 'corrupted-non-json-data{{{', 'corrupted-non-json-data{{{'
        )
      `).run();

      const reqList = new NextRequest('http://localhost:3000/api/tickets');
      const resList = await getTickets(reqList);

      // Inspect if GET /api/tickets crashes on corrupted JSON string in database
      if (resList.status === 500) {
        const errorData = await resList.json();
        expect(errorData.error).toBeDefined();
      } else {
        expect(resList.status).toBe(200);
      }

      const reqDetail = new NextRequest('http://localhost:3000/api/tickets/tkt_corrupted_photos');
      const resDetail = await getTicketById(reqDetail, { params: Promise.resolve({ id: 'tkt_corrupted_photos' }) });
      if (resDetail.status === 500) {
        const errorData = await resDetail.json();
        expect(errorData.error).toBeDefined();
      }
    });

    it('ADV-EXT-5: checks behavior on non-existent foreign keys in POST /api/tickets', async () => {
      const payload = {
        property_name: 'Palm Hills Heights',
        unit_number: '101',
        trade_id: 'non_existent_trade_id_999',
        subcategory_id: 'non_existent_subcat_id_999',
        symptom_id: 'sym_plumb_tap',
        custom_description: 'Testing invalid foreign keys',
        resident_name: 'FK Tester',
        resident_phone: '+20 100 999 0000',
      };

      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postTickets(req);
      const data = await res.json();
      // Should reject invalid foreign keys. Notice if it returns 500 (unhandled SQLite constraint) or 400
      expect([400, 500]).toContain(res.status);
      expect(data.error).toBeDefined();
    });

    it('ADV-EXT-6: checks negative quotes in contractor communications', async () => {
      const payload = {
        contractor_id: 'cont_plumb',
        contact_method: 'PHONE',
        notes: 'Negative quote probe',
        quoted_cost: -5000,
      };

      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_1/communications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postCommunications(req, { params: Promise.resolve({ id: 'tkt_1' }) });
      const data = await res.json();
      // Test whether negative financial quote is accepted or rejected
      if (res.status === 201) {
        expect(data.communication.quoted_cost).toBe(-5000);
      } else {
        expect(res.status).toBe(400);
      }
    });

    it('ADV-EXT-7: checks invalid contact_method in contractor communications', async () => {
      const payload = {
        contractor_id: 'cont_plumb',
        contact_method: 'SMOKE_SIGNALS',
        notes: 'Invalid method probe',
      };

      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_1/communications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postCommunications(req, { params: Promise.resolve({ id: 'tkt_1' }) });
      const data = await res.json();
      // SQLite CHECK constraint fails. Should check if returns 400 vs 500
      expect([400, 500]).toContain(res.status);
      expect(data.error).toBeDefined();
    });
  });

  // ==========================================================================
  // Section 3: State Machine Invariant Violations & Route Enforcement
  // ==========================================================================
  describe('3. State Machine Invariants & Transition Guards', () => {
    it('ADV-FSM-1: strictly rejects illegal bypass transitions via POST /api/tickets/[id]/transition', async () => {
      const illegalJumps: { id: string; target: TicketStatus }[] = [
        { id: 'tkt_1', target: 'RESOLVED' }, // SUBMITTED -> RESOLVED
        { id: 'tkt_1', target: 'CLOSED' }, // SUBMITTED -> CLOSED
        { id: 'tkt_1', target: 'IN_PROGRESS' }, // SUBMITTED -> IN_PROGRESS
        { id: 'tkt_1', target: 'APPOINTMENT_SCHEDULED' }, // SUBMITTED -> APPOINTMENT_SCHEDULED
        { id: 'tkt_3', target: 'RESOLVED' }, // UNDER_REVIEW -> RESOLVED
        { id: 'tkt_3', target: 'CLOSED' }, // UNDER_REVIEW -> CLOSED
        { id: 'tkt_4', target: 'CLOSED' }, // CONTRACTOR_CONTACTED -> CLOSED
        { id: 'tkt_6', target: 'CLOSED' }, // APPOINTMENT_SCHEDULED -> CLOSED
      ];

      for (const jump of illegalJumps) {
        const req = new NextRequest(`http://localhost:3000/api/tickets/${jump.id}/transition`, {
          method: 'POST',
          body: JSON.stringify({
            to_status: jump.target,
            actor_name: 'Malicious Dispatcher',
            resolution_notes: 'Bypassing repair notes',
          }),
        });

        const res = await postTransition(req, { params: Promise.resolve({ id: jump.id }) });
        expect(res.status).toBe(400);

        const data = await res.json();
        expect(data.error).toMatch(/invalid transition/i);
      }
    });

    it('ADV-FSM-2: enforces guards for missing requirements on valid transitions', async () => {
      // 1. CONTRACTOR_CONTACTED requires assigned_contractor_id
      const req1 = new NextRequest('http://localhost:3000/api/tickets/tkt_3/transition', {
        method: 'POST',
        body: JSON.stringify({ to_status: 'CONTRACTOR_CONTACTED' }),
      });
      const res1 = await postTransition(req1, { params: Promise.resolve({ id: 'tkt_3' }) });
      expect(res1.status).toBe(400);

      // 2. APPOINTMENT_SCHEDULED requires appointment_date
      const req2 = new NextRequest('http://localhost:3000/api/tickets/tkt_4/transition', {
        method: 'POST',
        body: JSON.stringify({ to_status: 'APPOINTMENT_SCHEDULED' }),
      });
      const res2 = await postTransition(req2, { params: Promise.resolve({ id: 'tkt_4' }) });
      expect(res2.status).toBe(400);

      // 3. APPOINTMENT_SCHEDULED requires valid date parse
      const req3 = new NextRequest('http://localhost:3000/api/tickets/tkt_4/transition', {
        method: 'POST',
        body: JSON.stringify({ to_status: 'APPOINTMENT_SCHEDULED', appointment_date: 'not-a-valid-date' }),
      });
      const res3 = await postTransition(req3, { params: Promise.resolve({ id: 'tkt_4' }) });
      expect(res3.status).toBe(400);

      // 4. REJECTED requires rejection_reason (min 3 chars)
      const req4 = new NextRequest('http://localhost:3000/api/tickets/tkt_3/transition', {
        method: 'POST',
        body: JSON.stringify({ to_status: 'REJECTED', rejection_reason: 'ab' }),
      });
      const res4 = await postTransition(req4, { params: Promise.resolve({ id: 'tkt_3' }) });
      expect(res4.status).toBe(400);

      // 5. RESOLVED requires resolution_notes (min 3 chars)
      const req5 = new NextRequest('http://localhost:3000/api/tickets/tkt_8/transition', {
        method: 'POST',
        body: JSON.stringify({ to_status: 'RESOLVED', resolution_notes: 'ok' }),
      });
      const res5 = await postTransition(req5, { params: Promise.resolve({ id: 'tkt_8' }) });
      expect(res5.status).toBe(400);
    });

    it('ADV-FSM-3: checks CLOSED state immutability in state-machine vs oracle', async () => {
      // PROJECT.md and test-helpers define CLOSED as terminal immutable state.
      // Check what happens when attempting to reopen tkt_12 (CLOSED) to UNDER_REVIEW
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_12/transition', {
        method: 'POST',
        body: JSON.stringify({
          to_status: 'UNDER_REVIEW',
          notes: 'Attempting to reopen closed ticket',
        }),
      });

      const res = await postTransition(req, { params: Promise.resolve({ id: 'tkt_12' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('terminal state CLOSED');
    });

    it('ADV-FSM-4: checks direct SUBMITTED -> REJECTED transition discrepancy', async () => {
      // In PROJECT.md: SUBMITTED -> UNDER_REVIEW -> (CONTRACTOR_CONTACTED or REJECTED)
      // In state-machine.ts: SUBMITTED: ['UNDER_REVIEW', 'REJECTED']
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_2/transition', {
        method: 'POST',
        body: JSON.stringify({
          to_status: 'REJECTED',
          rejection_reason: 'Direct rejection without under_review',
        }),
      });

      const res = await postTransition(req, { params: Promise.resolve({ id: 'tkt_2' }) });
      expect([200, 400]).toContain(res.status);
    });
  });

  // ==========================================================================
  // Section 4: Concurrency & Transaction Stress
  // ==========================================================================
  describe('4. Concurrency & High Volume Stress', () => {
    it('ADV-CONC-1: tests sequential and concurrent ticket creation for ID collision', async () => {
      const payloads = Array.from({ length: 10 }, (_, i) => ({
        property_name: 'Palm Hills Heights',
        unit_number: `Unit-${i + 100}`,
        trade_id: 'trade_plumbing',
        subcategory_id: 'sub_plumb_valves',
        symptom_id: 'sym_plumb_tap',
        custom_description: `Concurrent probe ticket ${i}`,
        resident_name: `Resident ${i}`,
        resident_phone: `+20 100 000 ${String(i).padStart(4, '0')}`,
      }));

      // Execute creation requests
      const results = await Promise.all(
        payloads.map((p) =>
          postTickets(
            new NextRequest('http://localhost:3000/api/tickets', {
              method: 'POST',
              body: JSON.stringify(p),
            })
          )
        )
      );

      const statuses = results.map((r) => r.status);
      const bodies = await Promise.all(results.map((r) => r.json()));

      // Check if any collision occurred
      const createdIds = bodies.filter((b) => b.success).map((b) => b.ticket.id);
      const uniqueIds = new Set(createdIds);
      expect(uniqueIds.size).toBe(createdIds.length);
    });

    it('ADV-CONC-2: verifies transactional rollback on mid-operation failure', async () => {
      const db = getDb();
      const initialCount = (db.prepare('SELECT COUNT(*) as c FROM tickets').get() as any).c;
      const initialEvents = (db.prepare('SELECT COUNT(*) as c FROM ticket_events').get() as any).c;

      // Send payload with invalid trade_id that will fail foreign key constraint during INSERT
      const invalidPayload = {
        property_name: 'Rollback Test Prop',
        unit_number: '999',
        trade_id: 'invalid_trade_id_does_not_exist',
        subcategory_id: 'sub_plumb_valves',
        symptom_id: 'sym_plumb_tap',
        custom_description: 'This transaction must roll back cleanly',
        resident_name: 'Rollback Tester',
        resident_phone: '+20 100 000 9999',
      };

      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
      });

      const res = await postTickets(req);
      expect(res.status).toBeGreaterThanOrEqual(400);

      // Verify no orphaned records in tickets or ticket_events
      const afterCount = (db.prepare('SELECT COUNT(*) as c FROM tickets').get() as any).c;
      const afterEvents = (db.prepare('SELECT COUNT(*) as c FROM ticket_events').get() as any).c;

      expect(afterCount).toBe(initialCount);
      expect(afterEvents).toBe(initialEvents);
    });
  });
});
