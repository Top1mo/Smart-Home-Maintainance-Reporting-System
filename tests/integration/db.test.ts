import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { getDb, closeDb, SCHEMA_SQL } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';

describe('Embedded SQLite Database Engine & Schema Integration', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    // In-memory test instance
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(SCHEMA_SQL);
    seedDatabase(db, true);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      // ignore
    }
  });

  it('verifies all 9 relational tables are created and seeded', () => {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `).all() as any[];

    const tableNames = tables.map((t) => t.name);
    const expected = [
      'contractor_communications',
      'contractors',
      'fault_symptoms',
      'properties',
      'subcategories',
      'ticket_events',
      'tickets',
      'trades',
      'units',
    ];
    for (const exp of expected) {
      expect(tableNames).toContain(exp);
    }
  });

  it('enforces foreign key constraints', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO subcategories (id, trade_id, slug, name_en, name_ar)
        VALUES ('sub_test', 'NON_EXISTENT_TRADE', 'test', 'Test', 'اختبار')
      `).run();
    }).toThrow(/FOREIGN KEY/i);
  });

  it('verifies 11-trade taxonomy and dedicated ELV subcategories', () => {
    const trades = db.prepare('SELECT * FROM trades ORDER BY order_index ASC').all() as any[];
    expect(trades).toHaveLength(11);

    const elvSubs = db.prepare('SELECT * FROM subcategories WHERE is_elv = 1').all() as any[];
    expect(elvSubs.length).toBeGreaterThanOrEqual(4);
    const elvSlugs = elvSubs.map((s) => s.slug);
    expect(elvSlugs).toContain('ELECTRICAL_ELV_CCTV');
    expect(elvSlugs).toContain('ELECTRICAL_ELV_INTERCOM');
    expect(elvSlugs).toContain('ELECTRICAL_ELV_WIFI');
    expect(elvSlugs).toContain('ELECTRICAL_ELV_GATES');
  });

  it('verifies hazard symptoms and safety warnings persistence', () => {
    const sparks = db.prepare("SELECT * FROM fault_symptoms WHERE id = 'sym_elec_sparks'").get() as any;
    expect(sparks).toBeDefined();
    expect(sparks.is_hazard).toBe(1);
    expect(sparks.default_severity).toBe('CRITICAL');
    expect(sparks.hazard_instruction_ar).toContain('القاطع العمومي');
  });

  it('verifies exactly 13 realistic pre-seeded tickets spanning all 8 lifecycle states', () => {
    const tickets = db.prepare('SELECT * FROM tickets').all() as any[];
    expect(tickets).toHaveLength(13);

    const distinctStatuses = db.prepare('SELECT DISTINCT status FROM tickets').all() as any[];
    expect(distinctStatuses).toHaveLength(8);
  });

  it('cascades delete on ticket to ticket_events and contractor_communications', () => {
    const tktId = 'tkt_cascade_test';
    db.prepare(`
      INSERT INTO tickets (
        id, property_name, unit_number, trade_id, subcategory_id, symptom_id,
        severity, resident_name, resident_phone, status
      ) VALUES (
        ?, 'Test Compound', '999', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap',
        'LOW', 'Test Resident', '+2010000000', 'SUBMITTED'
      )
    `).run(tktId);

    db.prepare(`
      INSERT INTO ticket_events (ticket_id, to_status, actor_name, actor_role, notes)
      VALUES (?, 'SUBMITTED', 'Test Resident', 'RESIDENT', 'Created')
    `).run(tktId);

    db.prepare(`
      INSERT INTO contractor_communications (ticket_id, contractor_id, dispatcher_name, contact_method, notes)
      VALUES (?, 'cont_plumb', 'Dispatcher', 'PHONE', 'Called')
    `).run(tktId);

    expect(db.prepare('SELECT COUNT(*) as c FROM ticket_events WHERE ticket_id = ?').get(tktId)).toEqual({ c: 1 });
    expect(db.prepare('SELECT COUNT(*) as c FROM contractor_communications WHERE ticket_id = ?').get(tktId)).toEqual({ c: 1 });

    // Delete parent ticket
    db.prepare('DELETE FROM tickets WHERE id = ?').run(tktId);

    // Verify cascade
    expect(db.prepare('SELECT COUNT(*) as c FROM ticket_events WHERE ticket_id = ?').get(tktId)).toEqual({ c: 0 });
    expect(db.prepare('SELECT COUNT(*) as c FROM contractor_communications WHERE ticket_id = ?').get(tktId)).toEqual({ c: 0 });
  });
});
