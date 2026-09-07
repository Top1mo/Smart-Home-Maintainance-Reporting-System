"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Error Boundary caught an unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="tactile-card p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-red-500/30 bg-[var(--card)]">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]">
            حدث خطأ غير متوقع في النظام
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            تعذر إكمال العملية الحالية. بياناتك المسجلة محفوظة بأمان في قاعدة البيانات المحلية.
          </p>
        </div>

        {error.message && (
          <div className="p-2.5 rounded-lg bg-[var(--muted)] text-[11px] font-mono text-[var(--muted-foreground)] text-start overflow-x-auto border border-[var(--border)] max-h-24">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 tactile-button py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="tactile-button py-2.5 px-4 bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-[var(--border)] transition-all"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
}
