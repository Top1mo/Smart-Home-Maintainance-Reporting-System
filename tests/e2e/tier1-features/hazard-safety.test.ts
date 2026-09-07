import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, detectHazard } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Built-in Safety Warning & Hazard Detection Engine", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.HAZ.1: verifies electrical sparks & arcing trigger emergency fire warning", () => {
    const res = detectHazard("sym_elec_sparks", "Sparks flying from main distribution panel");
    expect(res.isHazard).toBe(true);
    expect(res.hazardType).toBe("ELECTRICAL_FIRE");
    expect(res.warning_en).toContain("breaker");
    expect(res.warning_ar).toContain("القاطع العمومي");
  });

  it("T1.HAZ.2: verifies water leak near live electrical power triggers deadly electrocution hazard", () => {
    const res = detectHazard("sym_elec_water", "Water dripping through spotlight fixture in bathroom");
    expect(res.isHazard).toBe(true);
    expect(res.hazardType).toBe("WATER_LIVE_POWER");
    expect(res.warning_en?.toLowerCase()).toContain("electrocution");
    expect(res.warning_ar).toContain("صعق");
  });

  it("T1.HAZ.3: verifies false ceiling sagging risk triggers immediate collapse evacuation instructions", () => {
    const res = detectHazard("sym_gyp_sagging", "Visible sagging in gypsum ceiling board");
    expect(res.isHazard).toBe(true);
    expect(res.hazardType).toBe("CEILING_COLLAPSE");
    expect(res.warning_en?.toLowerCase()).toContain("collapse");
    expect(res.warning_ar).toContain("انهيار");
  });

  it("T1.HAZ.4: verifies gas water heater odor triggers explosion warning and evacuation directive", () => {
    const res = detectHazard("sym_gas_leak", "Strong gas odor near kitchen water heater");
    expect(res.isHazard).toBe(true);
    expect(res.hazardType).toBe("GAS_EXPLOSION");
    expect(res.warning_en?.toLowerCase()).toContain("explosion");
    expect(res.warning_ar).toContain("انفجار");
  });

  it("T1.HAZ.5: verifies electric shock on contact triggers earthing failure warning", () => {
    const res = detectHazard("sym_elec_shock", "Tingle and electric shock when touching washing machine");
    expect(res.isHazard).toBe(true);
    expect(res.hazardType).toBe("EARTH_LEAKAGE");
    expect(res.warning_en?.toLowerCase()).toContain("earthing");
    expect(res.warning_ar).toContain("التأريض");
  });

  it("T1.HAZ.6: verifies cracked tempered glass in shower cabin triggers spontaneous shatter warning", () => {
    const res = detectHazard("sym_glass_crack", "Hairline crack in tempered glass shower enclosure");
    expect(res.isHazard).toBe(true);
    expect(res.hazardType).toBe("GLASS_SHATTER");
    expect(res.warning_en?.toLowerCase()).toContain("shatter");
    expect(res.warning_ar).toContain("انفجار");
  });

  it("T1.HAZ.7: verifies swimming pool uncovered main suction drain triggers fatal entrapment hazard", () => {
    const res = detectHazard("sym_pool_suction", "Bottom drain grill missing in deep end of swimming pool");
    expect(res.isHazard).toBe(true);
    expect(res.hazardType).toBe("SUCTION_ENTRAPMENT");
    expect(res.warning_en?.toLowerCase()).toContain("suction");
    expect(res.warning_ar).toContain("شفط");
  });
});
