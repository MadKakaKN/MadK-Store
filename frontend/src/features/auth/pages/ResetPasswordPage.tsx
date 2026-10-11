import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../../../api/authApi';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!token.trim()) {
      newErrors.token = 'Vui lòng nhập mã token đặt lại mật khẩu.';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    const res = await authApi.resetPassword({
      email: email.trim(),
      token: token.trim(),
      newPassword,
    });
    setIsSubmitting(false);

    if (res.isSuccess) {
      setIsSuccess(true);
    } else {
      setServerError(res.error || 'Đặt lại mật khẩu thất bại.');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-4">
              ✅
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Đặt lại mật khẩu thành công!</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Mật khẩu mới của bạn đã được cập nhật. Toàn bộ các phiên đăng nhập cũ đã được thu hồi vì lý do an toàn.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/auth/login', { replace: true })}
                className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/20 transition-all"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 sm:px-0">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
            M
          </span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đặt lại mật khẩu</h1>
        <p className="mt-2 text-sm text-slate-600">Nhập mã xác thực đã nhận được cùng mật khẩu mới của bạn.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Lỗi đặt lại mật khẩu</p>
                <p className="text-xs text-rose-700 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="vidu@madkstore.vn"
                className={`mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                  errors.email
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="token" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mã xác thực (Token) <span className="text-rose-500">*</span>
              </label>
              <input
                id="token"
                name="token"
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                }}
                placeholder="Nhập mã token từ email"
                className={`mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                  errors.token
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.token && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.token}</p>}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full pl-4 pr-10 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                    errors.newPassword
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.newPassword}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="Nhập lại mật khẩu mới"
                className={`mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                  errors.confirmPassword
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-brand-600/20 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang lưu mật khẩu...
                  </span>
                ) : (
                  'Lưu mật khẩu mới'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
