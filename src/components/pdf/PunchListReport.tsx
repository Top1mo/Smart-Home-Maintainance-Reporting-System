"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  X,
  ShieldAlert,
  Building,
  Wrench,
  CheckSquare,
  Filter,
  Clock,
  User,
  Download,
  Camera,
  ClipboardCheck,
} from "lucide-react";

export interface PunchListTicket {
  id: string;
  reference_no?: string;
  property_name?: string;
  building_name?: string;
  unit_number?: string;
  trade_id?: string;
  trade_slug?: string;
  trade_en?: string;
  trade_ar?: string;
  trade_name_en?: string;
  trade_name_ar?: string;
  subcategory_en?: string;
  subcategory_ar?: string;
  subcategory_name_en?: string;
  subcategory_name_ar?: string;
  symptom_en?: string;
  symptom_ar?: string;
  room_location_ar?: string;
  room_location_en?: string;
  description?: string;
  custom_description?: string;
  severity?: string;
  urgency?: string;
  is_hazard?: boolean;
  status: string;
  resident_name?: string;
  resident_phone?: string;
  photos?: string[];
  created_at: string;
}

interface PunchListReportProps {
  tickets?: PunchListTicket[];
  onClose?: () => void;
  isModal?: boolean;
}

export function PunchListReport({
  tickets: initialTickets,
  onClose,
  isModal = true,
}: PunchListReportProps) {
  const [tickets, setTickets] = useState<PunchListTicket[]>(initialTickets || []);
  const [, setLoading] = useState<boolean>(!initialTickets);

  // Filters
  const [filterUnit, setFilterUnit] = useState<string>("ALL");
  const [filterTrade, setFilterTrade] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "جديد (قيد الفحص)";
      case "UNDER_REVIEW":
        return "قيد المعاينة";
      case "CONTRACTOR_CONTACTED":
        return "بانتظار المقاول";
      case "APPOINTMENT_SCHEDULED":
        return "موعد محدد";
      case "IN_PROGRESS":
        return "جاري الإصلاح";
      case "RESOLVED":
        return "تم الإنجاز";
      case "CLOSED":
        return "معتمد ومكتمل";
      case "REJECTED":
        return "مستبعد / مرفوض";
      default:
        return status;
    }
  };

  useEffect(() => {
    document.body.classList.add("modal-open-for-print");
    const originalTitle = document.title;

    const handleBeforePrint = () => {
      document.title = "";
    };
    const handleAfterPrint = () => {
      document.title = originalTitle;
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      document.body.classList.remove("modal-open-for-print");
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.title = originalTitle;
    };
  }, []);

  // Fetch tickets if not provided
  useEffect(() => {
    if (!initialTickets) {
      async function fetchAll() {
        try {
          const res = await fetch("/api/tickets?limit=100");
          const data = await res.json();
          if (data.tickets) {
            setTickets(data.tickets);
          }
        } catch (err) {
          console.error("Failed to fetch tickets for punch list:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchAll();
    } else {
      setTickets(initialTickets);
      setLoading(false);
    }
  }, [initialTickets]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "";
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Distinct Units and Trades for Filter dropdowns
  const availableUnits = useMemo(() => {
    const units = new Set<string>();
    tickets.forEach((t) => {
      const u = (t.unit_number || "").trim();
      if (u) units.add(u);
    });
    return Array.from(units).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [tickets]);

  const availableTrades = useMemo(() => {
    const map = new Map<string, string>();
    tickets.forEach((t) => {
      const name = t.trade_name_ar || t.trade_ar || t.trade_name_en || t.trade_en || "أخرى";
      const key = t.trade_slug || t.trade_id || name;
      map.set(key, name);
    });
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const tUnit = (t.unit_number || "").trim();
      if (filterUnit !== "ALL" && tUnit !== filterUnit.trim()) return false;
      if (filterTrade !== "ALL") {
        const tradeKey = t.trade_slug || t.trade_id || t.trade_name_ar || t.trade_ar || t.trade_name_en;
        if (tradeKey !== filterTrade) return false;
      }
      // If user specifically requests REJECTED audit
      if (filterStatus === "REJECTED") {
        return t.status === "REJECTED";
      }
      // For all normal modes, rejected reports are excluded from the punch list
      if (t.status === "REJECTED") {
        return false;
      }
      if (filterStatus === "ACTIVE" && (t.status === "RESOLVED" || t.status === "CLOSED")) {
        return false;
      }
      if (filterStatus === "RESOLVED" && t.status !== "RESOLVED" && t.status !== "CLOSED") {
        return false;
      }
      if (filterStatus === "HAZARD" && !t.is_hazard) {
        return false;
      }
      return true;
    });
  }, [tickets, filterUnit, filterTrade, filterStatus]);

  // Primary Grouping: Unit -> Secondary Grouping: Trade -> Chronological
  const groupedData = useMemo(() => {
    const unitMap = new Map<
      string,
      {
        unitNumber: string;
        buildingName: string;
        residentName: string;
        residentPhone: string;
        trades: Map<string, PunchListTicket[]>;
      }
    >();

    filteredTickets.forEach((ticket) => {
      const unitKey = ticket.unit_number ? `وحدة ${ticket.unit_number}` : "الأجزاء والمرافق المشتركة";
      if (!unitMap.has(unitKey)) {
        unitMap.set(unitKey, {
          unitNumber: ticket.unit_number || "عام",
          buildingName: ticket.building_name || "المبنى الرئيسي",
          residentName: ticket.resident_name || "غير محدد",
          residentPhone: ticket.resident_phone || "",
          trades: new Map<string, PunchListTicket[]>(),
        });
      }

      const unitObj = unitMap.get(unitKey)!;
      const tradeKey = ticket.trade_name_ar || ticket.trade_ar || ticket.trade_name_en || ticket.trade_en || "أعمال صيانة عامة";

      if (!unitObj.trades.has(tradeKey)) {
        unitObj.trades.set(tradeKey, []);
      }
      unitObj.trades.get(tradeKey)!.push(ticket);
    });

    unitMap.forEach((unitObj) => {
      unitObj.trades.forEach((tradeTickets) => {
        tradeTickets.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
    });

    return Array.from(unitMap.entries()).map(([unitTitle, data]) => ({
      unitTitle,
      ...data,
      tradeGroups: Array.from(data.trades.entries()).map(([tradeTitle, items]) => ({
        tradeTitle,
        items,
      })),
    }));
  }, [filteredTickets]);

  // Summary Metrics
  const totalCount = filteredTickets.length;
  const activeCount = filteredTickets.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED" && t.status !== "REJECTED"
  ).length;
  const hazardCount = filteredTickets.filter((t) => t.is_hazard).length;
  const unitsCount = groupedData.length;

  let globalItemIndex = 0;

  const content = (
    <div className="bg-white text-slate-900 w-full max-w-6xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] printable-modal-container">
      {/* Screen Toolbar (Hidden when printing) */}
      <div className="no-print bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-sky-400" />
          <div>
            <div className="font-bold text-sm">قائمة مهام الصيانة المجمعة (Master Punch List)</div>
            <div className="text-[11px] text-slate-400">معاينة وتجهيز للطباعة أو التصدير بصيغة PDF</div>
          </div>
        </div>

        {/* Filter Bar inside Toolbar */}
        <div className="flex items-center overflow-x-auto no-scrollbar py-2 gap-2 text-xs w-full sm:w-auto">
          {/* Unit Filter */}
          <div className="flex items-center gap-1 bg-slate-800 px-3 py-2 rounded border border-slate-700 min-h-[44px] shrink-0">
            <Building className="w-4 h-4 text-slate-400" />
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="bg-transparent text-white text-xs border-none outline-none cursor-pointer min-h-[36px]"
            >
              <option value="ALL" className="bg-slate-900">جميع الوحدات ({availableUnits.length})</option>
              {availableUnits.map((u) => (
                <option key={u} value={u} className="bg-slate-900">
                  وحدة {u}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Filter */}
          <div className="flex items-center gap-1 bg-slate-800 px-3 py-2 rounded border border-slate-700 min-h-[44px] shrink-0">
            <Wrench className="w-4 h-4 text-slate-400" />
            <select
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              className="bg-transparent text-white text-xs border-none outline-none cursor-pointer min-h-[36px]"
            >
              <option value="ALL" className="bg-slate-900">جميع التخصصات</option>
              {availableTrades.map((tr) => (
                <option key={tr.key} value={tr.key} className="bg-slate-900">
                  {tr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-800 px-3 py-2 rounded border border-slate-700 min-h-[44px] shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-white text-xs border-none outline-none cursor-pointer min-h-[36px]"
            >
              <option value="ALL" className="bg-slate-900">كل المهام المعتمدة</option>
              <option value="ACTIVE" className="bg-slate-900">المهام الجارية فقط</option>
              <option value="HAZARD" className="bg-slate-900">تنبيهات الأمان فقط</option>
              <option value="RESOLVED" className="bg-slate-900">المنتهي والمكتمل</option>
              <option value="REJECTED" className="bg-slate-900">البلاغات المستبعدة / المرفوضة</option>
            </select>
          </div>

          {/* Photo Thumbnails Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none bg-slate-800 px-3 py-2 rounded border border-slate-700 hover:bg-slate-700/60 transition-colors min-h-[44px] shrink-0">
            <input
              type="checkbox"
              checked={showThumbnails}
              onChange={(e) => setShowThumbnails(e.target.checked)}
              className="rounded border-slate-600 accent-sky-500 cursor-pointer w-4 h-4"
            />
            <Camera className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-semibold whitespace-nowrap">عرض الصور</span>
          </label>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer min-h-[44px] shrink-0 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / تصدير PDF</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Document Body (A4 Multi-Page Paged Layout) */}
      <div className="overflow-y-auto p-6 sm:p-8 space-y-4 dir-rtl bg-white text-slate-900 font-sans print:overflow-visible printable-document">
        {/* Document Master Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-wide text-slate-600">
              إدارة صيانة وتشغيل العقارات والوحدات السكنية
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              قائمة أعمال ومهام صيانة الوحدات (Punch List)
            </h1>
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
              <span>Master Maintenance & Inspection Punch List</span>
              <span>•</span>
              <span className="font-semibold">
                {filterUnit === "ALL" ? "جميع الوحدات المسجلة" : `تقرير مخصص: وحدة ${filterUnit}`}
              </span>
            </div>
          </div>

          <div className="text-left dir-ltr">
            <div className="font-mono text-xs font-bold px-2.5 py-0.5 border border-slate-900 bg-slate-50 text-slate-900 inline-block">
              DATE: {new Date().toISOString().split("T")[0]}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 font-sans text-right dir-rtl">
              {new Date().toLocaleDateString("ar-EG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Strip (Clean Tabular Text Strip, Not Bubbly Cards) */}
        <div className="border border-slate-400 bg-slate-50 p-2.5 text-xs text-slate-900 flex flex-wrap items-center justify-between gap-3 print-avoid-break">
          <div>
            <span className="font-bold text-slate-600">إجمالي المهام: </span>
            <span className="font-black font-mono">{totalCount} بند</span>
          </div>
          <div className="border-r border-slate-300 pr-3">
            <span className="font-bold text-slate-600">عدد الوحدات: </span>
            <span className="font-black font-mono">{unitsCount} وحدة</span>
          </div>
          <div className="border-r border-slate-300 pr-3">
            <span className="font-bold text-slate-600">قيد التنفيذ / جاري: </span>
            <span className="font-black font-mono">{activeCount} مهمة</span>
          </div>
          <div className="border-r border-slate-300 pr-3">
            <span className="font-bold text-red-700">مخاطر وسلامة: </span>
            <span className="font-black text-red-800 font-mono">{hazardCount} عطل حرج</span>
          </div>
        </div>

        {/* Empty State */}
        {groupedData.length === 0 && (
          <div className="p-10 sm:p-14 text-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 my-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-600 border border-slate-200 shadow-xs">
              <ClipboardCheck className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 mb-1">
                لا توجد مهام صيانة مدرجة في قائمة الفحص
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                لا توجد مهام أو أعطال مسجلة تطابق محددات التصفية الحالية، أو تم إنجاز كافة المهام واعتمادها.
              </p>
            </div>
          </div>
        )}

        {/* The Master Punch List Table (Proper HTML Table for Multi-Page Flow) */}
        {groupedData.length > 0 && (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px]">
                  <th className="p-1.5 text-center border border-slate-700 w-10">فحص [ ]</th>
                  <th className="p-1.5 text-center border border-slate-700 w-8">م</th>
                  <th className="p-1.5 text-center border border-slate-700 w-24">رقم البلاغ</th>
                  <th className="p-1.5 text-right border border-slate-700 w-28">التخصص</th>
                  <th className="p-1.5 text-right border border-slate-700 w-24">المكان</th>
                  <th className="p-1.5 text-right border border-slate-700">بيان العطل وتفاصيل الإصلاح</th>
                  <th className="p-1.5 text-center border border-slate-700 w-16">الأولوية</th>
                  <th className="p-1.5 text-center border border-slate-700 w-20">الحالة</th>
                  <th className="p-1.5 text-center border border-slate-700 w-28">توقيع وتاريخ الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((unitGroup) => (
                  <React.Fragment key={unitGroup.unitTitle}>
                    {/* Unit Group Header Row Spanning All Columns */}
                    <tr className="bg-slate-200 text-slate-900 font-bold border-t-2 border-b border-slate-400 print-avoid-break">
                      <td colSpan={9} className="p-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{unitGroup.unitTitle}</span>
                            <span className="text-slate-600 font-normal">({unitGroup.buildingName})</span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-normal text-slate-700">
                            {unitGroup.residentName && unitGroup.residentName !== "غير محدد" && (
                              <span>الساكن: <strong className="font-bold text-slate-900">{unitGroup.residentName}</strong></span>
                            )}
                            {unitGroup.residentPhone && (
                              <span className="font-mono dir-ltr">هاتف: {unitGroup.residentPhone}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Trade Groups & Tasks inside this Unit */}
                    {unitGroup.tradeGroups.map((tradeGroup) => (
                      <React.Fragment key={tradeGroup.tradeTitle}>
                        {/* Trade Sub-header Row */}
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 print-avoid-break">
                          <td colSpan={9} className="p-1.5 text-[11px] pe-4">
                            <span className="text-sky-800">تخصص: {tradeGroup.tradeTitle}</span>
                            <span className="text-slate-500 font-normal ms-2">({tradeGroup.items.length} بنود)</span>
                          </td>
                        </tr>

                        {/* Individual Task Rows */}
                        {tradeGroup.items.map((task) => {
                          globalItemIndex += 1;
                          const symptom = task.symptom_ar || task.symptom_en || "عطل غير محدد";
                          const room = task.room_location_ar || task.room_location_en || "داخل الوحدة";
                          const notes = task.description || task.custom_description || "";
                          const isResolved = task.status === "RESOLVED" || task.status === "CLOSED";

                          return (
                            <tr
                              key={task.id}
                              className={`border-b border-slate-300 text-xs print-avoid-break ${
                                task.is_hazard
                                  ? "bg-red-50/60"
                                  : isResolved
                                  ? "bg-emerald-50/40"
                                  : "bg-white"
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="p-1.5 text-center border-l border-slate-300">
                                <div className="w-4 h-4 mx-auto border border-slate-500 flex items-center justify-center font-bold text-xs bg-white text-slate-900">
                                  {isResolved ? "✓" : ""}
                                </div>
                              </td>

                              {/* Index */}
                              <td className="p-1.5 text-center font-mono text-slate-500 border-l border-slate-300">
                                {globalItemIndex}
                              </td>

                              {/* Reference No */}
                              <td className="p-1.5 text-center font-mono font-bold text-slate-800 border-l border-slate-300 whitespace-nowrap">
                                {task.reference_no || task.id}
                              </td>

                              {/* Trade */}
                              <td className="p-1.5 font-semibold text-slate-900 border-l border-slate-300 whitespace-nowrap">
                                {tradeGroup.tradeTitle}
                              </td>

                              {/* Room Location */}
                              <td className="p-1.5 text-slate-700 border-l border-slate-300 whitespace-nowrap">
                                {room}
                              </td>

                              {/* Description & Scope */}
                              <td className="p-1.5 text-slate-900 border-l border-slate-300">
                                <div className="font-bold">{symptom}</div>
                                {notes && (
                                  <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                    {notes}
                                  </div>
                                )}
                                {task.is_hazard && (
                                  <div className="text-[10px] text-red-700 font-bold mt-0.5">
                                    ⚠ تنبيه أمان: يتطلب فصل المصدر قبل البدء
                                  </div>
                                )}
                                {showThumbnails && task.photos && task.photos.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5 print-avoid-break">
                                    {task.photos.map((photo, pIdx) => (
                                      <div key={pIdx} className="w-8 h-8 rounded border border-slate-400 overflow-hidden bg-slate-100 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photo} alt="Fault" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* Urgency */}
                              <td className="p-1.5 text-center border-l border-slate-300 whitespace-nowrap">
                                {task.urgency === "EMERGENCY" ? (
                                  <span className="font-bold text-red-700">طارئ</span>
                                ) : (
                                  <span className="text-slate-600">عادي</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="p-1.5 text-center border-l border-slate-300 whitespace-nowrap">
                                <span
                                  className={`text-[11px] ${
                                    isResolved
                                      ? "text-emerald-800 font-bold"
                                      : task.status === "REJECTED"
                                      ? "text-red-700 font-bold"
                                      : "text-slate-800 font-semibold"
                                  }`}
                                >
                                  {getStatusLabel(task.status)}
                                </span>
                              </td>

                              {/* Sign-off Field */}
                              <td className="p-1.5 text-center text-slate-400 font-mono text-[10px] whitespace-nowrap">
                                ......... / .....-.....
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inspection & Sign-off Section (Clean Engineering Block) */}
        <div className="border-2 border-slate-900 print-avoid-break mt-4">
          <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
            <span>محضر الفحص والمعاينة الميدانية (خاص بالمهندس المشرف والمقاول)</span>
            <span className="text-[10px] font-mono font-normal">Field Inspection & Sign-off</span>
          </div>

          <div className="p-3 space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-800 block mb-1 text-[11px]">
                ملاحظات وتوصيات الفحص الميداني:
              </span>
              <div className="p-2.5 border border-slate-300 text-slate-400 space-y-2">
                <div>........................................................................................................................................................................................</div>
                <div>........................................................................................................................................................................................</div>
              </div>
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-300 text-center">
              <div>
                <span className="text-slate-700 block font-bold text-[11px]">اسم وتوقيع المالك / المشرف:</span>
                <div className="mt-8 border-b border-slate-500 w-4/5 mx-auto"></div>
              </div>
              <div>
                <span className="text-slate-700 block font-bold text-[11px]">اسم وتوقيع مقاول الصيانة:</span>
                <div className="mt-8 border-b border-slate-500 w-4/5 mx-auto"></div>
              </div>
              <div>
                <span className="text-slate-700 block font-bold text-[11px]">تاريخ الاعتماد والاستلام:</span>
                <div className="mt-8 border-b border-slate-500 w-4/5 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-300">
          تم استخراج قائمة مهام الصيانة المجمعة تلقائياً عبر نظام إدارة أعطال المنازل • صالحة للاستخدام الميداني وأرشفة العقود
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="w-full">
        {content}
      </div>
    );
  }

  return (
    <div className="printable-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-black/60 p-2 sm:p-4 backdrop-blur-sm flex items-center justify-center">
      {content}
    </div>
  );
}

