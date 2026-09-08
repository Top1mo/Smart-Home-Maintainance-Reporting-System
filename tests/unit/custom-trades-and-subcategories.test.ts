import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';
import { FALLBACK_TRADES } from '@/lib/constants/trades-data';
import { POST as postTickets } from '@/app/api/tickets/route';

describe('Custom Trades & Subcategories Modularity & Plumbing Fix', () => {
  beforeEach(() => {
    const db = getDb();
    seedDatabase(db, true);
  });

  describe('Taxonomy Completeness & Fallback Data', () => {
    it('verifies FALLBACK_TRADES contains all 12 trades including trade_other', () => {
      expect(FALLBACK_TRADES.length).toBe(12);

      const otherTrade = FALLBACK_TRADES.find((t) => t.id === 'trade_other');
      expect(otherTrade).toBeDefined();
      expect(otherTrade?.slug).toBe('OTHER');
      expect(otherTrade?.name_ar).toBe('تخصص آخر / غير مدرج');
      expect(otherTrade?.icon).toBe('help-circle');
    });

    it('verifies Plumbing (سباكة) has all 5 complete subcategories in FALLBACK_TRADES', () => {
      const plumbing = FALLBACK_TRADES.find((t) => t.slug === 'PLUMBING');
      expect(plumbing).toBeDefined();
      expect(plumbing?.subcategories.length).toBe(5);

      const subSlugs = plumbing?.subcategories.map((s) => s.slug);
      expect(subSlugs).toContain('PLUMBING_PUMPS');
      expect(subSlugs).toContain('PLUMBING_DRAINAGE');
      expect(subSlugs).toContain('PLUMBING_VALVES');
      expect(subSlugs).toContain('PLUMBING_HEATERS');
      expect(subSlugs).toContain('PLUMBING_SUPPLY');

      const subNamesAr = plumbing?.subcategories.map((s) => s.name_ar);
      expect(subNamesAr).toContain('مواتير وخزانات المياه');
      expect(subNamesAr).toContain('صرف صحي ومجاري');
      expect(subNamesAr).toContain('خلاطات ومحابس');
      expect(subNamesAr).toContain('سخانات المياه');
      expect(subNamesAr).toContain('مواسير وتغذية مياه');
    });
  });

  describe('API Support for Custom Trade & Subcategory', () => {
    it('successfully creates ticket with custom trade, subcategory, and symptom without FK error', async () => {
      const payload = {
        property_name: 'Palm Hills Heights',
        unit_number: '101',
        trade_id: 'trade_other',
        subcategory_id: 'sub_other_custom',
        symptom_id: 'sym_other_custom',
        custom_trade_text: 'مكافحة حشرات',
        custom_subcategory_text: 'رش دوري وقائي',
        custom_symptom_text: 'ظهور نمل في المطبخ',
        resident_name: 'محمد علي',
        resident_phone: '+20 100 123 4567',
        description: 'يرجى إرسال الفني في أقرب وقت',
      };

      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postTickets(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.ticket).toBeDefined();
      expect(data.ticket.trade_id).toBe('trade_other');
      expect(data.ticket.subcategory_id).toBe('sub_other_custom');
      expect(data.ticket.symptom_id).toBe('sym_other_custom');
      expect(data.ticket.resident_name).toBe('محمد علي');
      expect(data.ticket.resident_phone).toBe('+20 100 123 4567');
    });

    it('successfully creates ticket with standard trade (Plumbing) and custom subcategory', async () => {
      const payload = {
        property_name: 'Palm Hills Heights',
        unit_number: '102',
        trade_id: 'trade_plumbing',
        subcategory_id: 'sub_other_custom',
        symptom_id: 'sym_other_custom',
        custom_subcategory_text: 'فلتر مياه 7 مراحل',
        custom_symptom_text: 'انسداد في الشمعة الثالثة',
        resident_name: 'سارة أحمد',
        resident_phone: '+20 111 987 6543',
        description: 'ضعف تدفق المياه من الفلتر',
      };

      const req = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postTickets(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.ticket).toBeDefined();
      expect(data.ticket.trade_id).toBe('trade_plumbing');
      expect(data.ticket.subcategory_id).toBe('sub_other_custom');
      expect(data.ticket.symptom_id).toBe('sym_other_custom');
      expect(data.ticket.description).toContain('ضعف تدفق المياه من الفلتر');
    });
  });
});
