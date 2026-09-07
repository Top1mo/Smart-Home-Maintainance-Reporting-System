-- Home Faults Report System Relational Schema DDL
-- Node:SQLite (DatabaseSync) Compatible

PRAGMA foreign_keys = ON;

-- 1. Properties
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    address_en TEXT NOT NULL,
    address_ar TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Cairo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Units
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

-- 3. 11 Trades
CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    icon TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 1
);

-- 4. Subcategories (with dedicated ELV flag)
CREATE TABLE IF NOT EXISTS subcategories (
    id TEXT PRIMARY KEY,
    trade_id TEXT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_elv INTEGER DEFAULT 0
);

-- 5. Fault Symptoms (with hazard detection & safety instructions)
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

-- 6. Contractors Directory
CREATE TABLE IF NOT EXISTS contractors (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    trade_id TEXT NOT NULL REFERENCES trades(id),
    specialties TEXT, -- JSON Array string
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    rating REAL DEFAULT 4.8,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tickets
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
    photos TEXT DEFAULT '[]', -- JSON Array string
    photo_urls TEXT DEFAULT '[]', -- JSON Array string
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
);

-- 8. Immutable Ticket Events (Audit Trail)
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

-- 9. Contractor Communications Log
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

-- High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_trade ON tickets(trade_id);
CREATE INDEX IF NOT EXISTS idx_tickets_unit ON tickets(unit_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_is_hazard ON tickets(is_hazard);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_contractor_comms_ticket ON contractor_communications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_trade ON subcategories(trade_id);
CREATE INDEX IF NOT EXISTS idx_fault_symptoms_subcat ON fault_symptoms(subcategory_id);
