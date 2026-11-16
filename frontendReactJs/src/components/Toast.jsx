import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let toastExternal = {
  success: () => {},
  error: () => {},
  info: () => {},
};

export const toast = {
  success: (msg) => toastExternal.success(msg),
  error: (msg) => toastExternal.error(msg),
  info: (msg) => toastExternal.info(msg),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((msg) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg) => addToast(msg, "error"), [addToast]);
  const info = useCallback((msg) => addToast(msg, "info"), [addToast]);

  toastExternal = { success, error, info };

  return (
    <ToastContext.Provider value={{ addToast, success, error, info }}>
      {children}
      {/* Toast Floating Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border text-xs font-semibold transition-all animate-in slide-in-from-top-3 duration-200 ${
              t.type === "success"
                ? "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : t.type === "error"
                ? "bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
              {t.type === "info" && (
                <Info className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" />
              )}
            </div>

            <div className="flex-1 leading-snug">{t.message}</div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return toast;
  }
  return context;
}
