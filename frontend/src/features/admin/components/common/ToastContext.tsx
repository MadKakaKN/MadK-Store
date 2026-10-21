import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, title = 'Thành công') => showToast({ type: 'success', title, message }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title = 'Lỗi') => showToast({ type: 'error', title, message }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title = 'Thông báo') => showToast({ type: 'info', title, message }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title = 'Cảnh báo') => showToast({ type: 'warning', title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, info, warning, dismiss }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all transform duration-200 bg-white ${
              toast.type === 'success'
                ? 'border-emerald-200 text-emerald-950'
                : toast.type === 'error'
                  ? 'border-rose-200 text-rose-950'
                  : toast.type === 'warning'
                    ? 'border-amber-200 text-amber-950'
                    : 'border-sky-200 text-sky-950'
            }`}
          >
            {/* Icon */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
                toast.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : toast.type === 'error'
                    ? 'bg-rose-100 text-rose-700'
                    : toast.type === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700'
              }`}
            >
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              {toast.title && <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>}
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{toast.message}</p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md text-sm shrink-0"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
