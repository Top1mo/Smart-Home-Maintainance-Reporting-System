"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/components/ui/Toast";
import {
  Wrench,
  Zap,
  Wind,
  Hammer,
  Square,
  Layers,
  PaintBucket,
  Waves,
  Grid,
  Tv,
  Home as HomeIcon,
  AlertTriangle,
  Upload,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  PlusCircle,
  HelpCircle,
  Printer,
} from "lucide-react";
import { WorkOrderSlip } from "@/components/pdf/WorkOrderSlip";

export const DRAFT_STORAGE_KEY = "home_faults_wizard_draft_v1";

export function calculateDownscaledDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension: number = 1200
): { width: number; height: number; scaled: boolean } {
  if (srcWidth <= maxDimension && srcHeight <= maxDimension) {
    return { width: srcWidth, height: srcHeight, scaled: false };
  }
  const ratio = srcWidth / srcHeight;
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (srcWidth > srcHeight) {
    targetWidth = maxDimension;
    targetHeight = Math.round(maxDimension / ratio);
  } else {
    targetHeight = maxDimension;
    targetWidth = Math.round(maxDimension * ratio);
  }

  return { width: targetWidth, height: targetHeight, scaled: true };
}

interface Trade {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  subcategories: Array<{
    id: string;
    trade_id: string;
    slug: string;
    name_en: string;
    name_ar: string;
    is_elv?: boolean;
    symptoms: Array<{
      id: string;
      symptom_en: string;
      symptom_ar: string;
      default_severity: string;
      is_hazard: boolean;
      hazard_instruction_en?: string;
      hazard_instruction_ar?: string;
    }>;
  }>;
}

const TRADE_ICONS: Record<string, any> = {
  wrench: Wrench,
  zap: Zap,
  fan: Wind,
  hammer: Hammer,
  square: Square,
  layers: Layers,
  "paint-bucket": PaintBucket,
  waves: Waves,
  grid: Grid,
  tv: Tv,
  home: HomeIcon,
  "help-circle": HelpCircle,
  "plus-circle": PlusCircle,
};

import { FALLBACK_TRADES } from "@/lib/constants/trades-data";

