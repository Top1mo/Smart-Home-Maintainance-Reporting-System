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
              {activeRole === "resident" && (locale === "ar" ? "بوابة السكان — تسجيل ومتابعة الأعطال" : "Resident Portal — Report & Track Faults")}
              {activeRole === "dispatcher" && (locale === "ar" ? "لوحة التوزيع والمتابعة — معالجة وتوجيه البلاغات" : "Dispatcher Operations — Triage & Contractor Management")}
              {activeRole === "landlord" && (locale === "ar" ? "لوحة تحكم الإدارة والمالك — مؤشرات الأداء والتحليلات" : "Owner & Landlord KPI — Operations Analytics")}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {locale === "ar"
                ? "نظام إدارة أعطال المنازل وفقاً لمعايير السوق المصري ومسار الـ ٨ مراحل المعتمد"
                : "Full-lifecycle residential maintenance reporting and dispatch system"}
            </p>
          </div>

          <div className="tactile-pill text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30">
            {activeRole === "resident" && (locale === "ar" ? "وضع الساكن" : "Resident Mode")}
            {activeRole === "dispatcher" && (locale === "ar" ? "وضع المتابع الميداني" : "Dispatcher Mode")}
            {activeRole === "landlord" && (locale === "ar" ? "وضع المالك" : "Landlord Mode")}
          </div>
        </div>

        {/* View Switcher based on Active Persona */}
        {activeRole === "resident" && <ResidentWizard />}
        {activeRole === "dispatcher" && <DispatcherTriage />}
        {activeRole === "landlord" && <LandlordKPIs />}
      </main>

      {/* Modern Tactile Footer */}
      <footer className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted-foreground)] mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4">
          <span>Home Faults Report System • نظام الإبلاغ عن أعطال المنازل</span>
          <span className="mx-2">•</span>
          <span>11 Trade Taxonomy</span>
          <span className="mx-2">•</span>
          <span>Egyptian Market Wording</span>
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
