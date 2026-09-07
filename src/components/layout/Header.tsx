"use client";

import React from "react";
import { useI18n, Locale } from "@/lib/i18n/context";
import { Globe, Moon, Sun, Home, Shield, BarChart3 } from "lucide-react";

export function Header({
  activeRole,
  onSelectRole,
}: {
  activeRole: "resident" | "dispatcher" | "landlord";
  onSelectRole: (role: "resident" | "dispatcher" | "landlord") => void;
}) {
  const { locale, setLocale, t } = useI18n();
  const [isDark, setIsDark] = React.useState(false);

  const toggleLanguage = () => {
    const nextLocale: Locale = locale === "ar" ? "en" : "ar";
    setLocale(nextLocale);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== "undefined") {
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Clean Tactile Logo (No gradients, no emojis) */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)]">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base leading-tight tracking-tight text-[var(--foreground)]">
                  {t("app_title")}
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] hidden sm:block">
                  {t("app_tagline")}
                </div>
              </div>
            </div>

            {/* Navigation Pills (Desktop / Tablet) */}
            <nav className="hidden md:flex items-center bg-[var(--muted)] p-1 rounded-xl border border-[var(--border)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => onSelectRole("resident")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
                  activeRole === "resident"
                    ? "bg-[var(--card)] text-sky-600 dark:text-sky-400 shadow-sm font-bold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("nav_resident")}
              </button>
              <button
                type="button"
                onClick={() => onSelectRole("dispatcher")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
                  activeRole === "dispatcher"
                    ? "bg-[var(--card)] text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("nav_dispatcher")}
              </button>
              <button
                type="button"
                onClick={() => onSelectRole("landlord")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
                  activeRole === "landlord"
                    ? "bg-[var(--card)] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("nav_landlord")}
              </button>
            </nav>

            {/* Quick Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleLanguage}
                className="tactile-button px-2.5 py-1.5 text-xs font-bold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] rounded-lg flex items-center gap-1 shadow-sm touch-manipulation cursor-pointer"
                title={locale === "ar" ? "Switch to English" : "التحويل للغة العربية"}
              >
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-[11px] font-bold">{locale === "ar" ? "English" : "العربية"}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="tactile-button p-2 text-xs border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] rounded-lg shadow-sm touch-manipulation cursor-pointer"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb-Friendly with Safe Touch Targets) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)]/95 backdrop-blur-lg border-t border-[var(--border)] px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => onSelectRole("resident")}
          className={`flex flex-col items-center justify-center min-w-[70px] min-h-[48px] py-1 px-3 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
            activeRole === "resident"
              ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">{locale === "ar" ? "السكان" : "Resident"}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectRole("dispatcher")}
          className={`flex flex-col items-center justify-center min-w-[70px] min-h-[48px] py-1 px-3 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
            activeRole === "dispatcher"
              ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">{locale === "ar" ? "المتابعة" : "Dispatch"}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectRole("landlord")}
          className={`flex flex-col items-center justify-center min-w-[70px] min-h-[48px] py-1 px-3 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
            activeRole === "landlord"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">{locale === "ar" ? "المالك" : "Landlord"}</span>
        </button>
      </div>
    </>
  );
}
