"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  Home,
  Users,
  Printer,
  CheckSquare,
} from "lucide-react";
import { UnitManager } from "./UnitManager";
import { PunchListReport } from "@/components/pdf/PunchListReport";

export function LandlordKPIs() {
  const { locale, t } = useI18n();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-tabs for Landlord: "analytics" | "punch_list" | "manage_units"
  const [activeTab, setActiveTab] = useState<"analytics" | "punch_list" | "manage_units">("analytics");

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const summary = stats?.summary || {
    total_tickets: 0,
    active_tickets: 0,
    resolved_tickets: 0,
    hazard_tickets: 0,
    sla_compliance_percent: 100,
    mttr_hours: 0,
  };

  return (
    <div className="space-y-6">
      {/* Landlord Feature Sub-Navigation (Scrollable Chip Bar on Mobile) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--muted)] border border-[var(--border)] overflow-x-auto no-scrollbar text-xs font-semibold no-print w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`px-3 py-2 min-h-[44px] rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap touch-manipulation cursor-pointer active:scale-95 ${
            activeTab === "analytics"
              ? "bg-[var(--card)] text-sky-600 dark:text-sky-400 shadow-sm font-bold"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{locale === "ar" ? "المؤشرات والتحليلات" : "KPI Analytics"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("punch_list")}
          className={`px-3 py-2 min-h-[44px] rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap touch-manipulation cursor-pointer active:scale-95 ${
            activeTab === "punch_list"
              ? "bg-[var(--card)] text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>{locale === "ar" ? "قائمة مهام الصيانة (Punch List PDF)" : "Punch List (PDF)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("manage_units")}
          className={`px-3 py-2 min-h-[44px] rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap touch-manipulation cursor-pointer active:scale-95 ${
            activeTab === "manage_units"
              ? "bg-[var(--card)] text-amber-600 dark:text-amber-400 shadow-sm font-bold"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{locale === "ar" ? "إدارة الوحدات" : "Manage Units"}</span>
        </button>
      </div>

      {/* TAB 1: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="tactile-card p-4 space-y-2">
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span className="text-xs font-semibold">{t("total_tickets")}</span>
                <Building className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                {summary.total_tickets}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)]">
                {locale === "ar" ? "إجمالي البلاغات المسجلة" : "Total recorded tickets"}
              </div>
            </div>

            <div className="tactile-card p-4 space-y-2">
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span className="text-xs font-semibold">{t("active_tickets")}</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                {summary.active_tickets}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)]">
                {locale === "ar" ? "قيد المتابعة والإصلاح" : "Under review or in repair"}
              </div>
            </div>

            <div className="tactile-card p-4 space-y-2">
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span className="text-xs font-semibold">{t("sla_compliance")}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {summary.sla_compliance_percent}%
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {locale === "ar" ? "استجابة ممتازة للأعطال" : "Meeting SLAs"}
              </div>
            </div>

            <div className="tactile-card p-4 space-y-2">
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span className="text-xs font-semibold">{t("hazard_warning_count")}</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-red-600 dark:text-red-400">
                {summary.hazard_tickets}
              </div>
              <div className="text-[10px] text-red-500 font-semibold">
                {locale === "ar" ? "بلاغات مخاطر حرجة" : "Critical safety alerts"}
              </div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="tactile-card p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-500" />
                <span>{locale === "ar" ? "توزيع الأعطال حسب التخصصات:" : "Fault Distribution by Trade:"}</span>
              </h3>
              <div className="space-y-3">
                {!stats?.trade_distribution || stats.trade_distribution.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--muted-foreground)] space-y-2 border border-dashed border-[var(--border)] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-[var(--foreground)]">
                      {locale === "ar" ? "لا توجد بيانات كافية لعرض التوزيع" : "No Tickets Recorded"}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {locale === "ar"
                        ? "لا توجد بيانات كافية لعرض التوزيع - ستظهر الإحصائيات فور تسجيل أول بلاغ صيانة."
                        : "Statistical breakdown will appear here once maintenance tickets are submitted."}
                    </p>
                  </div>
                ) : (
                  stats.trade_distribution.map((td: any) => (
                    <div key={td.trade_id} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>{locale === "ar" ? td.name_ar : td.name_en}</span>
                        <span className="text-[var(--muted-foreground)] font-mono">
                          {td.count} ({td.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--muted)] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.max(5, td.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="tactile-card p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>{locale === "ar" ? "مسار معالجة البلاغات:" : "Lifecycle Funnel:"}</span>
              </h3>
              <div className="space-y-3">
                {!stats?.status_funnel || stats.status_funnel.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--muted-foreground)] space-y-2 border border-dashed border-[var(--border)] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-[var(--foreground)]">
                      {locale === "ar" ? "المسار خالٍ من البلاغات" : "Funnel is Empty"}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {locale === "ar"
                        ? "لا توجد بلاغات جارية في دورة المعالجة حالياً."
                        : "No tickets are currently moving through the resolution lifecycle."}
                    </p>
                  </div>
                ) : (
                  stats.status_funnel.map((sf: any) => (
                    <div key={sf.status} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[var(--foreground)]">
                          {locale === "ar" ? sf.label_ar : sf.label_en}
                        </div>
                        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{sf.status}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-black text-sm text-[var(--foreground)]">{sf.count}</span>
                        <span className="text-[10px] text-[var(--muted-foreground)] block">{sf.percentage}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Punch List PDF Inspection Report */}
      {activeTab === "punch_list" && (
        <div className="space-y-4">
          <PunchListReport isModal={false} />
        </div>
      )}

      {/* TAB: Unit Management */}
      {activeTab === "manage_units" && <UnitManager />}
    </div>
  );
}
