import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { STATE_METADATA, TicketStatus } from '@/lib/state-machine';
import { handleRouteError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    // 1. Overall volume counts
    const counts: any = db
      .prepare(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status IN ('SUBMITTED', 'UNDER_REVIEW', 'CONTRACTOR_CONTACTED', 'APPOINTMENT_SCHEDULED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as active_tickets,
          SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted_tickets,
          SUM(CASE WHEN status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review_tickets,
          SUM(CASE WHEN status = 'CONTRACTOR_CONTACTED' THEN 1 ELSE 0 END) as contractor_contacted_tickets,
          SUM(CASE WHEN status = 'APPOINTMENT_SCHEDULED' THEN 1 ELSE 0 END) as appointment_scheduled_tickets,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_tickets,
          SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_tickets,
          SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed_tickets,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_tickets,
          SUM(CASE WHEN is_hazard = 1 THEN 1 ELSE 0 END) as hazard_tickets,
          SUM(CASE WHEN severity = 'CRITICAL' OR urgency = 'EMERGENCY' THEN 1 ELSE 0 END) as critical_tickets
        FROM tickets
      `)
      .get();

    const totalTickets = counts?.total_tickets || 0;

    // 2. Mean Time To Resolution (MTTR in hours) & Dynamic SLA Compliance
    const resolutionStats: any = db
      .prepare(`
        SELECT 
          COUNT(*) as resolved_count,
          AVG((julianday(resolved_at) - julianday(created_at)) * 24.0) as avg_mttr_hours,
          SUM(CASE 
            WHEN (is_hazard = 1 OR severity = 'CRITICAL' OR urgency = 'EMERGENCY') 
                 AND ((julianday(resolved_at) - julianday(created_at)) * 24.0 <= 24.0) THEN 1
            WHEN (severity = 'HIGH' OR urgency = 'HIGH') 
                 AND ((julianday(resolved_at) - julianday(created_at)) * 24.0 <= 48.0) THEN 1
            WHEN ((julianday(resolved_at) - julianday(created_at)) * 24.0 <= 72.0) THEN 1
            ELSE 0 
          END) as sla_met_count
        FROM tickets
        WHERE resolved_at IS NOT NULL AND status IN ('RESOLVED', 'CLOSED')
      `)
      .get();

    const resolvedCount = resolutionStats?.resolved_count || 0;
    const mttrHours =
      resolvedCount > 0 && resolutionStats?.avg_mttr_hours != null
        ? Math.round(resolutionStats.avg_mttr_hours * 10) / 10
        : 0;

    const slaCompliancePercent =
      resolvedCount > 0
        ? Math.round(((resolutionStats?.sla_met_count || 0) / resolvedCount) * 1000) / 10
        : 0;

    // 3. Trade Distribution (All 11 trades)
    const tradeRows: any[] = db
      .prepare(`
        SELECT 
          tr.id as trade_id,
          tr.slug,
          tr.name_en,
          tr.name_ar,
          tr.icon,
          COUNT(t.id) as count
        FROM trades tr
        LEFT JOIN tickets t ON tr.id = t.trade_id
        GROUP BY tr.id, tr.slug, tr.name_en, tr.name_ar, tr.icon, tr.order_index
        ORDER BY tr.order_index ASC
      `)
      .all();

    const tradeDistribution = tradeRows.map((t) => ({
      ...t,
      percentage: totalTickets > 0 ? Math.round((t.count / totalTickets) * 1000) / 10 : 0,
    }));

    // 4. Status Progression Funnel
    const statusOrder: TicketStatus[] = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'CONTRACTOR_CONTACTED',
      'APPOINTMENT_SCHEDULED',
      'IN_PROGRESS',
      'RESOLVED',
      'CLOSED',
      'REJECTED',
    ];

    const statusCountsMap: Record<string, number> = {
      SUBMITTED: counts?.submitted_tickets || 0,
      UNDER_REVIEW: counts?.under_review_tickets || 0,
      CONTRACTOR_CONTACTED: counts?.contractor_contacted_tickets || 0,
      APPOINTMENT_SCHEDULED: counts?.appointment_scheduled_tickets || 0,
      IN_PROGRESS: counts?.in_progress_tickets || 0,
      RESOLVED: counts?.resolved_tickets || 0,
      CLOSED: counts?.closed_tickets || 0,
      REJECTED: counts?.rejected_tickets || 0,
    };

    const statusFunnel = statusOrder.map((st) => {
      const count = statusCountsMap[st] || 0;
      const meta = STATE_METADATA[st];
      return {
        status: st,
        label_en: meta.label_en,
        label_ar: meta.label_ar,
        count,
        percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 1000) / 10 : 0,
      };
    });

    // 5. Recent Activity
    const recentActivity: any[] = db
      .prepare(`
        SELECT 
          te.id,
          te.ticket_id,
          te.from_status,
          te.to_status,
          te.actor_name,
          te.actor_role,
          te.performed_by,
          te.notes,
          te.created_at,
          t.unit_number,
          t.property_name,
          tr.name_en AS trade_name_en,
          tr.name_ar AS trade_name_ar
        FROM ticket_events te
        JOIN tickets t ON te.ticket_id = t.id
        LEFT JOIN trades tr ON t.trade_id = tr.id
        ORDER BY te.id DESC
        LIMIT 10
      `)
      .all();

    return NextResponse.json({
      summary: {
        total_tickets: totalTickets,
        active_tickets: counts?.active_tickets || 0,
        resolved_tickets: counts?.resolved_tickets || 0,
        closed_tickets: counts?.closed_tickets || 0,
        rejected_tickets: counts?.rejected_tickets || 0,
        hazard_tickets: counts?.hazard_tickets || 0,
        critical_tickets: counts?.critical_tickets || 0,
        mttr_hours: mttrHours,
        sla_compliance_percent: slaCompliancePercent,
      },
      trade_distribution: tradeDistribution,
      status_funnel: statusFunnel,
      recent_activity: recentActivity,
    });
  } catch (error: any) {
    return handleRouteError(error);
  }
}
