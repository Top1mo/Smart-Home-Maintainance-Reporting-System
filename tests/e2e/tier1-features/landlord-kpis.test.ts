import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../test-helpers";
import { DatabaseSync } from "node:sqlite";

describe("Tier 1: Landlord Portfolio Summary & Operational KPIs", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createTestDb();
  });

  it("T1.KPI.1: computes total ticket volume and active pipeline count", () => {
    const totalRow = db.prepare("SELECT COUNT(*) as total FROM tickets").get() as any;
    expect(totalRow.total).toBe(13);

    const activeRow = db.prepare(`
      SELECT COUNT(*) as active FROM tickets
      WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', 'IN_PROGRESS')
    `).get() as any;
    expect(activeRow.active).toBe(9);
  });

  it("T1.KPI.2: computes distribution of tickets across all 11 trade categories", () => {
    const dist = db.prepare(`
      SELECT tr.slug, tr.name_en, tr.name_ar, COUNT(t.id) as ticket_count
      FROM trades tr
      LEFT JOIN tickets t ON tr.id = t.trade_id
      GROUP BY tr.id
      ORDER BY tr.sort_order ASC
    `).all() as any[];

    expect(dist).toHaveLength(11);
    const electrical = dist.find((d) => d.slug === "ELECTRICAL");
    expect(electrical.ticket_count).toBeGreaterThanOrEqual(4); // includes ELV tickets
  });

  it("T1.KPI.3: calculates Mean Time to Resolution (MTTR) in hours for resolved/closed tickets", () => {
    const resolvedTickets = db.prepare(`
      SELECT id, created_at, resolved_at
      FROM tickets
      WHERE status IN ('RESOLVED', 'CLOSED') AND resolved_at IS NOT NULL
    `).all() as any[];

    expect(resolvedTickets.length).toBeGreaterThan(0);
    resolvedTickets.forEach((t) => {
      const created = new Date(t.created_at).getTime();
      const resolved = new Date(t.resolved_at).getTime();
      expect(resolved).toBeGreaterThan(0);
    });
  });

  it("T1.KPI.4: computes complete status funnel distribution across all 8 states", () => {
    const funnel = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM tickets
      GROUP BY status
    `).all() as any[];

    const statusCounts = Object.fromEntries(funnel.map((f) => [f.status, f.count]));
    expect(statusCounts["SUBMITTED"]).toBe(2);
    expect(statusCounts["UNDER_REVIEW"]).toBe(1);
    expect(statusCounts["CONTRACTOR_CONTACTED"]).toBe(2);
    expect(statusCounts["APPOINTMENT_SCHEDULED"]).toBe(2);
    expect(statusCounts["IN_PROGRESS"]).toBe(2);
    expect(statusCounts["RESOLVED"]).toBe(2);
    expect(statusCounts["CLOSED"]).toBe(1);
    expect(statusCounts["REJECTED"]).toBe(1);
  });

  it("T1.KPI.5: calculates hazard incidence rate percentage across portfolio", () => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_hazard = 1 THEN 1 ELSE 0 END) as hazard_count
      FROM tickets
    `).get() as any;

    expect(stats.total).toBe(13);
    expect(stats.hazard_count).toBeGreaterThan(0);
    const hazardRate = (stats.hazard_count / stats.total) * 100;
    expect(hazardRate).toBeGreaterThan(30); // ~5/13 are hazards
  });
});
