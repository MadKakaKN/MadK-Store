import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SocialAuthButtons } from '../../features/auth/components/SocialAuthButtons';

export interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  redirectUrl?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  title = 'Đăng nhập để tiếp tục',
  message = 'Vui lòng đăng nhập hoặc tạo tài khoản mới để thêm sản phẩm vào giỏ hàng, nhận ưu đãi độc quyền và theo dõi đơn hàng dễ dàng!',
  redirectUrl = window.location.pathname,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const loginUrl = `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`;
  const registerUrl = `/auth/register?redirect=${encodeURIComponent(redirectUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop with modern blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 text-center transform transition-all duration-300 scale-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Đóng cửa sổ"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon with Glowing Gradient */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 text-2xl mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Modal Titles */}
        <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {/* Dual CTA Action Buttons */}
        <div className="mt-6 space-y-3">
          {/* Button 1: Đăng nhập (Login) */}
          <Link
            to={loginUrl}
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-brand-600/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Đăng nhập (Login)</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          {/* Button 2: Đăng ký (Sign Up) */}
          <Link
            to={registerUrl}
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-slate-700 hover:text-brand-700 font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Tạo tài khoản mới (Sign Up)</span>
          </Link>

          {/* Social 1-click Quick Login */}
          <SocialAuthButtons
            layout="compact"
            onSuccess={onClose}
          />
        </div>

        {/* Dismiss Footer */}
        <div className="mt-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Để sau, tôi muốn tiếp tục xem sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
