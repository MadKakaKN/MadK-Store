import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tokenStorage } from '../../../api/authApi';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

const STAFF_ROLES = ['Admin', 'Sales', 'Warehouse'];

export const LoginPage: React.FC = () => {
  const { login, logout } = useAuth();
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
  const [isStaffAttempt, setIsStaffAttempt] = useState(false);

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

  const handleLoginSuccess = async () => {
    const currentUser = tokenStorage.getUser();
    const userRoles = currentUser?.roles || [];
    const isStaff = userRoles.some((r) => STAFF_ROLES.includes(r));

    if (isStaff) {
      // Reject staff credentials on customer storefront portal
      await logout();
      setIsStaffAttempt(true);
      setServerError(
        'Đây là tài khoản cán bộ / nhân viên nội bộ (Admin, Sales hoặc Warehouse). Vì lý do an toàn bảo mật, cổng khách hàng không tiếp nhận tài khoản nội bộ.'
      );
      return;
    }

    const safeRedirect =
      explicitRedirect && !explicitRedirect.startsWith('/auth') && !explicitRedirect.startsWith('/admin')
        ? explicitRedirect
        : '/';

    // Hard navigation guarantees fresh session & avoids React Router race conditions
    window.location.href = safeRedirect;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsStaffAttempt(false);

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (result.success) {
      await handleLoginSuccess();
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
    <div className="min-h-[75vh] flex flex-col justify-center py-10 px-4 bg-[#F3F4F6]">
      <div className="w-full max-w-[420px] mx-auto bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8">
        {/* Top Flat Border Tabs */}
        <div className="flex border-b border-[#E5E7EB] mb-6">
          <button
            type="button"
            className="flex-1 pb-3 text-sm font-semibold text-[#1D4ED8] border-b-2 border-[#1D4ED8] text-center"
          >
            Đăng nhập
          </button>
          <Link
            to={`/auth/register${explicitRedirect ? `?redirect=${encodeURIComponent(explicitRedirect)}` : ''}`}
            className="flex-1 pb-3 text-sm font-semibold text-gray-500 hover:text-gray-800 border-b-2 border-transparent text-center transition-colors"
          >
            Đăng ký
          </Link>
        </div>

        {/* Quick Demo Fill Helper */}
        <div className="mb-4 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
          <span className="text-gray-600">Tài khoản thử nghiệm:</span>
          <button
            type="button"
            onClick={() => {
              handleFillDemo('customer@madkstore.vn', 'CustomerPassword123!');
              setIsStaffAttempt(false);
            }}
            className="font-semibold text-[#1D4ED8] hover:underline"
          >
            Điền nhanh mẫu &rarr;
          </button>
        </div>

        {/* Social Auth Buttons */}
        <div className="mb-4">
          <SocialAuthButtons />
        </div>

        {/* Divider */}
        <div className="relative py-2 flex items-center justify-center mb-4">
          <div className="w-full border-t border-[#E5E7EB]"></div>
          <span className="bg-white px-2.5 text-xs text-gray-400 absolute">
            hoặc đăng nhập bằng email
          </span>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600 flex-shrink-0">warning</span>
            <div className="flex-1">
              <p className="font-semibold">{isStaffAttempt ? 'Khu vực dành cho Khách hàng' : 'Đăng nhập thất bại'}</p>
              <p className="mt-0.5 leading-relaxed">{serverError}</p>
              {isStaffAttempt && (
                <div className="mt-2">
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center gap-1 text-[#1D4ED8] font-semibold hover:underline"
                  >
                    Chuyển sang Cổng Quản Trị &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
              Email hoặc Số điện thoại <span className="text-[#D70018]">*</span>
            </label>
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
              className={`w-full h-10 px-3 text-sm bg-white border rounded-lg focus:border-[#1D4ED8] focus:ring-0 outline-none transition-colors ${
                errors.email ? 'border-rose-400 text-rose-900' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
              Mật khẩu <span className="text-[#D70018]">*</span>
            </label>
            <div className="relative">
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
                className={`w-full h-10 pl-3 pr-10 text-sm bg-white border rounded-lg focus:border-[#1D4ED8] focus:ring-0 outline-none transition-colors ${
                  errors.password ? 'border-rose-400 text-rose-900' : 'border-[#E5E7EB]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
          </div>

          {/* Remember me & forgot password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-0 border-gray-300"
              />
              <span className="text-xs text-gray-600">Ghi nhớ đăng nhập</span>
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-[#1D4ED8] hover:underline font-medium"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>

          <p className="text-center text-xs text-gray-500 pt-2">
            Chưa có tài khoản?{' '}
            <Link
              to={`/auth/register${explicitRedirect ? `?redirect=${encodeURIComponent(explicitRedirect)}` : ''}`}
              className="text-[#1D4ED8] font-semibold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
