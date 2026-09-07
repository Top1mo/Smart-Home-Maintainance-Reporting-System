import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getDb, SCHEMA_SQL } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';

import { GET as getTrades } from '@/app/api/trades/route';
import { GET as getTickets, POST as postTickets } from '@/app/api/tickets/route';
import { GET as getTicketById, PATCH as patchTicketById } from '@/app/api/tickets/[id]/route';
import { POST as postTransition } from '@/app/api/tickets/[id]/transition/route';
import { GET as getCommunications, POST as postCommunications } from '@/app/api/tickets/[id]/communications/route';
import { GET as getStats } from '@/app/api/stats/route';
import { GET as getUnits, POST as postUnits, PUT as putUnits } from '@/app/api/units/route';
import { POST as postRepublish } from '@/app/api/tickets/[id]/republish/route';

describe('Next.js 16 REST API Route Handlers Integration', () => {
  beforeEach(() => {
    const db = getDb();
    seedDatabase(db, true);
  });

  it('GET /api/trades returns 11 trades with 3-tier taxonomy tree', async () => {
    const res = await getTrades();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.trades).toHaveLength(11);

    const electrical = data.trades.find((t: any) => t.slug === 'ELECTRICAL');
    expect(electrical).toBeDefined();
    expect(electrical.subcategories.length).toBeGreaterThanOrEqual(4);

    const cctv = electrical.subcategories.find((s: any) => s.slug === 'ELECTRICAL_ELV_CCTV');
    expect(cctv).toBeDefined();
    expect(cctv.is_elv).toBe(true);
    expect(cctv.symptoms.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/tickets supports filtering by status, trade, and search query', async () => {
    // 1. Filter by status
    const reqStatus = new NextRequest('http://localhost:3000/api/tickets?status=SUBMITTED');
    const resStatus = await getTickets(reqStatus);
    const dataStatus = await resStatus.json();
    expect(dataStatus.tickets.length).toBeGreaterThanOrEqual(2);
    dataStatus.tickets.forEach((t: any) => expect(t.status).toBe('SUBMITTED'));

    // 2. Filter by trade
    const reqTrade = new NextRequest('http://localhost:3000/api/tickets?trade=ELECTRICAL');
    const resTrade = await getTickets(reqTrade);
    const dataTrade = await resTrade.json();
    expect(dataTrade.tickets.length).toBeGreaterThanOrEqual(3);

    // 3. Search query
    const reqSearch = new NextRequest('http://localhost:3000/api/tickets?q=Ahmed');
    const resSearch = await getTickets(reqSearch);
    const dataSearch = await resSearch.json();
    expect(dataSearch.tickets.length).toBeGreaterThan(0);
    expect(dataSearch.tickets[0].resident_name).toContain('Ahmed');
  });

  it('POST /api/tickets generates sequential TKT-2026-XXXX ID and creates audit event', async () => {
    const payload = {
      property_name: 'Palm Hills Heights',
      unit_number: '101',
      trade_id: 'trade_plumbing',
      subcategory_id: 'sub_plumb_valves',
      symptom_id: 'sym_plumb_tap',
      custom_description: 'Kitchen tap leaking water constantly',
      resident_name: 'Test Resident',
      resident_phone: '+20 100 000 1122',
      photos: ['data:image/png;base64,mockphoto1'],
    };

    const req = new NextRequest('http://localhost:3000/api/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await postTickets(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.ticket.id).toMatch(/^TKT-2026-\d{4}$/);
    expect(data.ticket.status).toBe('SUBMITTED');
    expect(data.ticket.photos).toHaveLength(1);
    expect(data.event.to_status).toBe('SUBMITTED');
    expect(data.event.performed_by).toBe('Test Resident');
  });

  it('POST /api/tickets auto-detects hazard keywords and elevates severity to CRITICAL', async () => {
    const payload = {
      property_name: 'Palm Hills Heights',
      unit_number: '204',
      trade_id: 'trade_electrical',
      subcategory_id: 'sub_elec_outlets',
      symptom_id: 'sym_elec_socket_burnt',
      custom_description: 'الفيشة فيها ماس كهربائي وبتطلع شرز ناري ودخان', // sparks and smoke keywords
      resident_name: 'Mona Zaki',
      resident_phone: '+20 111 234 5678',
    };

    const req = new NextRequest('http://localhost:3000/api/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await postTickets(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.ticket.is_hazard).toBe(true);
    expect(data.ticket.severity).toBe('CRITICAL');
  });

  it('GET /api/tickets/[id] returns ticket details with chronological events and communications', async () => {
    const req = new NextRequest('http://localhost:3000/api/tickets/tkt_4');
    const res = await getTicketById(req, { params: Promise.resolve({ id: 'tkt_4' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ticket).toBeDefined();
    expect(data.ticket.id).toBe('tkt_4');
    expect(data.ticket.events.length).toBeGreaterThanOrEqual(1);
    expect(data.ticket.communications.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/tickets/[id]/transition enforces state machine guards and updates ticket', async () => {
    // 1. Guard check failure: moving to CONTRACTOR_CONTACTED without assigned_contractor_id
    const failReq = new NextRequest('http://localhost:3000/api/tickets/tkt_3/transition', {
      method: 'POST',
      body: JSON.stringify({
        to_status: 'CONTRACTOR_CONTACTED',
      }),
    });
    const failRes = await postTransition(failReq, { params: Promise.resolve({ id: 'tkt_3' }) });
    expect(failRes.status).toBe(400);

    // 2. Successful transition with contractor
    const succReq = new NextRequest('http://localhost:3000/api/tickets/tkt_3/transition', {
      method: 'POST',
      body: JSON.stringify({
        to_status: 'CONTRACTOR_CONTACTED',
        assigned_contractor_id: 'cont_elec',
        actor_name: 'Dispatcher Tarek',
        notes: 'Assigned Al-Nour Electrical',
      }),
    });
    const succRes = await postTransition(succReq, { params: Promise.resolve({ id: 'tkt_3' }) });
    expect(succRes.status).toBe(200);

    const data = await succRes.json();
    expect(data.success).toBe(true);
    expect(data.ticket.status).toBe('CONTRACTOR_CONTACTED');
    expect(data.ticket.assigned_contractor_id).toBe('cont_elec');
    expect(data.event.to_status).toBe('CONTRACTOR_CONTACTED');
  });

  it('POST /api/tickets/[id]/communications logs contractor dialogue and updates ticket', async () => {
    const commPayload = {
      contractor_id: 'cont_elv',
      contact_method: 'WHATSAPP',
      quote_estimate: 750,
      proposed_appointment: '2026-09-10 12:00:00',
      notes: 'Contractor confirmed replacement camera lens in stock',
      dispatcher_name: 'Dispatcher Tarek',
      auto_advance_status: true,
    };

    const req = new NextRequest('http://localhost:3000/api/tickets/tkt_1/communications', {
      method: 'POST',
      body: JSON.stringify(commPayload),
    });

    const res = await postCommunications(req, { params: Promise.resolve({ id: 'tkt_1' }) });
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.communication.quote_estimate).toBe(750);
    expect(data.communication.contact_method).toBe('WHATSAPP');
    expect(data.ticket.assigned_contractor_id).toBe('cont_elv');
  });

  it('GET /api/stats returns accurate volume KPIs, MTTR, 11-trade distribution, and status funnel', async () => {
    const res = await getStats();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary.total_tickets).toBe(13);
    expect(data.summary.active_tickets).toBe(9);
    expect(data.summary.resolved_tickets).toBe(2);
    expect(data.summary.closed_tickets).toBe(1);
    expect(data.summary.rejected_tickets).toBe(1);
    expect(data.summary.hazard_tickets).toBeGreaterThanOrEqual(4);

    expect(data.trade_distribution).toHaveLength(11);
    expect(data.status_funnel).toHaveLength(8);
    expect(data.recent_activity.length).toBeGreaterThan(0);
  });

  it('GET, POST, PUT /api/units supports owner-configured fixed rooms & areas', async () => {
    // 1. GET units returns array of units with parsed rooms array
    const resGet = await getUnits();
    expect(resGet.status).toBe(200);
    const dataGet = await resGet.json();
    expect(dataGet.units.length).toBeGreaterThan(0);
    expect(Array.isArray(dataGet.units[0].rooms)).toBe(true);
    expect(dataGet.units[0].rooms.length).toBeGreaterThanOrEqual(1);

    // 2. POST new unit with custom rooms
    const customRooms = ['المطبخ', 'الحمام الرئيسي', 'الريسبشن', 'غرفة النوم', 'الروف'];
    const postReq = new NextRequest('http://localhost:3000/api/units', {
      method: 'POST',
      body: JSON.stringify({
        unit_number: '505',
        building_name: 'Tower C',
        floor_number: 5,
        resident_name: 'الساكن',
        resident_phone: '+201099887766',
        rooms: customRooms,
      }),
    });
    const resPost = await postUnits(postReq);
    expect(resPost.status).toBe(201);
    const dataPost = await resPost.json();
    expect(dataPost.unit.unit_number).toBe('505');
    expect(dataPost.unit.rooms).toEqual(customRooms);

    // 3. PUT update unit rooms
    const putReq = new NextRequest('http://localhost:3000/api/units', {
      method: 'PUT',
      body: JSON.stringify({
        id: dataPost.unit.id,
        unit_number: '505',
        building_name: 'Tower C',
        floor_number: 5,
        resident_name: 'الساكن',
        resident_phone: '+201099887766',
        rooms: [...customRooms, 'غرفة المكتب'],
      }),
    });
    const resPut = await putUnits(putReq);
    expect(resPut.status).toBe(200);
    const dataPut = await resPut.json();
    expect(dataPut.unit.rooms).toContain('غرفة المكتب');
  });

  it('POST /api/tickets/[id]/republish reactivates an archived ticket into a new SUBMITTED ticket', async () => {
    // Pick an archived ticket (e.g., tkt_12 which is RESOLVED, or tkt_13 which is REJECTED)
    const req = new NextRequest('http://localhost:3000/api/tickets/tkt_12/republish', {
      method: 'POST',
      body: JSON.stringify({
        actor_name: 'Dispatcher Mostafa',
        notes: 'Recurring leak noticed by tenant, reopen for contractor dispatch',
      }),
    });

    const res = await postRepublish(req, { params: Promise.resolve({ id: 'tkt_12' }) });
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.ticket).toBeDefined();
    expect(data.ticket.id).not.toBe('tkt_12');
    expect(data.ticket.status).toBe('SUBMITTED');
    expect(data.ticket.reference_no).toMatch(/^TKT-2026-\d{4}$/);
    expect(data.ticket.description).toContain('إعادة نشر من بلاغ سابق');

    // Verify audit event was recorded in db
    const db = getDb();
    const event: any = db.prepare('SELECT * FROM ticket_events WHERE ticket_id = ?').get(data.ticket.id);
    expect(event).toBeDefined();
    expect(event.to_status).toBe('SUBMITTED');
    expect(event.notes).toContain('Recurring leak');
  });

  it('POST /api/tickets supports sym_other_custom with auto-upsert and building_name auto-population', async () => {
    const payload = {
      property_name: 'Palm Hills Heights',
      unit_number: '101',
      resident_name: 'الساكن',
      resident_phone: '01012345678',
      trade_id: 'trade_plumbing',
      room_location_ar: 'المطبخ',
      subcategory_id: 'sub_plumb_valves',
      symptom_id: 'sym_other_custom',
      custom_symptom_text: 'عطل غير معتاد في وصلة سخان الغاز',
      description: 'تسريب قطرات مستمر أسفل التوصيلة الميكانيكية',
      photos: [],
    };

    const req = new NextRequest('http://localhost:3000/api/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await postTickets(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.ticket).toBeDefined();
    expect(data.ticket.symptom_id).toBe('sym_other_custom');
    // Verify building name was populated from unit 101
    expect(data.ticket.building_name).toBeDefined();
    expect(data.ticket.building_name).not.toBe('');
    // Verify joined fields are returned directly
    expect(data.ticket.trade_ar).toBeDefined();
    expect(data.ticket.symptom_ar).toBe('عطل غير معتاد في وصلة سخان الغاز');

    // Verify foreign key passed and symptom was recorded in db
    const db = getDb();
    const symRow: any = db.prepare('SELECT * FROM fault_symptoms WHERE id = ?').get('sym_other_custom');
    expect(symRow).toBeDefined();
  });

  it('PATCH /api/tickets/[id] updates parts_needed and parts_description', async () => {
    const patchReq = new NextRequest('http://localhost:3000/api/tickets/tkt_1', {
      method: 'PATCH',
      body: JSON.stringify({
        parts_needed: true,
        parts_description: 'محبس نحاس 1 بوصة + شريط تفلون',
      }),
    });

    const res = await patchTicketById(patchReq, { params: Promise.resolve({ id: 'tkt_1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ticket).toBeDefined();
    expect(Boolean(data.ticket.parts_needed)).toBe(true);
    expect(data.ticket.parts_description).toBe('محبس نحاس 1 بوصة + شريط تفلون');

    // Verify in db
    const db = getDb();
    const row: any = db.prepare('SELECT parts_needed, parts_description FROM tickets WHERE id = ?').get('tkt_1');
    expect(row.parts_needed).toBe(1);
    expect(row.parts_description).toBe('محبس نحاس 1 بوصة + شريط تفلون');
  });
});
