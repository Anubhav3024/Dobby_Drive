import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = toast.id || uid();
    const next = {
      id,
      title: toast.title || "Notice",
      message: toast.message || "",
      type: toast.type || "info",
      progress: toast.progress ?? null,
      autoCloseMs: toast.autoCloseMs ?? 3500,
    };
    setToasts((prev) => [next, ...prev].slice(0, 6));
    if (next.autoCloseMs && next.progress == null) {
      window.setTimeout(() => removeToast(id), next.autoCloseMs);
    }
    return id;
  }, [removeToast]);

  const updateToast = useCallback((id, patch) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }, []);

  const value = useMemo(() => {
    return { toasts, addToast, updateToast, removeToast };
  }, [toasts, addToast, updateToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite" aria-relevant="all">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-title">{t.title}</div>
            {t.message ? <div className="toast-msg">{t.message}</div> : null}
            {t.progress != null ? (
              <div className="toast-progress">
                <div
                  className="toast-progress-bar"
                  style={{ width: `${Math.max(0, Math.min(100, t.progress))}%` }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

