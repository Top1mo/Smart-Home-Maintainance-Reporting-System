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
  Wrench,
  X,
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
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const [partsNeeded, setPartsNeeded] = useState<boolean>(false);
  const [partsDescription, setPartsDescription] = useState<string>("");
  const [savingParts, setSavingParts] = useState<boolean>(false);
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

  const getTomorrowSlot = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  };

  const [selectedContractorId, setSelectedContractorId] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>(getTomorrowSlot());
  const [actionNotes, setActionNotes] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
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
        setIsMobileDetailOpen(true);
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

  useEffect(() => {
    if (activeTicket) {
      setPartsNeeded(Boolean(activeTicket.parts_needed));
      setPartsDescription(activeTicket.parts_description || "");
    }
  }, [activeTicket?.id, activeTicket?.parts_needed, activeTicket?.parts_description]);

  const handleSavePartsNeeded = async () => {
    if (!activeTicket) return;
    setSavingParts(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parts_needed: partsNeeded,
          parts_description: partsDescription.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to update parts status");
      const data = await res.json();
      setTickets((prev) =>
        prev.map((t) => (t.id === activeTicket.id ? { ...t, ...data.ticket } : t))
      );
      alert(locale === "ar" ? "تم حفظ تحديث قطع الغيار بنجاح" : "Parts status updated successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update parts");
    } finally {
      setSavingParts(false);
    }
  };

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
        payload.rejection_reason = rejectionReason.trim() || (locale === "ar" ? "بلاغ مكرر أو ملغي" : "Duplicate or cancelled report");
        payload.rejection_reason_code = "DUPLICATE";
        payload.rejection_notes = actionNotes;
      }

      if (actionModal.targetStatus === "RESOLVED") {
        payload.resolution_notes = actionNotes || (locale === "ar" ? "تم إنهاء أعمال الصيانة والإصلاح بنجاح." : "Maintenance repair completed successfully.");
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

  const renderTicketDetailContent = (ticket: any, isMobileModal: boolean = false) => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Detail Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-extrabold text-sky-600 dark:text-sky-400">
                {ticket.reference_no || ticket.id}
              </span>
              {ticket.is_hazard && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{locale === "ar" ? "خطر وسلامة عاجل" : "CRITICAL HAZARD"}</span>
                </span>
              )}
              {ticket.parts_needed ? (
                <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{locale === "ar" ? "مطلوب قطع غيار" : "Parts Needed"}</span>
                </span>
              ) : null}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)] mt-1">
              {ticket.symptom_ar && locale === "ar"
                ? ticket.symptom_ar
                : ticket.symptom_en || ticket.symptom_id}
            </h2>
          </div>

          <div className="text-end">
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {/* Republish Button if Archived */}
              {isArchivedStatus(ticket.status) && (
                <button
                  type="button"
                  onClick={() => handleRepublishTicket(ticket.id)}
                  disabled={republishing}
                  className="tactile-button px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  title={locale === "ar" ? "إعادة نشر وتفعيل البلاغ في قائمة المتابعة" : "Republish Ticket to Active Queue"}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${republishing ? "animate-spin" : ""}`} />
                  <span>{locale === "ar" ? "إعادة نشر البلاغ" : "Republish"}</span>
                </button>
              )}
              {/* Print Work Order Slip Button */}
              <button
                type="button"
                onClick={() => setPrintTicket(ticket)}
                className="tactile-button px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title={locale === "ar" ? "طباعة أمر الشغل أو حفظ PDF" : "Print Work Order Slip (PDF)"}
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>{locale === "ar" ? "طباعة أمر الشغل (PDF)" : "Work Order Slip"}</span>
              </button>
              <div className="tactile-pill text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30">
                {locale === "ar"
                  ? STATE_METADATA[ticket.status as TicketStatus]?.label_ar
                  : STATE_METADATA[ticket.status as TicketStatus]?.label_en}
              </div>
            </div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-1">
              {new Date(ticket.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Resident & Location Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--muted)] text-xs">
          <div>
            <span className="text-[var(--muted-foreground)] block">{locale === "ar" ? "الوحدة والعمارة:" : "Unit / Building:"}</span>
            <span className="font-bold">{ticket.unit_number} ({ticket.building_name || (locale === "ar" ? "المبنى الرئيسي" : "Main Building")})</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)] block">{locale === "ar" ? "الساكن للتواصل:" : "Resident:"}</span>
            <span className="font-bold">{ticket.resident_name}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)] block">{locale === "ar" ? "رقم الموبايل:" : "Phone:"}</span>
            <span className="font-bold dir-ltr font-mono">{ticket.resident_phone}</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1 text-xs">
          <span className="font-bold text-[var(--muted-foreground)]">
            {locale === "ar" ? "وصف وملاحظات العطل:" : "Fault Description:"}
          </span>
          <p className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] leading-relaxed">
            {ticket.description || (locale === "ar" ? "لا يوجد وصف إضافي مكتوب." : "No description provided.")}
          </p>
        </div>

        {/* Attached Photos */}
        {ticket.photos && ticket.photos.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-[var(--muted-foreground)]">
              {locale === "ar" ? "الصور المرفقة:" : "Attached Photos:"}
            </span>
            <div className="flex flex-wrap gap-2">
              {ticket.photos.map((p: string, idx: number) => (
                <div key={idx} className="w-24 h-24 rounded-lg overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="Attachment" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parts Needed Section (Addition 2) */}
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 dark:text-amber-300 select-none">
              <input
                type="checkbox"
                checked={partsNeeded}
                onChange={(e) => setPartsNeeded(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>{locale === "ar" ? "يحتاج شراء قطع غيار / مستلزمات" : "Parts / Materials Needed"}</span>
            </label>
            {ticket.parts_needed ? (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded-md">
                {locale === "ar" ? "مسجل حالياً: مطلوب" : "Currently: Required"}
              </span>
            ) : null}
          </div>

          {partsNeeded && (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={partsDescription}
                onChange={(e) => setPartsDescription(e.target.value)}
                placeholder={locale === "ar" ? "حدد قطع الغيار أو الأدوات المطلوبة للشراء..." : "Specify required spare parts or materials..."}
                className="w-full px-3 py-2 rounded-lg border border-amber-500/30 bg-[var(--card)] text-[var(--foreground)] text-xs placeholder:text-[var(--muted-foreground)] focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePartsNeeded}
                  disabled={savingParts}
                  className="tactile-button px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{savingParts ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ تحديث قطع الغيار" : "Save Parts Status")}</span>
                </button>
              </div>
            </div>
          )}

          {!partsNeeded && ticket.parts_needed && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSavePartsNeeded}
                disabled={savingParts}
                className="tactile-button px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <span>{savingParts ? (locale === "ar" ? "جاري التحديث..." : "Updating...") : (locale === "ar" ? "إلغاء طلب قطع الغيار" : "Clear Parts Needed")}</span>
              </button>
            </div>
          )}
        </div>

        {/* State Machine Transition Actions or Republish Card */}
        <div className="space-y-3 pt-4 border-t border-[var(--border)]">
          <span className="text-xs font-bold text-[var(--muted-foreground)] block">
            {locale === "ar" ? "إجراءات المتابعة وتحديث حالة البلاغ:" : "Available Lifecycle Transitions:"}
          </span>

          {isArchivedStatus(ticket.status) ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-emerald-600" />
                  <span>
                    {ticket.status === "REJECTED"
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
                onClick={() => handleRepublishTicket(ticket.id)}
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
                    onClick={() => setActionModal({ targetStatus: nextStatus, ticketId: ticket.id })}
                    className={`tactile-button px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer ${
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

        {/* Close Button for Mobile Modal */}
        {isMobileModal && (
          <div className="pt-3 border-t border-[var(--border)] flex justify-end">
            <button
              type="button"
              onClick={() => setIsMobileDetailOpen(false)}
              className="tactile-button px-4 py-2 bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-lg text-xs font-bold cursor-pointer"
            >
              {locale === "ar" ? "إغلاق التفاصيل" : "Close Details"}
            </button>
          </div>
        )}
      </div>
    );
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
              </div>

              <div className="text-xs text-[var(--muted-foreground)] font-semibold">
                {locale === "ar"
                  ? `${filteredTickets.length} بلاغ في ${activeSubTab === "archive" ? "سجل الأرشيف" : "القائمة الجارية"}`
                  : `${filteredTickets.length} tickets in ${activeSubTab === "archive" ? "archive" : "queue"}`}
              </div>
            </div>

      {/* Master-Detail Layout (Desktop Side-by-Side + Mobile Modal Sheet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Master Pane: Ticket List (Col 5 on desktop, full-width on mobile) */}
        <div className="lg:col-span-5 space-y-2 max-h-[750px] overflow-y-auto pr-1">
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
                  setIsMobileDetailOpen(true);
                }}
              />
            ))
          )}
        </div>

        {/* Detail Pane: Desktop Side-by-Side (Col 7 on desktop, hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-7">
          {activeTicket ? (
            <div className="tactile-card p-4 sm:p-6 space-y-4 sm:space-y-6">
              {renderTicketDetailContent(activeTicket, false)}
            </div>
          ) : (
            <div className="tactile-card p-12 text-center text-xs text-[var(--muted-foreground)]">
              {locale === "ar" ? "اختر بلاغاً من القائمة لمعاينته" : "Select a ticket from queue to inspect"}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer / Modal Sheet (Slides up over queue when a ticket is clicked) */}
      {isMobileDetailOpen && activeTicket && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card)] w-full max-w-2xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto p-4 sm:p-6 border border-[var(--border)] space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--muted-foreground)]">
                {locale === "ar" ? "تفاصيل البلاغ المحدد" : "Ticket Details"}
              </span>
              <button
                type="button"
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer transition-colors"
                aria-label={locale === "ar" ? "إغلاق" : "Close"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderTicketDetailContent(activeTicket, true)}
          </div>
        </div>
      )}
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
