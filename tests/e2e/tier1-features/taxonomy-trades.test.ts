import { describe, it, expect, beforeEach } from "vitest";
import {
  createTestDb,
  REFERENCE_TRADES,
  type Trade,
} from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: 11-Trade Smart Taxonomy Feature Coverage", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.1: verifies Plumbing (سباكة) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("PLUMBING") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Plumbing");
    expect(trade.name_ar).toBe("سباكة");
    expect(trade.order_index || (trade as any).sort_order).toBe(1);
  });

  it("T1.2: verifies Electrical (كهرباء) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("ELECTRICAL") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Electrical");
    expect(trade.name_ar).toBe("كهرباء");
    expect(trade.order_index || (trade as any).sort_order).toBe(2);
  });

  it("T1.3: verifies HVAC & Air Conditioning (تكييف وتبريد) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("HVAC") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("HVAC & Air Conditioning");
    expect(trade.name_ar).toBe("تكييف وتبريد");
    expect(trade.order_index || (trade as any).sort_order).toBe(3);
  });

  it("T1.4: verifies Carpentry & Joinery (نجارة وأبواب) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("CARPENTRY") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Carpentry & Joinery");
    expect(trade.name_ar).toBe("نجارة وأبواب");
    expect(trade.order_index || (trade as any).sort_order).toBe(4);
  });

  it("T1.5: verifies Aluminum & Glazing Works (ألوميتال وزجاج) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("ALUMINUM") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Aluminum & Glazing Works");
    expect(trade.name_ar).toBe("ألوميتال وزجاج");
    expect(trade.order_index || (trade as any).sort_order).toBe(5);
  });

  it("T1.6: verifies Gypsum Boards & False Ceilings (جبس بورد وأسقف معلقة) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("GYPSUM") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Gypsum Boards & False Ceilings");
    expect(trade.name_ar).toBe("جبس بورد وأسقف معلقة");
    expect(trade.order_index || (trade as any).sort_order).toBe(6);
  });

  it("T1.7: verifies Painting & Surface Finishes (نقاشة ودهانات) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("PAINTING") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Painting & Surface Finishes");
    expect(trade.name_ar).toBe("نقاشة ودهانات");
    expect(trade.order_index || (trade as any).sort_order).toBe(7);
  });

  it("T1.8: verifies Swimming Pool & Water Amenities (حمام سباحة) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("POOL") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Swimming Pool & Water Amenities");
    expect(trade.name_ar).toBe("حمام سباحة");
    expect(trade.order_index || (trade as any).sort_order).toBe(8);
  });

  it("T1.9: verifies Civil, Masonry & Tiling (سيراميك وبلاط وبناء) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("CIVIL_TILING") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Civil, Masonry & Tiling");
    expect(trade.name_ar).toBe("سيراميك وبلاط وبناء");
    expect(trade.order_index || (trade as any).sort_order).toBe(9);
  });

  it("T1.10: verifies Major Landlord Appliances (أجهزة منزلية) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("APPLIANCES") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Major Landlord Appliances");
    expect(trade.name_ar).toBe("أجهزة منزلية");
    expect(trade.order_index || (trade as any).sort_order).toBe(10);
  });

  it("T1.11: verifies Grounds, Exterior & Roofing (واجهات وأسطح وحدائق) trade exists with correct schema and order", () => {
    const trade = db.prepare("SELECT * FROM trades WHERE slug = ?").get("GROUNDS_EXTERIOR") as Trade;
    expect(trade).toBeDefined();
    expect(trade.name_en).toBe("Grounds, Exterior & Roofing");
    expect(trade.name_ar).toBe("واجهات وأسطح وحدائق");
    expect(trade.order_index || (trade as any).sort_order).toBe(11);
  });

  it("T1.12: verifies exact trade count is 11 and order sequence is contiguous from 1 to 11", () => {
    const trades = db.prepare("SELECT * FROM trades ORDER BY sort_order ASC").all() as any[];
    expect(trades).toHaveLength(11);
    const expectedSlugs = [
      "PLUMBING",
      "ELECTRICAL",
      "HVAC",
      "CARPENTRY",
      "ALUMINUM",
      "GYPSUM",
      "PAINTING",
      "POOL",
      "CIVIL_TILING",
      "APPLIANCES",
      "GROUNDS_EXTERIOR",
    ];
    expect(trades.map((t) => t.slug)).toEqual(expectedSlugs);
    trades.forEach((t, idx) => {
      expect(t.sort_order).toBe(idx + 1);
    });
  });
});
