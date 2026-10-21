import React, { useEffect } from 'react';

export type ConfirmModalVariant = 'danger' | 'warning' | 'primary' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'primary',
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      btn: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
      iconBg: 'bg-rose-100 text-rose-600',
      icon: '⚠',
    },
    warning: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: '!',
    },
    primary: {
      btn: 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500',
      iconBg: 'bg-brand-100 text-brand-600',
      icon: '✓',
    },
    info: {
      btn: 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500',
      iconBg: 'bg-sky-100 text-sky-600',
      icon: 'ℹ',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${variantStyles.iconBg}`}
            >
              {variantStyles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="modal-title" className="text-lg font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2 ${variantStyles.btn}`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
