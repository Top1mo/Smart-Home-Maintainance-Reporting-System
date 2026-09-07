"use client";

import React, { useState } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { Header } from "@/components/layout/Header";
import { ResidentWizard } from "@/components/resident/ResidentWizard";
import { DispatcherTriage } from "@/components/dispatcher/DispatcherTriage";
import { LandlordKPIs } from "@/components/landlord/LandlordKPIs";

function MainDashboard() {
  const [activeRole, setActiveRole] = useState<"resident" | "dispatcher" | "landlord">("resident");
  const { locale } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-sky-500 selection:text-white">
      {/* Universal Header with Role & Language Switcher */}
      <Header activeRole={activeRole} onSelectRole={setActiveRole} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-8">
        {/* Role Header Banner */}
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 no-print">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {activeRole === "resident" && (locale === "ar" ? "تسجيل وبلاغ عطل جديد" : "Report a Fault")}
              {activeRole === "dispatcher" && (locale === "ar" ? "لوحة المتابعة وتوزيع البلاغات" : "Follow-up & Triage")}
              {activeRole === "landlord" && (locale === "ar" ? "الإدارة والتحليلات وإدارة الوحدات" : "Management & Unit Operations")}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {locale === "ar"
                ? "تسجيل ومتابعة أعطال الصيانة وتوجيه الفنيين وإصدار أوامر الشغل وقوائم الفحص الميداني"
                : "Comprehensive residential maintenance reporting, work order dispatch, and field inspections"}
            </p>
          </div>

          <div className="tactile-pill text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30">
            {activeRole === "resident" && (locale === "ar" ? "تسجيل عطل" : "Fault Report")}
            {activeRole === "dispatcher" && (locale === "ar" ? "المتابعة" : "Follow-up")}
            {activeRole === "landlord" && (locale === "ar" ? "الإدارة والوحدات" : "Management")}
          </div>
        </div>

        {/* View Switcher based on Active Persona */}
        {activeRole === "resident" && <ResidentWizard />}
        {activeRole === "dispatcher" && <DispatcherTriage />}
        {activeRole === "landlord" && <LandlordKPIs />}
      </main>

      {/* Modern Tactile Footer */}
      <footer className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted-foreground)] mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-2">
          <span>{locale === "ar" ? "نظام إدارة وصيانة المنزل" : "Home Maintenance & Operations Portal"}</span>
          <span>•</span>
          <span>{locale === "ar" ? "إصدار أوامر الشغل وقوائم الفحص الميداني (PDF)" : "Work Orders & Punch Lists (PDF)"}</span>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <I18nProvider>
      <MainDashboard />
    </I18nProvider>
  );
}
