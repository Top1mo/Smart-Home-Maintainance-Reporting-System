"use client";

import React from "react";
import { Printer, X, Download, ShieldAlert } from "lucide-react";

interface Ticket {
  id: string;
  reference_no?: string;
  property_name: string;
  unit_number: string;
  building_name?: string;
  trade_en?: string;
  trade_ar?: string;
  subcategory_en?: string;
  subcategory_ar?: string;
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
  resident_name: string;
  resident_phone: string;
  assigned_contractor_id?: string;
  appointment_date?: string;
  photos?: string[];
  created_at: string;
}

export function WorkOrderSlip({
  ticket,
  onClose,
}: {
  ticket: Ticket;
  onClose: () => void;
}) {
  React.useEffect(() => {
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

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "";
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const tradeName = ticket.trade_ar || ticket.trade_en || "أعمال الصيانة";
  const symptomTitle = ticket.symptom_ar || ticket.symptom_en || "عطل غير محدد";
  const roomArea = ticket.room_location_ar || ticket.room_location_en || "داخل الوحدة السكنية";
  const desc = ticket.description || ticket.custom_description || "لا توجد ملاحظات إضافية مسجلة.";

  return (
    <div className="printable-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-black/60 p-2 sm:p-4 backdrop-blur-sm flex items-center justify-center">
      {/* Container Dialog */}
      <div className="printable-modal-container bg-white text-slate-900 w-full max-w-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Screen Toolbar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm">أمر شغل وتكليف صيانة — معاينة وطباعة (PDF)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>طباعة / تصدير PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body (A4 Paged Layout) */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-4 dir-rtl bg-white text-slate-900 font-sans print:overflow-visible printable-document">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div>
              <div className="text-xs font-bold tracking-wide text-slate-600">
                إدارة تشغيل وصيانة العقارات والوحدات السكنية
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                أمر شغل وتكليف إصلاح عطل
              </h1>
              <div className="text-xs text-slate-600 mt-0.5">
                Work Order Slip • {ticket.property_name || "المجمع السكني"}
              </div>
            </div>

            <div className="text-left dir-ltr">
              <div className="font-mono text-sm font-black px-2.5 py-0.5 border border-slate-900 bg-slate-50 text-slate-900 inline-block">
                REF: {ticket.reference_no || ticket.id}
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono">
                {new Date(ticket.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          {/* Safety Hazard Warning (if applicable) */}
          {ticket.is_hazard && (
            <div className="p-2.5 border-2 border-red-700 bg-red-50 text-red-950 text-xs flex items-start gap-2 print-avoid-break">
              <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-800 block">تنبيه سلامة ومخاطر داهمة (CRITICAL HAZARD):</span>
                <span>يرجى اتخاذ تدابير الأمان وعزل مصادر التيار أو المحابس فور وصول الفني للموقع قبل الشروع في الإصلاح.</span>
              </div>
            </div>
          )}

          {/* Unit & Ticket Data Table (Clean, Sharp Tabular Grid) */}
          <div className="print-avoid-break">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-1/6 bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">العمارة / المجمع:</td>
                  <td className="w-2/6 p-2 font-semibold text-slate-900 border-l border-slate-300">{ticket.building_name || "المبنى الرئيسي"}</td>
                  <td className="w-1/6 bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">رقم الوحدة:</td>
                  <td className="w-2/6 p-2 font-bold text-slate-900">{ticket.unit_number}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">اسم الساكن / العميل:</td>
                  <td className="p-2 font-semibold text-slate-900 border-l border-slate-300">{ticket.resident_name}</td>
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">رقم الهاتف للتواصل:</td>
                  <td className="p-2 font-mono font-bold text-slate-900 dir-ltr text-right">{ticket.resident_phone}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">التخصص المطلوب:</td>
                  <td className="p-2 font-bold text-slate-900 border-l border-slate-300">{tradeName}</td>
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">المكان داخل الوحدة:</td>
                  <td className="p-2 font-semibold text-slate-900">{roomArea}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">نوع المشكلة الأساسية:</td>
                  <td className="p-2 font-bold text-slate-900 border-l border-slate-300">{symptomTitle}</td>
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">درجة الاستعجال:</td>
                  <td className="p-2 font-bold text-slate-900">
                    {ticket.urgency === "EMERGENCY" ? "طارئ جداً (فوري)" : "عادي / مجدول"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fault Description Section */}
          <div className="border border-slate-400 print-avoid-break">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-xs text-slate-800">
              شرح وتفاصيل العطل المسجلة:
            </div>
            <div className="p-3 text-xs leading-relaxed text-slate-900 min-h-[50px] whitespace-pre-wrap">
              {desc}
            </div>
          </div>

          {/* Photo Gallery (if photos are present) */}
          {ticket.photos && ticket.photos.length > 0 && (
            <div className="border border-slate-400 p-3 space-y-2 print-avoid-break">
              <div className="text-xs font-bold text-slate-800">معاينة صور العطل المرفقة:</div>
              <div className="grid grid-cols-3 gap-2">
                {ticket.photos.map((photo, i) => (
                  <div key={i} className="h-24 border border-slate-400 overflow-hidden bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="Fault Photo" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technician Quotation & Execution Sign-off Block */}
          <div className="border-2 border-slate-900 print-avoid-break">
            <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
              <span>إقرار إتمام الأعمال والمحاسبة (خاص بالفني والمستلم)</span>
              <span className="text-[10px] font-mono font-normal">Contractor Quotation & Sign-off</span>
            </div>

            <div className="p-3 space-y-3 text-xs">
              {/* Materials & Cost Table */}
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                    <th className="p-1.5 text-center border-l border-slate-300 w-8">م</th>
                    <th className="p-1.5 text-right border-l border-slate-300">بيان قطع الغيار والخامات المستخدمة</th>
                    <th className="p-1.5 text-center border-l border-slate-300 w-16">الكمية</th>
                    <th className="p-1.5 text-left border-l border-slate-300 w-24">سعر الوحدة (ج.م)</th>
                    <th className="p-1.5 text-left w-24">الإجمالي (ج.م)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-1.5 text-center text-slate-400 border-l border-slate-300">١</td>
                    <td className="p-1.5 text-slate-400 border-l border-slate-300">...........................................................................</td>
                    <td className="p-1.5 text-center text-slate-400 border-l border-slate-300">.......</td>
                    <td className="p-1.5 text-left text-slate-400 border-l border-slate-300">...........</td>
                    <td className="p-1.5 text-left text-slate-400">...........</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center text-slate-400 border-l border-slate-300">٢</td>
                    <td className="p-1.5 text-slate-400 border-l border-slate-300">...........................................................................</td>
                    <td className="p-1.5 text-center text-slate-400 border-l border-slate-300">.......</td>
                    <td className="p-1.5 text-left text-slate-400 border-l border-slate-300">...........</td>
                    <td className="p-1.5 text-left text-slate-400">...........</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center text-slate-400 border-l border-slate-300">٣</td>
                    <td className="p-1.5 text-slate-400 border-l border-slate-300">...........................................................................</td>
                    <td className="p-1.5 text-center text-slate-400 border-l border-slate-300">.......</td>
                    <td className="p-1.5 text-left border-l border-slate-300 text-slate-400">...........</td>
                    <td className="p-1.5 text-left text-slate-400">...........</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Quotation Summary */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border border-slate-300 p-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">إجمالي قيمة المصنعية:</span>
                  <span className="font-mono text-slate-600 font-bold">..................... ج.م</span>
                </div>
                <div className="border-2 border-slate-900 bg-slate-50 p-2 flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900">المبلغ الإجمالي المستحق:</span>
                  <span className="font-mono text-slate-900 font-black">..................... ج.م</span>
                </div>
              </div>

              {/* Signature Lines */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-300 text-center text-xs">
                <div>
                  <span className="text-slate-700 block font-bold text-[11px]">اسم وتوقيع الفني / المقاول:</span>
                  <div className="mt-8 border-b border-slate-500 w-4/5 mx-auto"></div>
                </div>
                <div>
                  <span className="text-slate-700 block font-bold text-[11px]">تاريخ وساعة إنهاء العمل:</span>
                  <div className="mt-8 border-b border-slate-500 w-4/5 mx-auto"></div>
                </div>
                <div>
                  <span className="text-slate-700 block font-bold text-[11px]">توقيع المستلم / الساكن:</span>
                  <div className="mt-8 border-b border-slate-500 w-4/5 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-300">
            تم استخراج أمر الشغل تلقائياً من نظام إدارة أعطال المنازل • يرجى الاحتفاظ بنسخة معتمدة بعد إنهاء الأعمال
          </div>
        </div>
      </div>
    </div>
  );
}

