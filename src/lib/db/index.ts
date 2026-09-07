import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { seedDatabase, seedTaxonomyOnly } from './seed-data';

declare global {
  // eslint-disable-next-line no-var
  var __homeFaultsDb: DatabaseSync | undefined;
}

const DEFAULT_DB_DIR = path.join(process.cwd(), 'data');
const DEFAULT_DB_PATH = path.join(DEFAULT_DB_DIR, 'home_faults.db');

export const DEFAULT_UNIT_ROOMS = [
  "المطبخ",
  "الحمام الرئيسي",
  "الريسبشن / الصالة",
  "غرفة النوم الرئيسية",
  "البلكونة",
];

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    address_en TEXT NOT NULL,
    address_ar TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Cairo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    building_name TEXT NOT NULL,
    floor_number INTEGER NOT NULL,
    resident_name TEXT NOT NULL,
    resident_phone TEXT NOT NULL,
    rooms TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    icon TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS subcategories (
    id TEXT PRIMARY KEY,
    trade_id TEXT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_elv INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fault_symptoms (
    id TEXT PRIMARY KEY,
    subcategory_id TEXT NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
    symptom_en TEXT NOT NULL,
    symptom_ar TEXT NOT NULL,
    name_en TEXT,
    name_ar TEXT,
    default_severity TEXT DEFAULT 'MEDIUM' CHECK (default_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'NORMAL', 'EMERGENCY')),
    default_urgency TEXT DEFAULT 'NORMAL' CHECK (default_urgency IN ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY')),
    is_hazard INTEGER DEFAULT 0,
    hazard_type TEXT,
    hazard_instruction_en TEXT,
    hazard_instruction_ar TEXT,
    hazard_warning_en TEXT,
    hazard_warning_ar TEXT
);

CREATE TABLE IF NOT EXISTS contractors (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    trade_id TEXT NOT NULL REFERENCES trades(id),
    specialties TEXT,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    rating REAL DEFAULT 4.8,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    reference_no TEXT UNIQUE,
    property_id TEXT REFERENCES properties(id),
    property_name TEXT NOT NULL,
    unit_id TEXT REFERENCES units(id),
    unit_number TEXT NOT NULL,
    trade_id TEXT NOT NULL REFERENCES trades(id),
    subcategory_id TEXT NOT NULL REFERENCES subcategories(id),
    symptom_id TEXT NOT NULL REFERENCES fault_symptoms(id),
    room_location_en TEXT,
    room_location_ar TEXT,
    custom_description TEXT,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'NORMAL', 'EMERGENCY')),
    urgency TEXT NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY')),
    is_hazard INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 
        'REJECTED', 'APPOINTMENT_SCHEDULED', 'IN_PROGRESS', 
        'RESOLVED', 'CLOSED'
    )),
    resident_name TEXT NOT NULL,
    resident_phone TEXT NOT NULL,
    assigned_contractor_id TEXT REFERENCES contractors(id),
    appointment_date TEXT,
    rejection_reason TEXT,
    rejection_reason_code TEXT,
    rejection_notes TEXT,
    resolution_notes TEXT,
    photos TEXT DEFAULT '[]',
    photo_urls TEXT DEFAULT '[]',
    parts_needed INTEGER DEFAULT 0,
    parts_description TEXT,
    building_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS ticket_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT,
    event_type TEXT DEFAULT 'STATUS_CHANGE',
    performed_by TEXT,
    notes TEXT,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contractor_communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    contractor_id TEXT NOT NULL REFERENCES contractors(id),
    contact_method TEXT NOT NULL CHECK (contact_method IN ('PHONE', 'WHATSAPP', 'EMAIL', 'IN_PERSON')),
    quoted_cost REAL,
    quote_estimate REAL,
    scheduled_slot TEXT,
    proposed_appointment TEXT,
    notes TEXT NOT NULL,
    dispatcher_name TEXT NOT NULL,
    is_internal_only INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_trade ON tickets(trade_id);
CREATE INDEX IF NOT EXISTS idx_tickets_unit ON tickets(unit_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_is_hazard ON tickets(is_hazard);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_contractor_comms_ticket ON contractor_communications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_trade ON subcategories(trade_id);
CREATE INDEX IF NOT EXISTS idx_fault_symptoms_subcat ON fault_symptoms(subcategory_id);
`;

export function getDb(dbPath?: string): DatabaseSync {
  if (globalThis.__homeFaultsDb && !dbPath) {
    return globalThis.__homeFaultsDb;
  }

  const targetPath = dbPath || process.env.DATABASE_PATH || DEFAULT_DB_PATH;

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);

  // Apply pragmas
  db.exec('PRAGMA foreign_keys = ON;');
  if (targetPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA cache_size = -2000;');
  db.exec('PRAGMA mmap_size = 0;');
  db.exec('PRAGMA temp_store = MEMORY;');

  // Initialize schema
  db.exec(SCHEMA_SQL);

  // Schema migration for existing databases: ensure 'rooms' column exists on units
  try {
    db.exec("ALTER TABLE units ADD COLUMN rooms TEXT DEFAULT '[]';");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE tickets ADD COLUMN parts_needed INTEGER DEFAULT 0;");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE tickets ADD COLUMN parts_description TEXT;");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE tickets ADD COLUMN building_name TEXT;");
  } catch {
    // Column already exists
  }

  // Auto-seed if database is empty
  try {
    const tradeCount = db.prepare('SELECT COUNT(*) as count FROM trades').get() as { count: number } | undefined;
    if (!tradeCount || tradeCount.count === 0) {
      seedTaxonomyOnly(db);
    }
  } catch (err) {
    console.error('[DB] Auto-seed check failed:', err);
  }

  if (!dbPath) {
    globalThis.__homeFaultsDb = db;
  }
  return db;
}

export const initDatabase = getDb;

export function closeDb(): void {
  if (globalThis.__homeFaultsDb) {
    try {
      globalThis.__homeFaultsDb.close();
    } catch {
      // ignore
    }
    globalThis.__homeFaultsDb = undefined;
  }
}

export function query<T = Record<string, any>>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as any[];
  // Normalize [Object: null prototype] to plain JavaScript objects
  return rows.map((r) => ({ ...r }));
}

export function queryOne<T = Record<string, any>>(sql: string, params: any[] = []): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  const row = stmt.get(...params) as any | undefined;
  return row ? { ...row } : undefined;
}

export function execute(sql: string, params: any[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn(db);
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
