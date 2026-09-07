import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, REFERENCE_SUBCATEGORIES, REFERENCE_SYMPTOMS } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Dedicated Low-Voltage (ELV) Electrical Specialization", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.ELV.1: verifies all low-voltage branches have is_elv flag set to true", () => {
    const elvSubs = db.prepare("SELECT * FROM subcategories WHERE is_elv = 1").all() as any[];
    expect(elvSubs.length).toBeGreaterThanOrEqual(4);
    const slugs = elvSubs.map((s) => s.slug);
    expect(slugs).toContain("ELECTRICAL_ELV_CCTV");
    expect(slugs).toContain("ELECTRICAL_ELV_INTERCOM");
    expect(slugs).toContain("ELECTRICAL_ELV_WIFI");
    expect(slugs).toContain("ELECTRICAL_ELV_GATES");
  });

  it("T1.ELV.2: verifies CCTV surveillance system subcategory and symptoms exist under Electrical", () => {
    const cctv = db.prepare(`
      SELECT s.*, t.slug as trade_slug 
      FROM subcategories s 
      JOIN trades t ON s.trade_id = t.id 
      WHERE s.slug = 'ELECTRICAL_ELV_CCTV'
    `).get() as any;
    expect(cctv).toBeDefined();
    expect(cctv.trade_slug).toBe("ELECTRICAL");
    expect(cctv.name_ar).toBe("كاميرات المراقبة");

    const sym = db.prepare("SELECT * FROM fault_symptoms WHERE subcategory_id = ? AND id = 'sym_cctv_black'").get(cctv.id) as any;
    expect(sym).toBeDefined();
    expect(sym.name_en).toContain("Video Loss");
  });

  it("T1.ELV.3: verifies Intercom & Access Control subcategory and symptoms exist under Electrical", () => {
    const intercom = db.prepare(`
      SELECT s.*, t.slug as trade_slug 
      FROM subcategories s 
      JOIN trades t ON s.trade_id = t.id 
      WHERE s.slug = 'ELECTRICAL_ELV_INTERCOM'
    `).get() as any;
    expect(intercom).toBeDefined();
    expect(intercom.trade_slug).toBe("ELECTRICAL");
    expect(intercom.name_ar).toBe("الإنتركم والتحكم في الدخول");

    const sym = db.prepare("SELECT * FROM fault_symptoms WHERE subcategory_id = ? AND id = 'sym_intercom_dead'").get(intercom.id) as any;
    expect(sym).toBeDefined();
  });

  it("T1.ELV.4: verifies Wi-Fi Access Points & LAN subcategory and symptoms exist under Electrical", () => {
    const wifi = db.prepare(`
      SELECT s.*, t.slug as trade_slug 
      FROM subcategories s 
      JOIN trades t ON s.trade_id = t.id 
      WHERE s.slug = 'ELECTRICAL_ELV_WIFI'
    `).get() as any;
    expect(wifi).toBeDefined();
    expect(wifi.trade_slug).toBe("ELECTRICAL");
    expect(wifi.name_ar).toBe("نقاط الواي فاي والشبكات");

    const sym = db.prepare("SELECT * FROM fault_symptoms WHERE subcategory_id = ? AND id = 'sym_wifi_offline'").get(wifi.id) as any;
    expect(sym).toBeDefined();
  });

  it("T1.ELV.5: verifies Automated Gates & Barriers subcategory and symptoms exist under Electrical", () => {
    const gates = db.prepare(`
      SELECT s.*, t.slug as trade_slug 
      FROM subcategories s 
      JOIN trades t ON s.trade_id = t.id 
      WHERE s.slug = 'ELECTRICAL_ELV_GATES'
    `).get() as any;
    expect(gates).toBeDefined();
    expect(gates.trade_slug).toBe("ELECTRICAL");
    expect(gates.name_ar).toBe("بوابات أوتوماتيكية وإلكترونية");
  });

  it("T1.ELV.6: verifies Automated Gate Safety Photocell failure is flagged as a life-safety CRUSH HAZARD", () => {
    const sym = db.prepare("SELECT * FROM fault_symptoms WHERE id = 'sym_gate_beam'").get() as any;
    expect(sym).toBeDefined();
    expect(sym.is_hazard).toBe(1);
    expect(sym.default_urgency).toBe("EMERGENCY");
    expect(sym.hazard_warning_en).toContain("Crush hazard");
    expect(sym.hazard_warning_ar).toContain("خطر سحق");
  });
});
