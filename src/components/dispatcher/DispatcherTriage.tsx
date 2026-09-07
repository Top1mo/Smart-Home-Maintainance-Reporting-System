"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { TicketCard } from "@/components/ui/TicketCard";
import {
  Phone,
  Calendar,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Send,
  MessageSquare,
  ShieldAlert,
  Printer,
  ChevronLeft,
  ChevronRight,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  TicketStatus,
  STATE_METADATA,
  getAllowedTransitions,
} from "@/lib/state-machine";
import { WorkOrderSlip } from "@/components/pdf/WorkOrderSlip";
import { PunchListReport } from "@/components/pdf/PunchListReport";

export function DispatcherTriage() {
  const { locale, direction, t } = useI18n();

  const [tickets, setTickets] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [printTicket, setPrintTicket] = useState<any | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [activeSubTab, setActiveSubTab] = useState<"active" | "archive" | "punch_list">("active");
  const [republishing, setRepublishing] = useState<boolean>(false);

  // Filters
  const [filterTrade, setFilterTrade] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Transition Modal State
  const [actionModal, setActionModal] = useState<{
    targetStatus: TicketStatus;
    ticketId: string;
  } | null>(null);

  const [selectedContractorId, setSelectedContractorId] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("2026-09-10T14:00:00Z");
  const [actionNotes, setActionNotes] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("Duplicate report from same resident");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const isArchivedStatus = (status: string) =>
    status === "RESOLVED" || status === "CLOSED" || status === "REJECTED";

  const activeTickets = tickets.filter((t) => !isArchivedStatus(t.status));
  const archiveTickets = tickets.filter((t) => isArchivedStatus(t.status));
  const currentPool = activeSubTab === "archive" ? archiveTickets : activeTickets;

  // Load tickets and contractors
  const fetchTickets = async (preferTicketId?: string) => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
        if (preferTicketId) {
          setSelectedTicketId(preferTicketId);
        } else if (!selectedTicketId && data.tickets.length > 0) {
          const firstActive = data.tickets.find((t: any) => !isArchivedStatus(t.status));
          setSelectedTicketId(firstActive ? firstActive.id : data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleTabChange = (tab: "active" | "archive" | "punch_list") => {
    setActiveSubTab(tab);
    setFilterStatus("ALL");
    if (tab === "active") {
      if (!activeTickets.some((t) => t.id === selectedTicketId) && activeTickets.length > 0) {
        setSelectedTicketId(activeTickets[0].id);
      }
    } else if (tab === "archive") {
      if (!archiveTickets.some((t) => t.id === selectedTicketId) && archiveTickets.length > 0) {
        setSelectedTicketId(archiveTickets[0].id);
      }
    }
  };

  const handleRepublishTicket = async (ticketId: string) => {
    if (republishing) return;
    setRepublishing(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/republish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_name: "Dispatcher",
          notes: "إعادة نشر البلاغ من سجل الأرشيف والمنتهي",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to republish ticket");
      }

      const data = await res.json();
      const newTicket = data.ticket;

      await fetchTickets(newTicket?.id);
      setActiveSubTab("active");
      if (newTicket?.id) {
        setSelectedTicketId(newTicket.id);
        setMobileView("detail");
      }
      alert(
        locale === "ar"
          ? `تم إعادة نشر البلاغ بنجاح برقم مرجعي جديد: ${newTicket?.reference_no || newTicket?.id}`
          : `Ticket successfully republished with reference: ${newTicket?.reference_no || newTicket?.id}`
      );
    } catch (err: any) {
      alert(err.message || "Failed to republish ticket");
    } finally {
      setRepublishing(false);
    }
  };

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;
  const allowedTransitions = activeTicket
    ? getAllowedTransitions(activeTicket.status as TicketStatus)
    : [];

  // Filtered ticket queue
  const filteredTickets = currentPool.filter((t) => {
    if (filterTrade !== "ALL" && t.trade_id !== filterTrade && t.trade_slug !== filterTrade) return false;
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchRef = (t.reference_no || t.id).toLowerCase().includes(q);
      const matchUnit = (t.unit_number || "").toLowerCase().includes(q);
      const matchDesc = (t.description || "").toLowerCase().includes(q);
      return matchRef || matchUnit || matchDesc;
    }
    return true;
  });

  // Handle state transition submission
  const handleExecuteTransition = async () => {
    if (!actionModal) return;
    setActionLoading(true);

    try {
      const payload: any = {
        to_status: actionModal.targetStatus,
        actor_name: "Operations Dispatcher",
        actor_role: "DISPATCHER",
        notes: actionNotes.trim() || undefined,
      };

      if (actionModal.targetStatus === "CONTRACTOR_CONTACTED") {
        payload.assigned_contractor_id = selectedContractorId || "cont_elec";
      }

      if (actionModal.targetStatus === "APPOINTMENT_SCHEDULED") {
        payload.appointment_date = appointmentDate;
      }

      if (actionModal.targetStatus === "REJECTED") {
        payload.rejection_reason = rejectionReason;
        payload.rejection_reason_code = "DUPLICATE";
        payload.rejection_notes = actionNotes;
      }

      if (actionModal.targetStatus === "RESOLVED") {
        payload.resolution_notes = actionNotes || "Completed repair successfully.";
      }

      const res = await fetch(`/api/tickets/${actionModal.ticketId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transition failed");
      }

      // Refresh list
      await fetchTickets();
      setActionModal(null);
      setActionNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4 screen-dashboard-content">
        {/* Top Sub-Navigation Tabs for Dispatcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--muted)] border border-[var(--border)] overflow-x-auto no-scrollbar text-xs font-semibold no-print w-full sm:w-fit">
          <button
            type="button"
            onClick={() => handleTabChange("active")}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap touch-manipulation cursor-pointer active:scale-95 ${
              activeSubTab === "active"
                ? "bg-[var(--card)] text-sky-600 dark:text-sky-400 shadow-sm font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{locale === "ar" ? "البلاغات الجارية" : "Active Queue"}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === "active"
                ? "bg-sky-500/20 text-sky-700 dark:text-sky-300"
                : "bg-[var(--border)] text-[var(--muted-foreground)]"
            }`}>
              {activeTickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("archive")}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap touch-manipulation cursor-pointer active:scale-95 ${
              activeSubTab === "archive"
                ? "bg-[var(--card)] text-amber-600 dark:text-amber-400 shadow-sm font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{locale === "ar" ? "سجل الأرشيف والمنتهي" : "Archive & History"}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === "archive"
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-[var(--border)] text-[var(--muted-foreground)]"
            }`}>
              {archiveTickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("punch_list")}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap touch-manipulation cursor-pointer active:scale-95 ${
              activeSubTab === "punch_list"
                ? "bg-[var(--card)] text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{locale === "ar" ? "قائمة مهام الصيانة (Punch List PDF)" : "Punch List (PDF)"}</span>
          </button>

          {activeTicket && (
            <button
              type="button"
              onClick={() => setPrintTicket(activeTicket)}
              className="px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap touch-manipulation cursor-pointer active:scale-95 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              title={locale === "ar" ? "طباعة أمر الشغل للوحدة المحددة" : "Print Work Order Slip"}
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{locale === "ar" ? `طباعة أمر الشغل (شقة ${activeTicket.unit_number})` : `Work Order #${activeTicket.unit_number} (PDF)`}</span>
            </button>
          )}
        </div>

        {/* TAB 1: Punch List Report */}
        {activeSubTab === "punch_list" && (
          <div className="space-y-4">
            <PunchListReport isModal={false} />
          </div>
        )}

        {/* TAB 2 & 3: Triage Queue & Archive */}
        {activeSubTab !== "punch_list" && (
          <>
            {/* Top Filter Bar */}
            <div className="tactile-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("action_search")}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] w-48 sm:w-64"
                />

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                >
                  <option value="ALL">
                    {locale === "ar"
                      ? activeSubTab === "archive" ? "كل الحالات المؤرشفة" : "كل الحالات الجارية"
                      : activeSubTab === "archive" ? "All Archived" : "All Active"}
                  </option>
                  {(activeSubTab === "archive"
                    ? (["RESOLVED", "CLOSED", "REJECTED"] as TicketStatus[])
                    : (["SUBMITTED", "TRIAGED", "CONTRACTOR_CONTACTED", "APPOINTMENT_SCHEDULED", "IN_PROGRESS"] as TicketStatus[])
                  ).map((s) => (
                    <option key={s} value={s}>
                      {locale === "ar" ? STATE_METADATA[s]?.label_ar : STATE_METADATA[s]?.label_en}
                    </option>
                  ))}
                </select>

                {/* Top Quick Print Button */}
                {activeTicket && (
                  <button
                    type="button"
                    onClick={() => setPrintTicket(activeTicket)}
                    className="tactile-button px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto"
                    title={locale === "ar" ? "طباعة أمر الشغل للوحدة المحددة" : "Print Work Order Slip"}
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-400" />
                    <span>{locale === "ar" ? "طباعة أمر الشغل (PDF)" : "Work Order Slip"}</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-[var(--muted-foreground)] font-semibold">
                {locale === "ar"
                  ? `${filteredTickets.length} بلاغ في ${activeSubTab === "archive" ? "سجل الأرشيف" : "القائمة الجارية"}`
                  : `${filteredTickets.length} tickets in ${activeSubTab === "archive" ? "archive" : "queue"}`}
              </div>
            </div>

      {/* Mobile Toggle Bar: Queue vs Details */}
      <div className="lg:hidden flex items-center bg-[var(--muted)] p-1 rounded-xl border border-[var(--border)] text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={`flex-1 py-2 text-center rounded-lg transition-all touch-manipulation cursor-pointer ${
            mobileView === "list"
              ? "bg-[var(--card)] text-sky-600 dark:text-sky-400 shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {locale === "ar"
            ? `${activeSubTab === "archive" ? "سجل الأرشيف" : "قائمة البلاغات"} (${filteredTickets.length})`
            : `${activeSubTab === "archive" ? "Archive" : "Queue"} (${filteredTickets.length})`}
        </button>
        <button
          type="button"
          disabled={!activeTicket}
          onClick={() => setMobileView("detail")}
          className={`flex-1 py-2 text-center rounded-lg transition-all touch-manipulation cursor-pointer ${
            mobileView === "detail"
              ? "bg-[var(--card)] text-sky-600 dark:text-sky-400 shadow-sm"
              : "text-[var(--muted-foreground)] disabled:opacity-40"
          }`}
        >
          {locale === "ar" ? "تفاصيل البلاغ المحدد" : "Selected Details"}
        </button>
      </div>

      {/* Split-Pane Master-Detail (Desktop Wide + Mobile Stack) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Master Pane: Ticket List (Col 5) */}
        <div className={`lg:col-span-5 space-y-2 max-h-[750px] overflow-y-auto pr-1 ${mobileView === "detail" ? "hidden lg:block" : "block"}`}>
          {loading ? (
            <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
              {locale === "ar" ? "جاري تحميل البلاغات..." : "Loading triage queue..."}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="tactile-card p-8 text-center text-xs text-[var(--muted-foreground)]">
              {locale === "ar"
                ? activeSubTab === "archive"
                  ? "لا توجد بلاغات منتهية أو مؤرشفة تطابق البحث"
                  : "لا توجد بلاغات جارية تطابق البحث"
                : "No tickets match your filters"}
            </div>
          ) : (
            filteredTickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                isSelected={t.id === selectedTicketId}
                onClick={() => {
                  setSelectedTicketId(t.id);
                  setMobileView("detail");
                }}
              />
            ))
          )}
        </div>

        {/* Detail Pane: Inspection & Action Center (Col 7) */}
        <div className={`lg:col-span-7 ${mobileView === "list" ? "hidden lg:block" : "block"}`}>
          {activeTicket ? (
            <div className="tactile-card p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Mobile Back Button to Return to Queue */}
              <div className="lg:hidden pb-3 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="tactile-button py-2 px-3 bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-lg text-xs font-bold flex items-center gap-1.5 touch-manipulation cursor-pointer"
                >
                  {direction === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  <span>{locale === "ar" ? "العودة لقائمة البلاغات" : "Back to Ticket Queue"}</span>
                </button>
              </div>

              {/* Detail Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-sky-600 dark:text-sky-400">
                      {activeTicket.reference_no || activeTicket.id}
                    </span>
                    {activeTicket.is_hazard && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{locale === "ar" ? "خطر وسلامة عاجل" : "CRITICAL HAZARD"}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)] mt-1">
                    {activeTicket.symptom_ar && locale === "ar"
                      ? activeTicket.symptom_ar
                      : activeTicket.symptom_en || activeTicket.symptom_id}
                  </h2>
                </div>

                <div className="text-end">
                  <div className="flex items-center justify-end gap-2">
                    {/* Republish Button if Archived */}
                    {isArchivedStatus(activeTicket.status) && (
                      <button
                        type="button"
                        onClick={() => handleRepublishTicket(activeTicket.id)}
                        disabled={republishing}
                        className="tactile-button px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        title={locale === "ar" ? "إعادة نشر وتفعيل البلاغ في قائمة المتابعة" : "Republish Ticket to Active Queue"}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${republishing ? "animate-spin" : ""}`} />
                        <span>{locale === "ar" ? "إعادة نشر البلاغ" : "Republish"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPrintTicket(activeTicket)}
                      className="tactile-button px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      title={locale === "ar" ? "طباعة أمر الشغل أو حفظ PDF" : "Print Work Order Slip (PDF)"}
                    >
                      <Printer className="w-3.5 h-3.5 text-sky-400" />
                      <span>{locale === "ar" ? "طباعة أمر الشغل (PDF)" : "Work Order Slip"}</span>
                    </button>
                    <div className="tactile-pill text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30">
                      {locale === "ar"
                        ? STATE_METADATA[activeTicket.status as TicketStatus]?.label_ar
                        : STATE_METADATA[activeTicket.status as TicketStatus]?.label_en}
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)] mt-1">
                    {new Date(activeTicket.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Resident & Location Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--muted)] text-xs">
                <div>
                  <span className="text-[var(--muted-foreground)] block">{locale === "ar" ? "الوحدة والعمارة:" : "Unit / Building:"}</span>
                  <span className="font-bold">{activeTicket.unit_number} ({activeTicket.building_name || "Gardenia"})</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">{locale === "ar" ? "الساكن للتواصل:" : "Resident:"}</span>
                  <span className="font-bold">{activeTicket.resident_name}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">{locale === "ar" ? "رقم الموبايل:" : "Phone:"}</span>
                  <span className="font-bold dir-ltr font-mono">{activeTicket.resident_phone}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "وصف وملاحظات العطل:" : "Fault Description:"}
                </span>
                <p className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] leading-relaxed">
                  {activeTicket.description || (locale === "ar" ? "لا يوجد وصف إضافي مكتوب." : "No description provided.")}
                </p>
              </div>

              {/* Attached Photos */}
              {activeTicket.photos && activeTicket.photos.length > 0 && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-[var(--muted-foreground)]">
                    {locale === "ar" ? "الصور المرفقة:" : "Attached Photos:"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeTicket.photos.map((p: string, idx: number) => (
                      <div key={idx} className="w-24 h-24 rounded-lg overflow-hidden border border-[var(--border)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt="Attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* State Machine Transition Actions or Republish Card */}
              <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--muted-foreground)] block">
                  {locale === "ar" ? "إجراءات المتابعة وتحديث حالة البلاغ:" : "Available Lifecycle Transitions:"}
                </span>

                {isArchivedStatus(activeTicket.status) ? (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <Archive className="w-4 h-4 text-emerald-600" />
                        <span>
                          {activeTicket.status === "REJECTED"
                            ? (locale === "ar" ? "تم رفض / إلغاء هذا البلاغ" : "This ticket was rejected/cancelled")
                            : (locale === "ar" ? "هذا البلاغ منتهي ومؤرشف (تم الإنجاز)" : "This ticket is completed & archived")}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-1 leading-relaxed">
                        {locale === "ar"
                          ? "هل ظهرت المشكلة مجدداً أو يلزم فتح أمر شغل جديد لنفس العطل؟ اضغط أدناه لإعادة نشره في قائمة المتابعة الجارية فوراً."
                          : "Re-open and republish this fault to the active triage queue with a single click."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRepublishTicket(activeTicket.id)}
                      disabled={republishing}
                      className="tactile-button px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RotateCcw className={`w-4 h-4 ${republishing ? "animate-spin" : ""}`} />
                      <span>
                        {republishing
                          ? (locale === "ar" ? "جاري إعادة النشر..." : "Republishing...")
                          : (locale === "ar" ? "إعادة نشر البلاغ الآن" : "Republish to Active")}
                      </span>
                    </button>
                  </div>
                ) : allowedTransitions.length === 0 ? (
                  <div className="text-xs text-[var(--muted-foreground)] italic">
                    {locale === "ar" ? "تم إغلاق البلاغ نهائياً (حالة غير قابلة للتعديل)" : "Ticket is in terminal state CLOSED"}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allowedTransitions.map((nextStatus) => {
                      const meta = STATE_METADATA[nextStatus];
                      const isReject = nextStatus === "REJECTED";
                      const isAdvance = nextStatus === "CONTRACTOR_CONTACTED" || nextStatus === "IN_PROGRESS" || nextStatus === "RESOLVED";

                      return (
                        <button
                          key={nextStatus}
                          onClick={() => setActionModal({ targetStatus: nextStatus, ticketId: activeTicket.id })}
                          className={`tactile-button px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                            isReject
                              ? "bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/30"
                              : isAdvance
                              ? "bg-sky-600 hover:bg-sky-700 text-white"
                              : "bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)]"
                          }`}
                        >
                          {locale === "ar" ? `نقل إلى: ${meta.label_ar}` : `Move to: ${meta.label_en}`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="tactile-card p-12 text-center text-xs text-[var(--muted-foreground)]">
              {locale === "ar" ? "اختر بلاغاً من القائمة لمعاينته" : "Select a ticket from queue to inspect"}
            </div>
          )}
        </div>
      </div>
          </>
        )}

      {/* Transition Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="tactile-card p-6 max-w-md w-full bg-[var(--card)] space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {locale === "ar"
                ? `تحديث الحالة إلى: ${STATE_METADATA[actionModal.targetStatus]?.label_ar}`
                : `Transition to: ${STATE_METADATA[actionModal.targetStatus]?.label_en}`}
            </h3>

            {/* If CONTRACTOR_CONTACTED: show contractor picker */}
            {actionModal.targetStatus === "CONTRACTOR_CONTACTED" && (
              <div className="space-y-1 text-xs">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "اختر الفني / شركة الصيانة:" : "Assign Contractor:"}
                </label>
                <select
                  value={selectedContractorId}
                  onChange={(e) => setSelectedContractorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                >
                  <option value="cont_elec">Al-Nour Electrical Services (مؤسسة النور للأعمال الكهربائية)</option>
                  <option value="cont_elv">Smart Link ELV & CCTV Systems (سمارت لينك للتيار الخفيف والأنظمة الذكية)</option>
                  <option value="cont_plumb">Al-Ahram Modern Plumbing Co. (شركة الأهرام للسباكة الحديثة)</option>
                  <option value="cont_hvac">Taiba AC & Refrigeration (مركز طيبة للتكييف والتبريد)</option>
                  <option value="cont_carp">Al-Amal Joinery (ورشة الأمل للأبواب والنجارة)</option>
                  <option value="cont_alum">Crystal Aluminum Works (كريستال للألوميتال والزجاج)</option>
                </select>
              </div>
            )}

            {/* If APPOINTMENT_SCHEDULED: show date picker */}
            {actionModal.targetStatus === "APPOINTMENT_SCHEDULED" && (
              <div className="space-y-1 text-xs">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "موعد زيارة الفني:" : "Appointment Slot:"}
                </label>
                <input
                  type="datetime-local"
                  value={appointmentDate.slice(0, 16)}
                  onChange={(e) => setAppointmentDate(new Date(e.target.value).toISOString())}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>
            )}

            {/* If REJECTED: show reason */}
            {actionModal.targetStatus === "REJECTED" && (
              <div className="space-y-1 text-xs">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "سبب الرفض / الإلغاء:" : "Rejection Reason:"}
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-[var(--muted-foreground)]">
                {locale === "ar" ? "ملاحظات المتابعة (سجل التدقيق):" : "Dispatcher Notes:"}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={locale === "ar" ? "اكتب تفاصيل المكالمة أو ما تم الاتفاق عليه..." : "Record notes or agreement details..."}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setActionModal(null)}
                className="tactile-button px-4 py-2 text-xs border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] font-semibold"
              >
                {t("action_cancel")}
              </button>
              <button
                onClick={handleExecuteTransition}
                disabled={actionLoading}
                className="tactile-button px-5 py-2 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md"
              >
                {actionLoading ? t("action_submitting") : t("action_next")}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Printable Work Order Slip Modal */}
      {printTicket && (
        <WorkOrderSlip
          ticket={printTicket}
          onClose={() => setPrintTicket(null)}
        />
      )}
    </>
  );
}
