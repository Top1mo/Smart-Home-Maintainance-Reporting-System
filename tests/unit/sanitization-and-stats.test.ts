import { describe, it, expect, beforeEach } from 'vitest';
import { safeParsePhotos, handleRouteError } from '@/lib/utils';
import { validateTransitionPayload } from '@/lib/state-machine';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';
import { NextRequest } from 'next/server';
import { GET as getTickets, POST as postTickets } from '@/app/api/tickets/route';
import { GET as getStats } from '@/app/api/stats/route';
import { POST as postComms } from '@/app/api/tickets/[id]/communications/route';

describe('Route Input Sanitization, Constraint Enforcement & Stats Robustness', () => {
  beforeEach(() => {
    const db = getDb();
    seedDatabase(db, true);
  });

  describe('safeParsePhotos utility', () => {
    it('handles null, undefined, empty string, and empty JSON array cleanly', () => {
      expect(safeParsePhotos(null)).toEqual([]);
      expect(safeParsePhotos(undefined)).toEqual([]);
      expect(safeParsePhotos('')).toEqual([]);
      expect(safeParsePhotos('   ')).toEqual([]);
      expect(safeParsePhotos('[]')).toEqual([]);
    });

    it('parses valid JSON string arrays correctly', () => {
      const urls = ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'];
      expect(safeParsePhotos(JSON.stringify(urls))).toEqual(urls);
    });

    it('gracefully falls back to [] on malformed JSON strings without throwing', () => {
      expect(safeParsePhotos('invalid-json{{{')).toEqual([]);
      expect(safeParsePhotos('{"not": "an array"}')).toEqual([]);
      expect(safeParsePhotos('12345')).toEqual([]);
    });

    it('returns array directly if input is already an array', () => {
      const arr = ['https://example.com/photo.png'];
      expect(safeParsePhotos(arr)).toEqual(arr);
    });
  });

  describe('handleRouteError classifier', () => {
    it('maps SQLite constraint errors to HTTP 400 Bad Request', async () => {
      const fkRes = handleRouteError(new Error('FOREIGN KEY constraint failed'));
      expect(fkRes.status).toBe(400);

      const checkRes = handleRouteError(new Error('CHECK constraint failed: contact_method IN (...)'));
      expect(checkRes.status).toBe(400);

      const notNullRes = handleRouteError(new Error('NOT NULL constraint failed: tickets.unit_number'));
      expect(notNullRes.status).toBe(400);

      const typeRes = handleRouteError(new Error('datatype mismatch'));
      expect(typeRes.status).toBe(400);

      const uniqueRes = handleRouteError(new Error('UNIQUE constraint failed: tickets.id'));
      expect(uniqueRes.status).toBe(400);
    });

    it('maps unexpected errors to HTTP 500 Internal Server Error', async () => {
      const unhandled = handleRouteError(new Error('Uncaught Network error'));
      expect(unhandled.status).toBe(500);
    });
  });

  describe('Pagination parameter sanitization', () => {
    it('sanitizes NaN and negative limit/offset parameters gracefully in GET /api/tickets', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets?limit=abc&offset=xyz');
      const res = await getTickets(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.limit).toBe(50);
      expect(data.offset).toBe(0);
      expect(Array.isArray(data.tickets)).toBe(true);
    });

    it('clamps limit to maximum 100 and minimum 1', async () => {
      const reqLarge = new NextRequest('http://localhost:3000/api/tickets?limit=9999');
      const resLarge = await getTickets(reqLarge);
      const dataLarge = await resLarge.json();
      expect(dataLarge.limit).toBe(100);

      const reqSmall = new NextRequest('http://localhost:3000/api/tickets?limit=-5');
      const resSmall = await getTickets(reqSmall);
      const dataSmall = await resSmall.json();
      expect(dataSmall.limit).toBe(1);
    });
  });

  describe('State Machine Date Hardening', () => {
    it('rejects strings with trailing numbers like invalid-date-string-1234', () => {
      const res = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: 'invalid-date-string-1234',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('valid date format');
    });

    it('rejects dates prior to system epoch 2026', () => {
      const res = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: '2025-12-31',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('year >= 2026');
    });

    it('rejects impossible calendar dates such as 2026-02-30', () => {
      const res = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: '2026-02-30',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('invalid calendar day');
    });

    it('accepts valid ISO 8601 date and datetime strings with year >= 2026', () => {
      const resIso = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: '2026-09-10T14:30:00Z',
      });
      expect(resIso.valid).toBe(true);

      const resSql = validateTransitionPayload('CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', {
        to_status: 'APPOINTMENT_SCHEDULED',
        appointment_date: '2026-09-10 14:30:00',
      });
      expect(resSql.valid).toBe(true);
    });
  });

  describe('Dynamic Stats and Zero Fallbacks in GET /api/stats', () => {
    it('calculates dynamic SLA compliance and MTTR from seeded resolved tickets', async () => {
      const res = await getStats();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.summary.mttr_hours).toBe('number');
      expect(data.summary.mttr_hours).toBeGreaterThan(0);
      expect(typeof data.summary.sla_compliance_percent).toBe('number');
      expect(data.summary.sla_compliance_percent).toBeGreaterThanOrEqual(0);
      expect(data.summary.sla_compliance_percent).toBeLessThanOrEqual(100);
    });

    it('falls back to 0 MTTR and 0% SLA compliance when no resolved tickets exist', async () => {
      const db = getDb();
      db.prepare("UPDATE tickets SET resolved_at = NULL, status = 'SUBMITTED'").run();

      const res = await getStats();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.summary.mttr_hours).toBe(0);
      expect(data.summary.sla_compliance_percent).toBe(0);
    });
  });

  describe('Clean HTTP 400 Foreign Key & Constraint Violations', () => {
    it('returns HTTP 400 when submitting ticket with non-existent trade_id', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          unit_number: '101',
          trade_id: 'trade_fake_id',
          subcategory_id: 'sub_plumb_valves',
          symptom_id: 'sym_plumb_tap',
          resident_name: 'Ahmed',
          resident_phone: '+201000000000',
        }),
      });

      const res = await postTickets(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Trade not found');
    });

    it('returns HTTP 400 when submitting ticket with subcategory mismatched to trade', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          unit_number: '101',
          trade_id: 'trade_electrical',
          subcategory_id: 'sub_plumb_valves', // Belongs to trade_plumbing
          symptom_id: 'sym_plumb_tap',
          resident_name: 'Ahmed',
          resident_phone: '+201000000000',
        }),
      });

      const res = await postTickets(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('does not belong to trade');
    });

    it('returns HTTP 400 when logging communication with invalid contact_method', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_1/communications', {
        method: 'POST',
        body: JSON.stringify({
          contractor_id: 'cont_plumb',
          contact_method: 'CARRIER_PIGEON',
          notes: 'Testing invalid method',
        }),
      });

      const res = await postComms(req, { params: Promise.resolve({ id: 'tkt_1' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid contact_method');
    });

    it('returns HTTP 400 when logging communication with negative quoted cost', async () => {
      const req = new NextRequest('http://localhost:3000/api/tickets/tkt_1/communications', {
        method: 'POST',
        body: JSON.stringify({
          contractor_id: 'cont_plumb',
          contact_method: 'PHONE',
          notes: 'Testing negative quote',
          quoted_cost: -500,
        }),
      });

      const res = await postComms(req, { params: Promise.resolve({ id: 'tkt_1' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Quote amount cannot be negative');
    });
  });
});
