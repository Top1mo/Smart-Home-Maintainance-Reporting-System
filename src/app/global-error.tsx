"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-slate-900 border border-red-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xl font-bold">
            ⚠
          </div>
          <h2 className="text-lg font-bold text-white">توقف مؤقت في النظام</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            حدث خطأ تقني في الواجهة الرئيسية. يمكنك الضغط أدناه لإعادة تشغيل النظام بأمان.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
            >
              إعادة التحميل الآن
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
