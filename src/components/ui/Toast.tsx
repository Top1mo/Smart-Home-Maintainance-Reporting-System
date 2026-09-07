"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  show: (toast: Omit<ToastMessage, "id">) => string;
  dismiss: (id: string) => void;
  toasts: ToastMessage[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = "toast_" + Math.random().toString(36).substring(2, 9);
      const duration = toast.duration ?? 4000;
      const newToast: ToastMessage = { ...toast, id, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss, toasts }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-4 start-4 end-4 sm:end-auto sm:start-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start gap-3 transition-all animate-in slide-in-from-bottom-2 duration-200 ${
                isSuccess
                  ? "bg-emerald-950/95 text-emerald-100 border-emerald-500/40"
                  : isError
                  ? "bg-red-950/95 text-red-100 border-red-500/40"
                  : isWarning
                  ? "bg-amber-950/95 text-amber-100 border-amber-500/40"
                  : "bg-slate-900/95 text-slate-100 border-slate-700"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isError && <AlertCircle className="w-4 h-4 text-red-400" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-sky-400" />}
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-bold leading-tight">{toast.title}</div>
                {toast.message && <div className="mt-1 opacity-90 leading-relaxed">{toast.message}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 p-1 -m-1 rounded-lg text-current opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
