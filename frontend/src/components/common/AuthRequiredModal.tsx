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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-lg p-6 sm:p-7 shadow-xl border border-[#E5E7EB] z-10 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
          aria-label="Đóng cửa sổ"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Clean Retail Lock Badge */}
        <div className="w-11 h-11 mx-auto rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center mb-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Modal Titles */}
        <h3 id="auth-modal-title" className="text-base sm:text-lg font-bold text-gray-900">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {/* Dual CTA Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* Button 1: Đăng nhập ngay */}
          <Link
            to={loginUrl}
            onClick={onClose}
            className="w-full h-10 px-4 rounded bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Đăng nhập ngay</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          {/* Button 2: Tạo tài khoản mới */}
          <Link
            to={registerUrl}
            onClick={onClose}
            className="w-full h-10 px-4 rounded border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Tạo tài khoản mới</span>
          </Link>

          {/* Social 1-click Quick Login */}
          <SocialAuthButtons
            layout="compact"
            onSuccess={onClose}
          />
        </div>

        {/* Dismiss Footer */}
        <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            Để sau, tôi muốn tiếp tục xem sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