export function ResidentWizard({
  onTicketCreated,
  isLandlordMode = false,
}: {
  onTicketCreated?: (ticketId: string) => void;
  isLandlordMode?: boolean;
}) {
  const { locale, direction, t } = useI18n();
  const toast = useToast();

  // Stepper State (1: Trade, 2: Subcategory & Symptom, 3: Unit & Photo, 4: Success)
  const [step, setStep] = useState<number>(1);
  const [trades, setTrades] = useState<Trade[]>(FALLBACK_TRADES);
  const [units, setUnits] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState<boolean>(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState<boolean>(false);

  // Form selections
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isOtherTrade, setIsOtherTrade] = useState<boolean>(false);
  const [customTradeText, setCustomTradeText] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<any | null>(null);
  const [isOtherSubcategory, setIsOtherSubcategory] = useState<boolean>(false);
  const [customSubcategoryText, setCustomSubcategoryText] = useState<string>("");
  const [selectedSymptom, setSelectedSymptom] = useState<any | null>(null);
  const [isOtherSymptom, setIsOtherSymptom] = useState<boolean>(false);
  const [customSymptomText, setCustomSymptomText] = useState<string>("");
  const [faultDetailText, setFaultDetailText] = useState<string>("");

  // Location & Resident Info
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [unitNumber, setUnitNumber] = useState<string>("");
  const [buildingName, setBuildingName] = useState<string>("");
  const [residentName, setResidentName] = useState<string>("");
  const [residentPhone, setResidentPhone] = useState<string>("");
  const [roomLocation, setRoomLocation] = useState<string>("");
  const [isOtherRoom, setIsOtherRoom] = useState<boolean>(false);
  const [customRoomText, setCustomRoomText] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<string>("NORMAL");

  // Hazard intercept state
  const [activeHazard, setActiveHazard] = useState<{
    instruction_en: string;
    instruction_ar: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);
  const [showWorkOrderSlip, setShowWorkOrderSlip] = useState<boolean>(false);

  // Restore draft from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawJson = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed && typeof parsed === "object" && typeof parsed.timestamp === "number") {
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp <= sevenDaysMs) {
            if (parsed.unitId) setSelectedUnitId(parsed.unitId);
            if (parsed.unitNumber) setUnitNumber(parsed.unitNumber);
            if (parsed.buildingName) setBuildingName(parsed.buildingName);
            if (parsed.residentName) setResidentName(parsed.residentName);
            if (parsed.residentPhone) setResidentPhone(parsed.residentPhone);
            if (parsed.location) {
              setRoomLocation(parsed.location);
              if (parsed.isOtherRoom) {
                setIsOtherRoom(true);
                setCustomRoomText(parsed.customRoomText || parsed.location);
              }
            }
            if (parsed.description) setDescription(parsed.description);
            if (parsed.urgency) setUrgency(parsed.urgency);
            if (Array.isArray(parsed.photos)) setPhotos(parsed.photos);
            if (parsed.customTradeText) setCustomTradeText(parsed.customTradeText);
            if (parsed.isOtherTrade) setIsOtherTrade(true);
            if (parsed.customSubcategoryText) setCustomSubcategoryText(parsed.customSubcategoryText);
            if (parsed.isOtherSubcategory) setIsOtherSubcategory(true);
            if (parsed.customSymptomText) setCustomSymptomText(parsed.customSymptomText);
            if (parsed.faultDetailText) setFaultDetailText(parsed.faultDetailText);
            if (parsed.isOtherSymptom) {
              setIsOtherSymptom(true);
              setSelectedSymptom({
                id: "sym_other_custom",
                symptom_en: parsed.customSymptomText || "Other Custom Fault",
                symptom_ar: parsed.customSymptomText || "عطل آخر غير مدرج",
                default_severity: "MEDIUM",
                is_hazard: false,
              });
            }

            // Restore trade / subcategory / symptom if tradeId present
            if (parsed.tradeId) {
              const tradeList = trades.length > 0 ? trades : FALLBACK_TRADES;
              const trade = tradeList.find((t) => t.id === parsed.tradeId);
              if (trade) {
                setSelectedTrade(trade);
                if (trade.id === "trade_other" || parsed.isOtherTrade) {
                  setIsOtherTrade(true);
                }
                if (parsed.subcategoryId) {
                  if (parsed.isOtherSubcategory || parsed.subcategoryId === "sub_other_custom") {
                    setIsOtherSubcategory(true);
                    setSelectedSubcategory({
                      id: "sub_other_custom",
                      trade_id: trade.id,
                      slug: "OTHER_CUSTOM",
                      name_en: parsed.customSubcategoryText || "Other Type",
                      name_ar: parsed.customSubcategoryText || "نوع آخر غير مدرج",
                      is_elv: false,
                      symptoms: [],
                    });
                  } else {
                    const sub = trade.subcategories?.find((s) => s.id === parsed.subcategoryId);
                    if (sub) {
                      setSelectedSubcategory(sub);
                      if (parsed.symptomId && !parsed.isOtherSymptom) {
                        const sym = sub.symptoms?.find((sm) => sm.id === parsed.symptomId);
                        if (sym) setSelectedSymptom(sym);
                      }
                    }
                  }
                }
              }
            }

            if (parsed.step && parsed.step >= 1 && parsed.step <= 3) {
              setStep(parsed.step);
            }
          } else {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to restore wizard draft:", e);
    } finally {
      setIsDraftLoaded(true);
    }
  }, []);

  // Debounced auto-save draft to localStorage whenever relevant state changes and step < 4
  useEffect(() => {
    if (!isDraftLoaded || typeof window === "undefined" || step >= 4) return;

    const timer = setTimeout(() => {
      try {
        const draft = {
          unitId: selectedUnitId || "",
          unitNumber: unitNumber || "",
          buildingName: buildingName || "",
          residentName: residentName || "",
          residentPhone: residentPhone || "",
          tradeId: selectedTrade?.id || "",
          subcategoryId: selectedSubcategory?.id || "",
          symptomId: selectedSymptom?.id || "",
          location: (isOtherRoom ? customRoomText : roomLocation) || "",
          description: description || "",
          urgency: urgency || "NORMAL",
          photos: photos || [],
          step: step,
          isOtherTrade,
          customTradeText,
          isOtherSubcategory,
          customSubcategoryText,
          isOtherSymptom,
          customSymptomText,
          faultDetailText,
          isOtherRoom,
          customRoomText,
          timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn("Failed to auto-save draft:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    isDraftLoaded,
    step,
    selectedUnitId,
    unitNumber,
    buildingName,
    residentName,
    residentPhone,
    selectedTrade,
    selectedSubcategory,
    selectedSymptom,
    isOtherTrade,
    customTradeText,
    isOtherSubcategory,
    customSubcategoryText,
    isOtherRoom,
    customRoomText,
    roomLocation,
    description,
    urgency,
    photos,
    isOtherSymptom,
    customSymptomText,
    faultDetailText,
  ]);

  // Fetch live trades and units in background without blocking UI
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [tradesRes, unitsRes] = await Promise.all([
          fetch("/api/trades").catch(() => null),
          fetch("/api/units").catch(() => null),
        ]);

        if (tradesRes && tradesRes.ok) {
          const tradesData = await tradesRes.json();
          if (isMounted && tradesData.trades && tradesData.trades.length > 0) {
            const hasRealTrades = tradesData.trades.some((t: any) => t.id !== "trade_other");
            if (hasRealTrades) {
              setTrades(tradesData.trades);
              // Refresh selectedTrade to full loaded trade if already selected
              setSelectedTrade((prev) => {
                if (!prev) return null;
                const matching = tradesData.trades.find((t: any) => t.id === prev.id);
                if (matching) {
                  setSelectedSubcategory((prevSub: any) => {
                    if (!prevSub || prevSub.id === "sub_other_custom") return prevSub;
                    return matching.subcategories?.find((s: any) => s.id === prevSub.id) || prevSub;
                  });
                  return matching;
                }
                return prev;
              });
            }
          }
        }

        if (unitsRes && unitsRes.ok) {
          const unitsData = await unitsRes.json();
          if (isMounted && unitsData.units && unitsData.units.length > 0) {
            setUnits(unitsData.units);
            const u = unitsData.units[0];
            setSelectedUnitId((prev) => prev || u.id);
            setUnitNumber((prev) => prev || u.unit_number);
            setBuildingName((prev) => prev || u.building_name);
            if (!isLandlordMode) {
              if (u.resident_name) setResidentName((prev) => prev || u.resident_name);
              if (u.resident_phone) setResidentPhone((prev) => prev || u.resident_phone);
            }
            const uRooms = Array.isArray(u.rooms) && u.rooms.length > 0
              ? u.rooms
              : ["المطبخ", "الحمام الرئيسي", "الريسبشن / الصالة", "غرفة النوم الرئيسية", "البلكونة"];
            setRoomLocation((prev) => prev || (uRooms[0] || ""));
          }
        }
      } catch (err) {
        console.error("Background data fetch error:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [isLandlordMode]);

  // When user selects a unit from dropdown
  const handleSelectUnit = (uId: string) => {
    setSelectedUnitId(uId);
    const u = units.find((x) => x.id === uId);
    if (u) {
      setUnitNumber(u.unit_number);
      setBuildingName(u.building_name);
      if (!isLandlordMode) {
        if (u.resident_name) setResidentName(u.resident_name);
        if (u.resident_phone) setResidentPhone(u.resident_phone);
      }
      const uRooms: string[] = Array.isArray(u.rooms) && u.rooms.length > 0
        ? u.rooms
        : ["المطبخ", "الحمام الرئيسي", "الريسبشن / الصالة", "غرفة النوم الرئيسية", "البلكونة"];
      if (!isOtherRoom) {
        setRoomLocation(uRooms[0] || "");
      }
    }
  };

  // Check for safety hazard triggers
  const handleSelectSymptom = (sym: any) => {
    setIsOtherSymptom(false);
    setSelectedSymptom(sym);
    if (sym.is_hazard) {
      setActiveHazard({
        instruction_en: sym.hazard_instruction_en || "Take immediate safety precautions.",
        instruction_ar: sym.hazard_instruction_ar || "برجاء اتخاذ إجراءات السلامة العاجلة فوراً.",
      });
      setUrgency("EMERGENCY");
    } else {
      setActiveHazard(null);
    }
  };

  // Handle custom "Other" selection
  const handleSelectOther = () => {
    setIsOtherSymptom(true);
    setSelectedSymptom({
      id: "sym_other_custom",
      symptom_en: customSymptomText || "Other Custom Fault",
      symptom_ar: customSymptomText || "عطل آخر غير مدرج",
      default_severity: "MEDIUM",
      is_hazard: false,
    });
  };

  // Photo upload with canvas downscaling (max 1200px, 0.75 quality JPEG)
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const rawData = reader.result;
          const img = new Image();
          img.onload = () => {
            try {
              const { width, height } = calculateDownscaledDimensions(img.width, img.height, 1200);
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const downscaled = canvas.toDataURL("image/jpeg", 0.75);
                setPhotos((prev) => [...prev, downscaled]);
              } else {
                setPhotos((prev) => [...prev, rawData]);
              }
            } catch {
              setPhotos((prev) => [...prev, rawData]);
            }
          };
          img.onerror = () => {
            setPhotos((prev) => [...prev, rawData]);
          };
          img.src = rawData;
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit fault ticket
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrade) return;

    setSubmitting(true);
    try {
      const extraSpec = faultDetailText.trim() ? `[توضيح العطل: ${faultDetailText.trim()}]` : "";
      const tradeSpec = isOtherTrade && customTradeText ? `[تخصص: ${customTradeText.trim()}]` : "";
      const subSpec = isOtherSubcategory && customSubcategoryText ? `[نوع: ${customSubcategoryText.trim()}]` : "";
      const symSpec = isOtherSymptom && customSymptomText ? `[عطل مخصص: ${customSymptomText.trim()}]` : "";

      const finalDesc = [tradeSpec, subSpec, symSpec, extraSpec, description]
        .filter(Boolean)
        .join(" ")
        .trim();

      const finalRoom = isOtherRoom ? customRoomText.trim() : roomLocation.trim();
      const currentUnit = units.find((x) => x.id === selectedUnitId);
      const propName = currentUnit?.property_name_ar || currentUnit?.property_name_en || (locale === "ar" ? "العقار السكني" : "Residential Property");

      const payload = {
        unit_number: unitNumber || currentUnit?.unit_number || (locale === "ar" ? "غير محدد" : "Unspecified"),
        building_name: buildingName || currentUnit?.building_name || (locale === "ar" ? "المبنى الرئيسي" : "Main Building"),
        property_name: propName,
        resident_name: isLandlordMode
          ? (residentName ? `[إدارة العقار / المالك] ${residentName}` : (locale === "ar" ? "إدارة العقار" : "Property Management"))
          : (residentName || currentUnit?.resident_name || (locale === "ar" ? "الساكن" : "Resident")),
        resident_phone: residentPhone || currentUnit?.resident_phone || "",
        trade_id: selectedTrade.id,
        subcategory_id: selectedSubcategory?.id || selectedTrade.subcategories?.[0]?.id || "sub_general",
        symptom_id: selectedSymptom?.id || "sym_general",
        custom_trade_text: isOtherTrade ? customTradeText.trim() : undefined,
        custom_subcategory_text: isOtherSubcategory ? customSubcategoryText.trim() : undefined,
        custom_symptom_text: isOtherSymptom ? customSymptomText.trim() : undefined,
        room_location_en: finalRoom || undefined,
        room_location_ar: finalRoom || undefined,
        description: finalDesc || undefined,
        urgency: urgency,
        photos: photos,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit ticket");

      const data = await res.json();
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (e) {}

      setCreatedTicket(data.ticket);
      setStep(4);
      toast.show({
        type: "success",
        title: locale === "ar" ? "تم تسجيل البلاغ بنجاح" : "Ticket submitted successfully",
        message: `${locale === "ar" ? "رقم البلاغ: " : "Reference: "}${data.ticket.reference_no || data.ticket.id}`,
      });
      if (onTicketCreated) onTicketCreated(data.ticket.id);
    } catch (err) {
      console.error(err);
      toast.show({
        type: "error",
        title: locale === "ar" ? "حدث خطأ أثناء إرسال البلاغ" : "Failed to submit ticket",
        message: locale === "ar" ? "تم الاحتفاظ ببيانات البلاغ لتتمكن من إعادة المحاولة." : "Your draft has been preserved so you can retry.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (e) {}
    setStep(1);
    setSelectedTrade(null);
    setIsOtherTrade(false);
    setCustomTradeText("");
    setSelectedSubcategory(null);
    setIsOtherSubcategory(false);
    setCustomSubcategoryText("");
    setSelectedSymptom(null);
    setIsOtherSymptom(false);
    setCustomSymptomText("");
    setFaultDetailText("");
    setIsOtherRoom(false);
    setCustomRoomText("");
    setDescription("");
    setPhotos([]);
    setActiveHazard(null);
    setCreatedTicket(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-12 sm:pb-8 screen-dashboard-content">
      {/* Mobile-Friendly Stepper Header with Arabic Labels */}
      <div className="tactile-card p-3 sm:p-4 bg-[var(--card)]">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label_ar: "١. التخصص", label_en: "1. Trade" },
            { num: 2, label_ar: "٢. نوع العطل", label_en: "2. Fault" },
            { num: 3, label_ar: "٣. البيانات", label_en: "3. Details" },
          ].map(({ num, label_ar, label_en }) => (
            <div key={num} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-1 justify-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shrink-0 ${
                  step === num
                    ? "bg-sky-600 text-white shadow-md shadow-sky-500/20 ring-2 ring-sky-500/20"
                    : step > num
                    ? "bg-emerald-600 text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                {step > num ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : num}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold text-center leading-tight ${
                  step === num ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                {locale === "ar" ? label_ar : label_en}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Hazard Alert */}
      {activeHazard && (
        <div className="tactile-card p-3.5 sm:p-4 bg-red-500/10 border-red-500/40 text-red-900 dark:text-red-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs sm:text-sm text-red-700 dark:text-red-400">
                {t("hazard_detected")}
              </div>
              <p className="text-[11px] sm:text-xs mt-1 leading-relaxed">
                {locale === "ar" ? activeHazard.instruction_ar : activeHazard.instruction_en}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Select Trade (Mobile 2-col, Large Touch Targets) */}
      {step === 1 && (
        <div className="tactile-card p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
              {locale === "ar" ? "ما هو نوع العطل الذي تواجهه؟" : "What category is the issue in?"}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {locale === "ar"
                ? "اضغط على التخصص المطلوب لتحديد المشكلة (سباكة، كهرباء، تكييف، نجارة، إلخ)"
                : "Select the category below (plumbing, electrical, AC, carpentry, etc.)"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {trades.map((trade) => {
              const IconComponent = TRADE_ICONS[trade.icon] || Wrench;
              const isSelected = selectedTrade?.id === trade.id;
              const isOther = trade.id === "trade_other" || trade.slug === "OTHER";
              const isElvTrade = trade.slug === "ELECTRICAL";

              return (
                <button
                  type="button"
                  key={trade.id}
                  onClick={() => {
                    setSelectedTrade(trade);
                    setIsOtherTrade(isOther);
                    setSelectedSubcategory(null);
                    setIsOtherSubcategory(false);
                    setSelectedSymptom(null);
                    setIsOtherSymptom(false);
                  }}
                  className={`min-h-[92px] sm:min-h-[105px] p-3 sm:p-4 rounded-xl text-start transition-all border flex flex-col justify-between active:scale-95 touch-manipulation cursor-pointer ${
                    isSelected
                      ? isOther
                        ? "bg-purple-500/15 border-purple-600 text-purple-950 dark:text-purple-200 ring-2 ring-purple-500/30 shadow-md font-bold"
                        : "bg-sky-500/15 border-sky-600 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500/30 shadow-md font-bold"
                      : isOther
                      ? "bg-[var(--card)] border-dashed border-purple-400/60 dark:border-purple-500/40 text-[var(--foreground)] hover:border-purple-500"
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isSelected
                          ? isOther
                            ? "bg-purple-600 text-white"
                            : "bg-sky-600 text-white"
                          : isOther
                          ? "bg-purple-500/10 text-purple-600"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    {isSelected ? (
                      <span
                        className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm ${
                          isOther ? "bg-purple-600" : "bg-sky-600"
                        }`}
                      >
                        ✓
                      </span>
                    ) : isOther ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        {locale === "ar" ? "مخصص" : "Custom"}
                      </span>
                    ) : isElvTrade ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                        {locale === "ar" ? "كاميرات/نت" : "ELV"}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 font-bold text-xs sm:text-sm line-clamp-2 leading-tight">
                    {locale === "ar" ? trade.name_ar : trade.name_en}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Trade Name Input when trade_other is selected */}
          {isOtherTrade && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5 animate-in fade-in">
              <label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                {locale === "ar" ? "اكتب اسم التخصص أو المجال المطلوب:" : "Enter Custom Trade / Category Name:"}
              </label>
              <input
                type="text"
                required
                value={customTradeText}
                onChange={(e) => setCustomTradeText(e.target.value)}
                placeholder={locale === "ar" ? "مثال: مكافحة حشرات، عزل أسطح، تلميع رخام، زجاج..." : "e.g. Pest control, roof insulation, glass, etc."}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
              />
            </div>
          )}

          <div className="pt-3 sm:pt-4 border-t border-[var(--border)] space-y-2">
            {!selectedTrade ? (
              <p className="text-center text-xs text-[var(--muted-foreground)] font-medium">
                {locale === "ar" ? "اضغط على أحد التخصصات أعلاه أولاً لتفعيل المتابعة" : "Please tap a category above to continue"}
              </p>
            ) : isOtherTrade && !customTradeText.trim() ? (
              <p className="text-center text-xs text-purple-700 dark:text-purple-300 font-medium">
                {locale === "ar" ? "يرجى كتابة اسم التخصص في الحقل أعلاه للمتابعة" : "Please enter the custom category name above to continue"}
              </p>
            ) : null}
            <button
              type="button"
              suppressHydrationWarning
              disabled={!selectedTrade || (isOtherTrade && !customTradeText.trim())}
              onClick={() => {
                if (selectedTrade?.id === "trade_other") {
                  setIsOtherSubcategory(true);
                  setSelectedSubcategory({
                    id: "sub_other_custom",
                    trade_id: "trade_other",
                    slug: "OTHER_CUSTOM",
                    name_en: customSubcategoryText || "General",
                    name_ar: customSubcategoryText || "عام",
                    is_elv: false,
                    symptoms: [],
                  });
                  setIsOtherSymptom(true);
                  setSelectedSymptom({
                    id: "sym_other_custom",
                    symptom_en: customSymptomText || "Other Fault",
                    symptom_ar: customSymptomText || "عطل آخر",
                    default_severity: "MEDIUM",
                    is_hazard: false,
                  });
                }
                setStep(2);
              }}
              className="w-full tactile-button py-3.5 px-6 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
            >
              <span>{t("action_next")}</span>
              {direction === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Subcategory & Symptom (with Custom "Other" Option) */}
      {step === 2 && selectedTrade && (
        <div className="tactile-card p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                {isOtherTrade && customTradeText
                  ? customTradeText
                  : (locale === "ar" ? selectedTrade.name_ar : selectedTrade.name_en)}
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)] mt-0.5">
                {locale === "ar" ? "حدد النظام ونوع العطل بدقة" : "Select Subsystem & Fault"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold min-h-[44px] min-w-[44px] px-3 py-2.5 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] touch-manipulation cursor-pointer"
            >
              {t("action_back")}
            </button>
          </div>

          {/* Subcategory Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">
              {locale === "ar" ? "الجزء أو نوع النظام المتضرر:" : "Sub-System / Type:"}
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTrade.subcategories?.map((sub) => {
                const isSelected = selectedSubcategory?.id === sub.id && !isOtherSubcategory;
                return (
                  <button
                    type="button"
                    key={sub.id}
                    onClick={() => {
                      setIsOtherSubcategory(false);
                      setSelectedSubcategory(sub);
                      setSelectedSymptom(null);
                      setIsOtherSymptom(false);
                    }}
                    className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      isSelected
                        ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                        : "bg-[var(--card)] hover:bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                    }`}
                  >
                    {locale === "ar" ? sub.name_ar : sub.name_en}
                  </button>
                );
              })}

              {/* Other Subcategory Pill */}
              <button
                type="button"
                onClick={() => {
                  setIsOtherSubcategory(true);
                  setSelectedSubcategory({
                    id: "sub_other_custom",
                    trade_id: selectedTrade.id,
                    slug: "OTHER_CUSTOM",
                    name_en: customSubcategoryText || "Other Type",
                    name_ar: customSubcategoryText || "نوع آخر غير مدرج",
                    is_elv: false,
                    symptoms: [],
                  });
                  setIsOtherSymptom(true);
                  setSelectedSymptom({
                    id: "sym_other_custom",
                    symptom_en: customSymptomText || "Other Fault",
                    symptom_ar: customSymptomText || "عطل آخر غير مدرج",
                    default_severity: "MEDIUM",
                    is_hazard: false,
                  });
                }}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  isOtherSubcategory
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-[var(--card)] border-dashed border-purple-400/60 text-purple-700 dark:text-purple-300 hover:border-purple-500"
                }`}
              >
                {locale === "ar" ? "+ نوع آخر غير مدرج" : "+ Other Unlisted Type"}
              </button>
            </div>

            {/* Custom Subcategory Input Box */}
            {isOtherSubcategory && (
              <div className="p-3.5 mt-2 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5 animate-in fade-in">
                <label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                  {locale === "ar" ? "اكتب نوع أو جزء النظام المطلوب:" : "Specify Custom Sub-System / Type:"}
                </label>
                <input
                  type="text"
                  required
                  value={customSubcategoryText}
                  onChange={(e) => {
                    setCustomSubcategoryText(e.target.value);
                    if (selectedSubcategory) {
                      setSelectedSubcategory({
                        ...selectedSubcategory,
                        name_en: e.target.value,
                        name_ar: e.target.value,
                      });
                    }
                  }}
                  placeholder={locale === "ar" ? "مثال: شفاط مركزي، سخان فوري، فلتر مياه 7 مراحل..." : "e.g. Range hood, water filter, tankless heater..."}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Symptoms List + Other Option */}
          {selectedSubcategory && (
            <div className="space-y-2.5 pt-3 border-t border-[var(--border)]">
              <label className="text-xs font-bold text-[var(--muted-foreground)]">
                {locale === "ar" ? "تحديد العطل بدقة:" : "Fault Manifestation:"}
              </label>

              {isOtherSubcategory ? (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    {locale === "ar" ? "اكتب تفاصيل أو وصف العطل المتضرر:" : "Describe the specific issue / fault:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={customSymptomText}
                    onChange={(e) => {
                      setCustomSymptomText(e.target.value);
                      setSelectedSymptom({
                        id: "sym_other_custom",
                        symptom_en: e.target.value,
                        symptom_ar: e.target.value,
                        default_severity: "MEDIUM",
                        is_hazard: false,
                      });
                    }}
                    placeholder={locale === "ar" ? "مثال: تسريب مياه من الوصلة، توقف تام عن العمل..." : "e.g. leaking from connection, stopped functioning..."}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSubcategory.symptoms?.map((sym: any) => {
                    const isSelected = selectedSymptom?.id === sym.id && !isOtherSymptom;
                    return (
                      <button
                        type="button"
                        key={sym.id}
                        onClick={() => handleSelectSymptom(sym)}
                        className={`w-full min-h-[48px] p-3.5 rounded-xl text-start text-xs border transition-all flex items-start gap-3 active:scale-[0.98] touch-manipulation cursor-pointer ${
                          isSelected
                            ? "bg-sky-500/15 border-sky-600 text-sky-950 dark:text-sky-100 ring-2 ring-sky-500/30 font-bold shadow-sm"
                            : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {sym.is_hazard ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : (
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? "border-sky-600 bg-sky-600 text-white text-[10px]" : "border-slate-400"
                              }`}
                            >
                              {isSelected ? "✓" : null}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xs sm:text-sm leading-snug">
                            {locale === "ar" ? sym.symptom_ar : sym.symptom_en}
                          </div>
                          {sym.is_hazard && (
                            <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 block mt-0.5">
                              {locale === "ar" ? "خطر وسلامة عاجل" : "Immediate Hazard"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* The "Other" Custom Fault Option */}
                  <button
                    type="button"
                    onClick={handleSelectOther}
                    className={`w-full min-h-[48px] p-3.5 rounded-xl text-start text-xs border transition-all flex items-start gap-3 active:scale-[0.98] touch-manipulation cursor-pointer ${
                      isOtherSymptom
                        ? "bg-purple-500/15 border-purple-600 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/30 font-bold"
                        : "bg-[var(--card)] border-dashed border-[var(--border)] hover:border-purple-400 text-[var(--foreground)]"
                    }`}
                  >
                    <PlusCircle className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-xs sm:text-sm text-purple-800 dark:text-purple-300">
                        {locale === "ar" ? "عطل آخر غير مدرج في القائمة (+)" : "Other Unlisted Fault (+)"}
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)] block mt-0.5">
                        {locale === "ar" ? "اضغط هنا لكتابة وصف المشكلة بيدك" : "Tap here to write your custom issue"}
                      </span>
                    </div>
                  </button>

                  {/* Text box for Other Symptom */}
                  {isOtherSymptom && (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5 animate-in fade-in">
                      <label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                        {locale === "ar" ? "اكتب اسم أو عنوان العطل:" : "Enter Custom Fault Name:"}
                      </label>
                      <input
                        type="text"
                        required
                        value={customSymptomText}
                        onChange={(e) => {
                          setCustomSymptomText(e.target.value);
                          if (selectedSymptom) {
                            setSelectedSymptom({
                              ...selectedSymptom,
                              symptom_en: e.target.value,
                              symptom_ar: e.target.value,
                            });
                          }
                        }}
                        placeholder={locale === "ar" ? "مثال: لمبة الشرفة بتنور وتطفي لوحدها" : "e.g. Balcony light flickers intermittently"}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Optional Fault Detail Specification Input (for standard symptoms) */}
                  {selectedSymptom && !isOtherSymptom && (
                    <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-1.5 animate-in fade-in">
                      <label className="text-xs font-bold text-sky-900 dark:text-sky-300">
                        {locale === "ar" ? "توضيح إضافي لنوع العطل (اختياري):" : "Additional fault specification (optional):"}
                      </label>
                      <input
                        type="text"
                        value={faultDetailText}
                        onChange={(e) => setFaultDetailText(e.target.value)}
                        placeholder={locale === "ar" ? "مثال: الصوت بيظهر عند تشغيل السرعة العالية أو فتح المحبس" : "e.g. noise only happens on high speed"}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="tactile-button py-3 px-4 border border-[var(--border)] bg-[var(--card)] text-xs font-bold min-h-[46px] touch-manipulation cursor-pointer"
            >
              {t("action_back")}
            </button>
            <button
              type="button"
              disabled={
                !selectedSubcategory ||
                (isOtherSubcategory && !customSubcategoryText.trim()) ||
                !selectedSymptom ||
                (isOtherSymptom && !customSymptomText.trim())
              }
              onClick={() => setStep(3)}
              className="flex-1 tactile-button py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[46px] touch-manipulation cursor-pointer"
            >
              <span>{t("action_next")}</span>
              {direction === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Unit Info, Photos, and Description */}
      {step === 3 && selectedSymptom && (
        <form onSubmit={handleSubmit} className="tactile-card p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                {locale === "ar"
                  ? `${isOtherTrade && customTradeText ? customTradeText : selectedTrade?.name_ar} > ${isOtherSubcategory && customSubcategoryText ? customSubcategoryText : selectedSubcategory?.name_ar || ""}`
                  : `${isOtherTrade && customTradeText ? customTradeText : selectedTrade?.name_en} > ${isOtherSubcategory && customSubcategoryText ? customSubcategoryText : selectedSubcategory?.name_en || ""}`}
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)] mt-0.5">
                {locale === "ar" ? "بيانات الوحدة وتفاصيل البلاغ" : "Location & Report Details"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold min-h-[44px] min-w-[44px] px-3 py-2.5 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] touch-manipulation cursor-pointer"
            >
              {t("action_back")}
            </button>
          </div>

          {/* Single Unit Selector (Dropdown from registered units or direct input) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--foreground)]">
              {units.length > 0
                ? (locale === "ar" ? "الوحدة السكنية المسجلة:" : "Registered Residential Unit:")
                : (locale === "ar" ? "بيانات الوحدة والعمارة:" : "Unit & Building:")}
            </label>
            {units.length > 0 ? (
              <select
                value={selectedUnitId}
                onChange={(e) => handleSelectUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-bold focus:ring-2 focus:ring-sky-500/20"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {locale === "ar"
                      ? `وحدة ${u.unit_number} — ${u.building_name}`
                      : `Unit ${u.unit_number} — ${u.building_name}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder={locale === "ar" ? "رقم الوحدة (مثال: 12)" : "Unit Number (e.g. 12)"}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
                <input
                  type="text"
                  required
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder={locale === "ar" ? "اسم العمارة / المجمع" : "Building / Block"}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>
            )}
          </div>

          {/* Exact Room / Location Fixed Area Selection with Other Option */}
          {(() => {
            const currentUnit = units.find((u) => u.id === selectedUnitId);
            const availableRooms: string[] =
              currentUnit && Array.isArray(currentUnit.rooms) && currentUnit.rooms.length > 0
                ? currentUnit.rooms
                : ["المطبخ", "الحمام الرئيسي", "الريسبشن / الصالة", "غرفة النوم الرئيسية", "البلكونة"];

            return (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--foreground)]">
                  {locale === "ar" ? "مكان العطل المحدد داخل الوحدة:" : "Exact Room / Location:"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableRooms.map((room) => {
                    const isSelected = !isOtherRoom && roomLocation === room;
                    return (
                      <button
                        type="button"
                        key={room}
                        onClick={() => {
                          setIsOtherRoom(false);
                          setRoomLocation(room);
                        }}
                        className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                          isSelected
                            ? "bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-500/30"
                            : "bg-[var(--card)] hover:bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                        }`}
                      >
                        {room}
                      </button>
                    );
                  })}

                  {/* Other Room Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherRoom(true);
                      setRoomLocation(customRoomText || "");
                    }}
                    className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      isOtherRoom
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/30"
                        : "bg-[var(--card)] hover:bg-purple-500/10 border-dashed border-purple-400 text-purple-700 dark:text-purple-300"
                    }`}
                  >
                    {locale === "ar" ? "مكان آخر (+)" : "Other Room (+)"}
                  </button>
                </div>

                {isOtherRoom && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5 animate-in fade-in">
                    <label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      {locale === "ar" ? "اكتب اسم المكان غير المدرج:" : "Specify custom location:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={customRoomText}
                      onChange={(e) => {
                        setCustomRoomText(e.target.value);
                        setRoomLocation(e.target.value);
                      }}
                      placeholder={locale === "ar" ? "مثال: ممر الطرقة، غرفة الدريسنج، الروف" : "e.g. Hallway, Dressing room, Rooftop"}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Resident Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--muted-foreground)]">{t("field_resident_name")}</label>
              <input
                type="text"
                required
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder={locale === "ar" ? "أدخل اسم الساكن ثلاثي" : "Resident full name"}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--muted-foreground)]">{t("field_resident_phone")}</label>
              <input
                type="text"
                required
                value={residentPhone}
                onChange={(e) => setResidentPhone(e.target.value)}
                placeholder={locale === "ar" ? "مثال: 01001234567" : "+20 100 123 4567"}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] dir-ltr text-right"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">{t("field_description")}</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={locale === "ar" ? "أضف أي تفاصيل أو ملاحظات إضافية..." : "Any additional notes..."}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
            />
          </div>

          {/* Photos */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">{t("field_photos")}</label>
            <div className="flex flex-wrap gap-2.5 items-center">
              {photos.map((photo, i) => (
                <div key={i} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-0 right-0 min-w-[44px] min-h-[44px] p-2 flex items-center justify-center rounded-full text-white hover:text-red-400 touch-manipulation cursor-pointer"
                    title={locale === "ar" ? "حذف الصورة" : "Remove photo"}
                  >
                    <span className="w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 flex items-center justify-center shadow transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              ))}

              <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-sky-500 flex flex-col items-center justify-center cursor-pointer text-center p-1">
                <Camera className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)] mt-0.5 font-semibold">
                  {locale === "ar" ? "+ صورة" : "+ Photo"}
                </span>
                <input type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="tactile-button py-3 px-4 border border-[var(--border)] bg-[var(--card)] text-xs font-bold min-h-[46px] touch-manipulation cursor-pointer"
            >
              {t("action_back")}
            </button>
            <button
              type="submit"
              disabled={submitting || (isOtherRoom && !customRoomText.trim())}
              className="flex-1 tactile-button py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 min-h-[46px] touch-manipulation cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? t("action_submitting") : t("action_submit")}</span>
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Success View */}
      {step === 4 && createdTicket && (
        <div className="tactile-card p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {locale === "ar" ? "تم تسجيل البلاغ بنجاح!" : "Fault Report Submitted!"}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {locale === "ar"
                ? `رقم البلاغ: ${createdTicket.reference_no || createdTicket.id}`
                : `Reference: ${createdTicket.reference_no || createdTicket.id}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full">
            <button
              type="button"
              onClick={() => setShowWorkOrderSlip(true)}
              className="w-full sm:w-auto tactile-button py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all min-h-[46px] touch-manipulation cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>{locale === "ar" ? "طباعة / تحميل إيصال البلاغ (PDF)" : "Print / Save Receipt (PDF)"}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto tactile-button py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md min-h-[46px] touch-manipulation cursor-pointer"
            >
              {t("action_new_report")}
            </button>
          </div>
        </div>
      )}

      {/* Printable Slip Modal */}
      {showWorkOrderSlip && createdTicket && (
        <WorkOrderSlip
          ticket={createdTicket}
          onClose={() => setShowWorkOrderSlip(false)}
        />
      )}
    </div>
  );
}
