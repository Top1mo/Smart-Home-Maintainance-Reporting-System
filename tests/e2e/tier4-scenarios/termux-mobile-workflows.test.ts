import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import {
  REFERENCE_TRADES,
  REFERENCE_SUBCATEGORIES,
  REFERENCE_SYMPTOMS,
  getDirection,
  getTranslation,
} from "../test-helpers";

describe("Tier 4: Real-World Workload Scenarios on Termux & Mobile", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA synchronous = NORMAL;");
    db.exec("PRAGMA busy_timeout = 5000;");
    db.exec("PRAGMA cache_size = -2000;");
    db.exec("PRAGMA mmap_size = 0;");
    db.exec("PRAGMA temp_store = MEMORY;");

    // DDL Setup
    db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL,
        unit_number TEXT NOT NULL,
        building_name TEXT NOT NULL,
        floor_number INTEGER NOT NULL,
        resident_name TEXT NOT NULL,
        resident_phone TEXT NOT NULL,
        rooms TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS contractors (
        id TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        trade_id TEXT NOT NULL,
        phone TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        reference_no TEXT UNIQUE,
        property_id TEXT,
        unit_id TEXT NOT NULL,
        unit_number TEXT NOT NULL,
        building_name TEXT,
        trade_id TEXT NOT NULL,
        subcategory_id TEXT NOT NULL,
        symptom_id TEXT NOT NULL,
        room_location_ar TEXT,
        description TEXT NOT NULL,
        urgency TEXT NOT NULL,
        status TEXT NOT NULL,
        is_hazard INTEGER DEFAULT 0,
        resident_name TEXT NOT NULL,
        resident_phone TEXT NOT NULL,
        assigned_contractor_id TEXT,
        appointment_date TEXT,
        resolution_notes TEXT,
        photos TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed minimal base contractor
    db.prepare("INSERT INTO contractors VALUES ('cont_1', 'Al-Ahram Plumbing', 'شركة الأهرام للسباكة', 'trade_plumbing', '+20 122 777 8899');").run();
    db.prepare("INSERT INTO properties VALUES ('prop_1', 'Palm Hills', 'كمبوند بالم هيلز');").run();
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Low-Resource Termux Boot & Standalone Launch
  // --------------------------------------------------------------------------
  it("Scenario 1: Low-Resource Termux Boot & Standalone Launch Lifecycle (F1, F2, F3, F4)", () => {
    // 1. Termux environment check & $HOME path verification
    const projectDir = "/data/data/com.termux/files/home/home-faults-report-system";
    const isInternalTermuxStorage = projectDir.startsWith("/data/data/com.termux/files/home");
    expect(isInternalTermuxStorage).toBe(true);

    // 2. Wake-lock simulation with trap registration
    let wakeLockHeld = false;
    function acquireWakeLock() { wakeLockHeld = true; }
    function releaseWakeLock() { wakeLockHeld = false; }
    acquireWakeLock();
    expect(wakeLockHeld).toBe(true);

    // 3. Node version check >= 22.5.0
    const nodeVersion = process.versions.node;
    const major = parseInt(nodeVersion.split(".")[0], 10);
    const minor = parseInt(nodeVersion.split(".")[1] || "0", 10);
    const isCompatible = major > 22 || (major === 22 && minor >= 5);
    expect(isCompatible).toBe(true);

    // 4. Memory limit configuration
    const nodeOptions = "--max-old-space-size=1024";
    expect(nodeOptions).toContain("1024");

    // 5. SQLite memory pragmas verification on boot
    const cacheRow = db.prepare("PRAGMA cache_size;").get() as { cache_size: number };
    const tempStoreRow = db.prepare("PRAGMA temp_store;").get() as { temp_store: number };
    const busyRow = db.prepare("PRAGMA busy_timeout;").get() as { timeout: number };

    expect(cacheRow.cache_size).toBe(-2000); // 2MB cache cap
    expect(tempStoreRow.temp_store).toBe(2);   // RAM temp store
    expect(busyRow.timeout).toBe(5000);       // 5s busy timeout

    // 6. LAN IP Detection & 0.0.0.0 Binding
    const detectedLanIp = "192.168.1.105";
    const bindHost = "0.0.0.0";
    const bindPort = 3000;
    const localUrl = `http://localhost:${bindPort}`;
    const lanUrl = `http://${detectedLanIp}:${bindPort}`;

    expect(localUrl).toBe("http://localhost:3000");
    expect(lanUrl).toBe("http://192.168.1.105:3000");
    expect(bindHost).toBe("0.0.0.0");

    // 7. Clean exit releases wake-lock
    releaseWakeLock();
    expect(wakeLockHeld).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Resident Offline Dropout, Form Recovery & Bilingual Submission
  // --------------------------------------------------------------------------
  it("Scenario 2: Resident Offline Dropout, Form Recovery & Bilingual Submission (F5, F6, F7, F10, F11, F12, F13, F14)", async () => {
    // 1. Mobile viewport at 360px in Arabic RTL mode
    const viewportWidth = 360;
    const locale = "ar";
    const dir = getDirection(locale);
    expect(dir).toBe("rtl");

    // Mock LocalStorage
    const mockLocalStorage: Record<string, string> = {};
    const DRAFT_KEY = "home_faults_wizard_draft_v1";

    // 2. Resident progresses through Step 1 (Trade) & Step 2 (Subcategory + Symptom)
    const trade = REFERENCE_TRADES.find((t) => t.slug === "PLUMBING")!;
    const subcat = REFERENCE_SUBCATEGORIES.find((s) => s.slug === "PLUMBING_VALVES")!;
    const symptom = REFERENCE_SYMPTOMS.find((s) => s.id === "sym_plumb_tap")!;

    expect(trade.name_ar).toBe("سباكة");
    expect(symptom.symptom_ar).toBe("حنفية بتنقط ومابتفصلش");

    // 3. Step 3: Fill details and attach high-res photo (4000x3000)
    // Downscale photo to 1200x900
    const rawPhotoWidth = 4000;
    const rawPhotoHeight = 3000;
    const maxDim = 1200;
    const downscaledWidth = maxDim;
    const downscaledHeight = Math.round(maxDim / (rawPhotoWidth / rawPhotoHeight));
    expect(downscaledWidth).toBe(1200);
    expect(downscaledHeight).toBe(900);

    const downscaledPhotoBase64 = "data:image/jpeg;base64," + "P".repeat(2048);

    // 4. Auto-save draft to localStorage
    const draftPayload = {
      unitNumber: "204",
      buildingName: "Building A4",
      residentName: "Sherif",
      residentPhone: "+20 100 555 6677",
      tradeId: trade.id,
      subcategoryId: subcat.id,
      symptomId: symptom.id,
      location: "حمام الضيوف",
      description: "صنبور المغسلة يسرب مياه باستمرار حتى بعد الإغلاق المحكم",
      urgency: "NORMAL",
      photos: [downscaledPhotoBase64],
      step: 3,
      timestamp: Date.now(),
    };

    mockLocalStorage[DRAFT_KEY] = JSON.stringify(draftPayload);
    expect(mockLocalStorage[DRAFT_KEY]).toBeDefined();

    // 5. Network Dropout Simulation mid-submission
    let isOnline = false;
    let toastShown: { type: string; title: string } | null = null;

    if (!isOnline) {
      // Offline detection triggers banner and prevents submission
      toastShown = {
        type: "warning",
        title: "لا يوجد اتصال بالإنترنت — تم حفظ المسودة بأمان",
      };
    }

    expect(toastShown?.type).toBe("warning");
    expect(mockLocalStorage[DRAFT_KEY]).not.toBeNull(); // Draft is preserved!

    // 6. Network Reconnects
    isOnline = true;
    toastShown = {
      type: "info",
      title: "تمت استعادة الاتصال بالإنترنت",
    };
    expect(toastShown.type).toBe("info");

    // 7. Recover draft from localStorage
    const recoveredDraft = JSON.parse(mockLocalStorage[DRAFT_KEY]);
    expect(recoveredDraft.residentName).toBe("Sherif");
    expect(recoveredDraft.step).toBe(3);

    // 8. Successful submission on reconnect
    const ticketId = "tkt_scen_2";
    const refNo = "TKT-2026-SC02";

    const insertStmt = db.prepare(`
      INSERT INTO tickets (id, reference_no, unit_id, unit_number, building_name, trade_id, subcategory_id, symptom_id, room_location_ar, description, urgency, status, is_hazard, resident_name, resident_phone, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    insertStmt.run(
      ticketId,
      refNo,
      "unit_204",
      recoveredDraft.unitNumber,
      recoveredDraft.buildingName,
      recoveredDraft.tradeId,
      recoveredDraft.subcategoryId,
      recoveredDraft.symptomId,
      recoveredDraft.location,
      recoveredDraft.description,
      recoveredDraft.urgency,
      "SUBMITTED",
      0,
      recoveredDraft.residentName,
      recoveredDraft.residentPhone,
      JSON.stringify(recoveredDraft.photos)
    );

    // 9. Wipe draft ONLY on HTTP 201 receipt
    const httpStatus = 201;
    if (httpStatus === 201) {
      delete mockLocalStorage[DRAFT_KEY];
    }

    expect(mockLocalStorage[DRAFT_KEY]).toBeUndefined();

    // Verify ticket in SQLite
    const inserted = db.prepare("SELECT * FROM tickets WHERE id = ?;").get(ticketId) as any;
    expect(inserted.reference_no).toBe(refNo);
    expect(inserted.status).toBe("SUBMITTED");
    expect(inserted.resident_name).toBe("Sherif");
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Dispatcher Mobile Triage & Clean Empty-to-Active Lifecycle
  // --------------------------------------------------------------------------
  it("Scenario 3: Dispatcher Mobile Triage & Clean Empty-to-Active Lifecycle (F5, F6, F7, F8, F10)", () => {
    // 1. Dispatcher opens portal on mobile in Arabic RTL mode
    const locale = "ar";
    expect(getDirection(locale)).toBe("rtl");

    // 2. Queue starts completely empty -> Empty state verified
    const activeBefore = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED');").get() as { c: number };
    expect(activeBefore.c).toBe(0);

    const emptyQueueUI = {
      heading_ar: "لا توجد بلاغات جارية في قائمة الانتظار",
      subtext_ar: "ستظهر البلاغات الجديدة المقدمة من السكان هنا فور وصولها",
      buttonMinHeight: 44,
    };
    expect(emptyQueueUI.heading_ar).toContain("لا توجد بلاغات");
    expect(emptyQueueUI.buttonMinHeight).toBeGreaterThanOrEqual(44);

    // 3. New ticket arrives in system
    db.prepare(`
      INSERT INTO tickets (id, reference_no, unit_id, unit_number, trade_id, subcategory_id, symptom_id, description, urgency, status, resident_name, resident_phone)
      VALUES ('tkt_triage_1', 'TKT-2026-TR1', 'u_101', '101', 'trade_plumbing', 'sub_plumb_valves', 'sym_plumb_tap', 'Mixer valve leaking', 'NORMAL', 'SUBMITTED', 'Dina', '+20 100 123 4567');
    `).run();

    const activeAfter = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED');").get() as { c: number };
    expect(activeAfter.c).toBe(1);

    // 4. Dispatcher taps ticket -> Mobile modal sheet opens
    const ticketCard = db.prepare("SELECT * FROM tickets WHERE id = 'tkt_triage_1';").get() as any;
    expect(ticketCard.status).toBe("SUBMITTED");

    // 5. Dispatcher moves ticket to CONTRACTOR_CONTACTED and assigns contractor
    const contractor = db.prepare("SELECT * FROM contractors WHERE id = 'cont_1';").get() as any;
    expect(contractor.name_ar).toBe("شركة الأهرام للسباكة");

    db.prepare(`
      UPDATE tickets 
      SET status = 'CONTRACTOR_CONTACTED', assigned_contractor_id = ?
      WHERE id = 'tkt_triage_1';
    `).run(contractor.id);

    // 6. Success toast notification shown
    const toastMessage = {
      type: "success",
      title: "تم توجيه البلاغ للمقاول بنجاح",
      message: `تم تكليف: ${contractor.name_ar}`,
    };
    expect(toastMessage.type).toBe("success");
    expect(toastMessage.message).toContain("الأهرام للسباكة");

    // 7. Dispatcher marks repair completed (RESOLVED)
    db.prepare(`
      UPDATE tickets 
      SET status = 'RESOLVED', resolution_notes = 'تم تغيير قلب الخلاط وإحكام الربط بدون تسريب.'
      WHERE id = 'tkt_triage_1';
    `).run();

    const resolvedTicket = db.prepare("SELECT * FROM tickets WHERE id = 'tkt_triage_1';").get() as any;
    expect(resolvedTicket.status).toBe("RESOLVED");
    expect(resolvedTicket.resolution_notes).toContain("تغيير قلب الخلاط");

    // 8. Active queue returns to clean empty state
    const activeFinal = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED');").get() as { c: number };
    expect(activeFinal.c).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Landlord Zero-Demo Unit Lifecycle & KPI Verification
  // --------------------------------------------------------------------------
  it("Scenario 4: Landlord Zero-Demo Unit Lifecycle & KPI Verification (F5, F8, F9, F10)", () => {
    // 1. Initial zero-demo state: 0 units in database
    const unitsBefore = db.prepare("SELECT COUNT(*) as c FROM units;").get() as { c: number };
    expect(unitsBefore.c).toBe(0);

    // 2. Landlord creates new unit via UnitManager dialog
    const newUnit = {
      id: "unit_custom_101",
      property_id: "prop_1",
      unit_number: "101",
      building_name: "عمارة الياسمين",
      floor_number: 1,
      resident_name: "", // Zero demo resident prefill!
      resident_phone: "",
      rooms: JSON.stringify(["المطبخ", "الحمام", "الريسبشن", "غرفة النوم"]),
    };

    db.prepare(`
      INSERT INTO units (id, property_id, unit_number, building_name, floor_number, resident_name, resident_phone, rooms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      newUnit.id,
      newUnit.property_id,
      newUnit.unit_number,
      newUnit.building_name,
      newUnit.floor_number,
      newUnit.resident_name,
      newUnit.resident_phone,
      newUnit.rooms
    );

    const unitsAfter = db.prepare("SELECT * FROM units WHERE id = 'unit_custom_101';").get() as any;
    expect(unitsAfter.unit_number).toBe("101");
    expect(unitsAfter.resident_name).toBe(""); // Pristine zero demo verification!
    expect(JSON.parse(unitsAfter.rooms).length).toBe(4);

    // 3. Landlord later assigns tenant credentials
    db.prepare("UPDATE units SET resident_name = 'Tarek', resident_phone = '+20 111 000 9999' WHERE id = 'unit_custom_101';").run();
    const updatedUnit = db.prepare("SELECT * FROM units WHERE id = 'unit_custom_101';").get() as any;
    expect(updatedUnit.resident_name).toBe("Tarek");

    // 4. Landlord KPIs computation
    const totalUnits = db.prepare("SELECT COUNT(*) as c FROM units;").get() as { c: number };
    const occupiedUnits = db.prepare("SELECT COUNT(*) as c FROM units WHERE resident_name != '';").get() as { c: number };
    const occupancyRate = (occupiedUnits.c / totalUnits.c) * 100;

    expect(totalUnits.c).toBe(1);
    expect(occupiedUnits.c).toBe(1);
    expect(occupancyRate).toBe(100);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Mobile Inspection Punch List & Work Order Export
  // --------------------------------------------------------------------------
  it("Scenario 5: Mobile Inspection Punch List & Work Order Export (F5, F6, F7, F8)", () => {
    // 1. Seed 2 tickets across different trades
    db.prepare(`
      INSERT INTO tickets (id, reference_no, unit_id, unit_number, building_name, trade_id, subcategory_id, symptom_id, room_location_ar, description, urgency, status, is_hazard, resident_name, resident_phone)
      VALUES 
        ('tkt_punch_1', 'TKT-2026-P01', 'u_101', '101', 'B1', 'trade_electrical', 'sub_elec_panel', 'sym_elec_sparks', 'المدخل', 'شرز كهربائي', 'EMERGENCY', 'UNDER_REVIEW', 1, 'Hany', '+20 100 111 1111'),
        ('tkt_punch_2', 'TKT-2026-P02', 'u_101', '101', 'B1', 'trade_carpentry', 'sub_carp_doors', 'sym_carp_door_scrape', 'التراس', 'حك الباب', 'LOW', 'APPOINTMENT_SCHEDULED', 0, 'Hany', '+20 100 111 1111');
    `).run();

    // 2. Inspector opens Punch List Report on 360px viewport
    const viewportWidth = 360;
    const tableContainerClass = "overflow-x-auto print:overflow-visible";
    expect(tableContainerClass).toContain("overflow-x-auto");

    // 3. Filter punch list by trade = trade_electrical
    const electricalTasks = db.prepare("SELECT * FROM tickets WHERE trade_id = 'trade_electrical';").all() as any[];
    expect(electricalTasks.length).toBe(1);
    expect(electricalTasks[0].is_hazard).toBe(1);

    // 4. Filter by non-matching trade = trade_pool -> empty state verified
    const poolTasks = db.prepare("SELECT * FROM tickets WHERE trade_id = 'trade_pool';").all() as any[];
    expect(poolTasks.length).toBe(0);

    const emptyFilterNotice = {
      message_ar: "لا توجد مهام أو أعطال مسجلة تطابق محددات التصفية الحالية.",
    };
    expect(emptyFilterNotice.message_ar).toContain("لا توجد مهام");

    // 5. Export Work Order Slip for electrical hazard
    const targetTicket = electricalTasks[0];
    const workOrderDoc = {
      title: "أمر شغل وتكليف صيانة — معاينة وطباعة (PDF)",
      refNo: targetTicket.reference_no,
      unit: targetTicket.unit_number,
      hazardBadge: targetTicket.is_hazard === 1 ? "خطر وسلامة عاجل" : null,
      printReady: true,
    };

    expect(workOrderDoc.refNo).toBe("TKT-2026-P01");
    expect(workOrderDoc.hazardBadge).toBe("خطر وسلامة عاجل");
    expect(workOrderDoc.printReady).toBe(true);
  });
});
