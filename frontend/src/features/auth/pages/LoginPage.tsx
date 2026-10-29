import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tokenStorage } from '../../../api/authApi';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const explicitRedirect = searchParams.get('redirect') || searchParams.get('returnUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Client validation & error states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSuccess = () => {
    const currentUser = tokenStorage.getUser();
    const isAdmin = currentUser?.roles?.includes('Admin');
    const safeRedirect = explicitRedirect && !explicitRedirect.startsWith('/auth') ? explicitRedirect : '/';

    const targetUrl = isAdmin && (!explicitRedirect || explicitRedirect === '/') ? '/admin' : safeRedirect;

    // Hard navigation guarantees fresh session & avoids React Router race conditions
    window.location.href = targetUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (result.success) {
      handleLoginSuccess();
    } else {
      setServerError(result.error || 'Đăng nhập không thành công.');
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
              M
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đăng nhập tài khoản</h1>
          <p className="mt-2 text-sm text-slate-600">
            Chưa có tài khoản?{' '}
            <Link
              to={`/auth/register${explicitRedirect ? `?redirect=${encodeURIComponent(explicitRedirect)}` : ''}`}
              className="font-bold text-brand-600 hover:text-brand-500 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {/* Quick Demo Pill Helper */}
          <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Tài khoản mẫu đã seed:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('customer@madkstore.vn', 'CustomerPassword123!')}
                className="text-xs font-medium px-2.5 py-1.5 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-colors"
              >
                👤 Khách hàng
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@madkstore.vn', 'AdminPassword123!')}
                className="text-xs font-medium px-2.5 py-1.5 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-colors"
              >
                🛡️ Quản trị viên
              </button>
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm flex items-start gap-3 animate-shake">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Đăng nhập thất bại</p>
                <p className="text-xs text-rose-700 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="vidu@madkstore.vn"
                  className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                    errors.email
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-500 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Nhập mật khẩu"
                  className={`w-full pl-4 pr-11 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                    errors.password
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password}</p>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-600">
                Ghi nhớ phiên đăng nhập trên thiết bị này
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-brand-600/20 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang đăng nhập...
                  </span>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </div>
          </form>

          {/* Social Logins */}
          <SocialAuthButtons
            layout="full"
            onSuccess={handleLoginSuccess}
            onError={(err) => setServerError(err)}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
