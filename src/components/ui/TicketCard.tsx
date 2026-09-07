"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/context";
import { CheckCircle2, Clock, Wrench, ShieldAlert } from "lucide-react";
import { getStepperProgress, STATE_METADATA, TicketStatus } from "@/lib/state-machine";

export function TicketCard({
  ticket,
  isSelected,
  onClick,
}: {
  ticket: any;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const { locale, t } = useI18n();

  const statusMeta = STATE_METADATA[ticket.status as TicketStatus] || {
    label_en: ticket.status,
    label_ar: ticket.status,
    badge: {
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/30",
      text: "text-zinc-600",
    },
  };

  const progress = getStepperProgress(ticket.status);

  return (
    <div
      onClick={onClick}
      className={`tactile-card p-4 transition-all cursor-pointer ${
        isSelected
          ? "border-sky-500 ring-2 ring-sky-500/20 shadow-md bg-sky-500/5 dark:bg-sky-950/20"
          : "hover:border-[var(--border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
              {ticket.reference_no || ticket.id}
            </span>
            {ticket.is_hazard && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse">
                <ShieldAlert className="w-3 h-3" />
                <span>{locale === "ar" ? "خطر داهم" : "HAZARD"}</span>
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-[var(--foreground)] mt-1 line-clamp-1">
            {ticket.symptom_ar && locale === "ar" ? ticket.symptom_ar : ticket.symptom_en || ticket.symptom_id}
          </h3>
        </div>

        {/* Status Pill & Badges */}
        <div className="flex flex-col items-end gap-1">
          <div
            className={`tactile-pill text-[10px] whitespace-nowrap ${statusMeta.badge.bg} ${statusMeta.badge.border} ${statusMeta.badge.text}`}
          >
            {locale === "ar" ? statusMeta.label_ar : statusMeta.label_en}
          </div>
          {ticket.parts_needed ? (
            <div className="tactile-pill text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 whitespace-nowrap">
              {locale === "ar" ? "مطلوب قطع غيار" : "Parts Needed"}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mt-3 pt-2 border-t border-[var(--border)]">
        <div>
          <span className="font-semibold text-[var(--foreground)]">
            {locale === "ar" ? "وحدة:" : "Unit:"} {ticket.unit_number || "-"}
          </span>
          {ticket.building_name && (
            <span className="text-[11px] text-[var(--muted-foreground)] ms-1">
              ({ticket.building_name})
            </span>
          )}
          <span className="mx-1.5">•</span>
          <span>{locale === "ar" ? ticket.trade_ar || ticket.trade_id : ticket.trade_en || ticket.trade_id}</span>
        </div>
        <div className="text-[10px]">
          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ""}
        </div>
      </div>

      {/* Progress Stepper Bar (5 stages) */}
      {ticket.status !== "REJECTED" ? (
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                progress >= s ? "bg-sky-500" : "bg-[var(--muted)]"
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2 text-[10px] text-red-500 font-semibold flex items-center gap-1">
          <span>{locale === "ar" ? "تم رفض البلاغ أو إلغاؤه" : "Ticket rejected / closed"}</span>
        </div>
      )}
    </div>
  );
}
