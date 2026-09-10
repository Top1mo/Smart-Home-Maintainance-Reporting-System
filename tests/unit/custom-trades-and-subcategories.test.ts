import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';
import { FALLBACK_TRADES } from '@/lib/constants/trades-data';
import { POST as postTickets, GET as getTickets } from '@/app/api/tickets/route';

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

    it('preserves distinct symptom and subcategory names across multiple custom unlisted tickets without overwriting', async () => {
      // 1. Create first custom ticket
      const payload1 = {
        property_name: 'Palm Hills Heights',
        unit_number: '101',
        trade_id: 'trade_plumbing',
        subcategory_id: 'sub_other_custom',
        symptom_id: 'sym_other_custom',
        custom_subcategory_text: 'فلتر مياه مركزي',
        custom_symptom_text: 'تسريب مستمر من خزان الفلتر',
        resident_name: 'عميل أ',
        resident_phone: '+20 100 000 0001',
        description: '[نوع: فلتر مياه مركزي] [عطل مخصص: تسريب مستمر من خزان الفلتر] يرجى الفحص',
      };
      const res1 = await postTickets(new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload1),
      }));
      expect(res1.status).toBe(201);
      const data1 = await res1.json();
      const ticket1Id = data1.ticket.id;

      // 2. Create second custom ticket with completely different custom symptom
      const payload2 = {
        property_name: 'Palm Hills Heights',
        unit_number: '102',
        trade_id: 'trade_carpentry',
        subcategory_id: 'sub_other_custom',
        symptom_id: 'sym_other_custom',
        custom_subcategory_text: 'كالون إلكتروني ذكي',
        custom_symptom_text: 'الكالون معلق ولا يقبل بصمة الإصبع',
        resident_name: 'عميل ب',
        resident_phone: '+20 100 000 0002',
        description: '[نوع: كالون إلكتروني ذكي] [عطل مخصص: الكالون معلق ولا يقبل بصمة الإصبع] طارئ',
      };
      const res2 = await postTickets(new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload2),
      }));
      expect(res2.status).toBe(201);
      const data2 = await res2.json();
      const ticket2Id = data2.ticket.id;

      // 3. Fetch all tickets via GET /api/tickets
      const getReq = new NextRequest('http://localhost:3000/api/tickets');
      const getRes = await getTickets(getReq);
      expect(getRes.status).toBe(200);
      const allData = await getRes.json();

      const fetchedTicket1 = allData.tickets.find((t: any) => t.id === ticket1Id);
      const fetchedTicket2 = allData.tickets.find((t: any) => t.id === ticket2Id);

      expect(fetchedTicket1).toBeDefined();
      expect(fetchedTicket2).toBeDefined();

      // Ticket 1 must RETAIN its own custom symptom and subcategory!
      expect(fetchedTicket1.symptom_ar).toBe('تسريب مستمر من خزان الفلتر');
      expect(fetchedTicket1.subcategory_name_ar).toBe('فلتر مياه مركزي');

      // Ticket 2 must have its own custom symptom and subcategory!
      expect(fetchedTicket2.symptom_ar).toBe('الكالون معلق ولا يقبل بصمة الإصبع');
      expect(fetchedTicket2.subcategory_name_ar).toBe('كالون إلكتروني ذكي');
    });
  });
});
