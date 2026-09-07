"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  Building,
  Plus,
  Edit2,
  Check,
  X,
  Phone,
  User,
  Layers,
  Search,
} from "lucide-react";

interface Unit {
  id: string;
  property_id?: string;
  unit_number: string;
  building_name: string;
  floor_number: number;
  resident_name: string;
  resident_phone: string;
  rooms?: string[];
}

const DEFAULT_ROOMS = [
  "المطبخ",
  "الحمام الرئيسي",
  "الريسبشن / الصالة",
  "غرفة النوم الرئيسية",
  "البلكونة",
];

export function UnitManager() {
  const { locale } = useI18n();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Modal / Form state for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // Form fields
  const [unitNumber, setUnitNumber] = useState<string>("");
  const [buildingName, setBuildingName] = useState<string>("Gardenia Complex");
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [residentName, setResidentName] = useState<string>("");
  const [residentPhone, setResidentPhone] = useState<string>("");
  const [rooms, setRooms] = useState<string[]>(DEFAULT_ROOMS);
  const [newRoomInput, setNewRoomInput] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchUnits = async () => {
    try {
      const res = await fetch("/api/units");
      const data = await res.json();
      if (data.units) setUnits(data.units);
    } catch (err) {
      console.error("Failed to load units:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleOpenAdd = () => {
    setEditingUnitId(null);
    setUnitNumber("");
    setBuildingName("Gardenia Complex");
    setFloorNumber(1);
    setResidentName("");
    setResidentPhone("");
    setRooms([...DEFAULT_ROOMS]);
    setNewRoomInput("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnitId(unit.id);
    setUnitNumber(unit.unit_number);
    setBuildingName(unit.building_name);
    setFloorNumber(unit.floor_number);
    setResidentName(unit.resident_name);
    setResidentPhone(unit.resident_phone);
    setRooms(
      Array.isArray(unit.rooms) && unit.rooms.length > 0
        ? [...unit.rooms]
        : [...DEFAULT_ROOMS]
    );
    setNewRoomInput("");
    setIsFormOpen(true);
  };

  const handleAddRoom = () => {
    const trimmed = newRoomInput.trim();
    if (trimmed && !rooms.includes(trimmed)) {
      setRooms([...rooms, trimmed]);
      setNewRoomInput("");
    }
  };

  const handleRemoveRoom = (roomToRemove: string) => {
    setRooms(rooms.filter((r) => r !== roomToRemove));
  };

  const handleQuickAddRoom = (tag: string) => {
    if (!rooms.includes(tag)) {
      setRooms([...rooms, tag]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingUnitId;
      const url = "/api/units";
      const method = isEdit ? "PUT" : "POST";
      const payload: any = {
        unit_number: unitNumber,
        building_name: buildingName,
        floor_number: floorNumber,
        resident_name: residentName,
        resident_phone: residentPhone,
        rooms: rooms,
      };
      if (isEdit) payload.id = editingUnitId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save unit");

      await fetchUnits();
      setIsFormOpen(false);
    } catch (err: any) {
      alert(err.message || "Error saving unit");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUnits = units.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.unit_number.toLowerCase().includes(q) ||
      u.building_name.toLowerCase().includes(q) ||
      u.resident_name.toLowerCase().includes(q) ||
      u.resident_phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="tactile-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "ar" ? "بحث برقم الشقة أو اسم الساكن..." : "Search unit or resident..."}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="tactile-button px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{locale === "ar" ? "إضافة وحدة سكنية جديدة" : "Add New Unit"}</span>
        </button>
      </div>

      {/* Units Table / Grid */}
      <div className="tactile-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
            {locale === "ar" ? "جاري تحميل الوحدات..." : "Loading units..."}
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
            {locale === "ar" ? "لا توجد وحدات مطابقة للبحث" : "No units found"}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredUnits.map((u) => (
              <div
                key={u.id}
                className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 hover:bg-[var(--muted)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/20">
                    {u.unit_number}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[var(--foreground)] flex items-center gap-2">
                      <span>{u.building_name}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)] font-normal">
                        ({locale === "ar" ? `الدور ${u.floor_number}` : `Floor ${u.floor_number}`})
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{u.resident_name}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" />
                        <span className="dir-ltr">{u.resident_phone}</span>
                      </span>
                    </div>
                    {u.rooms && u.rooms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                        <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 font-semibold">
                          <Layers className="w-3 h-3 text-sky-500" />
                          <span>{locale === "ar" ? "الغرف:" : "Rooms:"}</span>
                        </span>
                        {u.rooms.slice(0, 4).map((r: string) => (
                          <span
                            key={r}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]"
                          >
                            {r}
                          </span>
                        ))}
                        {u.rooms.length > 4 && (
                          <span className="text-[10px] px-1 rounded text-slate-500 font-mono">
                            +{u.rooms.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(u)}
                  className="tactile-button p-2 text-xs border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] rounded-lg text-[var(--foreground)] flex items-center gap-1"
                  title={locale === "ar" ? "تعديل بيانات الوحدة والساكن" : "Edit Unit & Resident"}
                >
                  <Edit2 className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-[11px] hidden sm:inline">{locale === "ar" ? "تعديل" : "Edit"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Unit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="tactile-card p-6 max-w-md w-full bg-[var(--card)] space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-sm text-[var(--foreground)]">
                {editingUnitId
                  ? (locale === "ar" ? "تعديل بيانات الوحدة والساكن" : "Edit Unit & Resident")
                  : (locale === "ar" ? "إضافة وحدة سكنية جديدة" : "Add New Unit")}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "رقم الشقة / الوحدة:" : "Unit Number:"}
                </label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="204"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "رقم الدور:" : "Floor:"}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "اسم العمارة / المجمع:" : "Building / Block:"}
                </label>
                <input
                  type="text"
                  required
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="Tower B"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "اسم الساكن / المستأجر:" : "Resident Name:"}
                </label>
                <input
                  type="text"
                  required
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  placeholder="محمد علي / Mohamed Ali"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="font-bold text-[var(--muted-foreground)]">
                  {locale === "ar" ? "رقم الموبايل للتواصل:" : "Resident Phone:"}
                </label>
                <input
                  type="text"
                  required
                  value={residentPhone}
                  onChange={(e) => setResidentPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                />
              </div>

              {/* Fixed Rooms & Areas Configuration */}
              <div className="space-y-2 col-span-2 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-500" />
                    <span>{locale === "ar" ? "أماكن وغرف الوحدة المحددة (Fixed Areas):" : "Configured Unit Rooms & Areas:"}</span>
                  </label>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {locale === "ar" ? `${rooms.length} غرف مسجلة` : `${rooms.length} rooms`}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] leading-normal">
                  {locale === "ar"
                    ? "حدد الغرف والأماكن الثابتة لهذه الوحدة ليختار منها الساكن أثناء الإبلاغ عن الأعطال:"
                    : "Specify the rooms in this unit so the resident can pick the exact location:"}
                </p>

                {/* Current Room Tags */}
                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-lg bg-[var(--muted)]/60 border border-[var(--border)]">
                  {rooms.length === 0 ? (
                    <span className="text-[11px] text-[var(--muted-foreground)] italic">
                      {locale === "ar" ? "لم يتم تحديد غرف بعد. اضغط على المقترحات أدناه للإضافة." : "No rooms configured. Tap below to add."}
                    </span>
                  ) : (
                    rooms.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-xs"
                      >
                        <span>{r}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(r)}
                          className="text-slate-400 hover:text-red-500 rounded-full p-0.5 cursor-pointer"
                          title="حذف"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-[var(--muted-foreground)] block">
                    {locale === "ar" ? "مقترحات سريعة للإضافة:" : "Quick Suggestions:"}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "المطبخ",
                      "الحمام الرئيسي",
                      "الريسبشن / الصالة",
                      "غرفة النوم الرئيسية",
                      "غرفة الأطفال",
                      "البلكونة",
                      "حمام الضيوف",
                      "السطح / الروف",
                      "الحديقة",
                      "الممر / الطرقة",
                    ].map((sug) => {
                      const isAdded = rooms.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleQuickAddRoom(sug)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            isAdded
                              ? "opacity-40 border-transparent bg-transparent text-[var(--muted-foreground)] cursor-not-allowed"
                              : "border-[var(--border)] bg-[var(--card)] hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          + {sug}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Room Input */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newRoomInput}
                    onChange={(e) => setNewRoomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRoom();
                      }
                    }}
                    placeholder={locale === "ar" ? "أو اكتب اسم مكان مخصص (مثال: غرفة المعيشة)..." : "Or type custom room..."}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="tactile-button px-3 py-1.5 bg-[var(--muted)] hover:bg-[var(--border)] text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {locale === "ar" ? "إضافة +" : "Add +"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="tactile-button px-4 py-2 text-xs border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="tactile-button px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ البيانات" : "Save Unit")}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
