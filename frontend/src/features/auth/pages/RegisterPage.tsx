import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');
  const redirectUrl = explicitRedirect || '/';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Validation & Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (phoneNumber.trim() && !/^[0-9]{9,11}$/.test(phoneNumber.trim().replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ (9-11 chữ số).';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = 'Bạn cần đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      password,
    });
    setIsSubmitting(false);

    if (result.success) {
      setRegistrationSuccess(result.message || 'Đăng ký tài khoản thành công!');
    } else {
      setServerError(result.error || 'Đăng ký không thành công.');
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-4 shadow-sm shadow-emerald-600/20">
              ✉️
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Đăng ký thành công!</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Chúng tôi đã gửi thư kích hoạt tài khoản đến địa chỉ{' '}
              <strong className="text-slate-900">{email}</strong>.
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs text-left">
              💡 <strong>Lưu ý:</strong> Trong môi trường phát triển (Dev), mã token xác thực đã được ghi lại trong Console/Log hệ thống backend.
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                className="flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors text-center"
              >
                Nhập mã xác thực
              </Link>
              <button
                type="button"
                onClick={() => navigate(redirectUrl, { replace: true })}
                className="flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
              >
                Vào tài khoản ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-10 px-4 bg-[#F3F4F6]">
      <div className="w-full max-w-[420px] mx-auto bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8">
        {/* Top Flat Border Tabs */}
        <div className="flex border-b border-[#E5E7EB] mb-6">
          <Link
            to={`/auth/login${explicitRedirect ? `?redirect=${encodeURIComponent(explicitRedirect)}` : ''}`}
            className="flex-1 pb-3 text-sm font-semibold text-gray-500 hover:text-gray-800 border-b-2 border-transparent text-center transition-colors"
          >
            Đăng nhập
          </Link>
          <button
            type="button"
            className="flex-1 pb-3 text-sm font-semibold text-[#1D4ED8] border-b-2 border-[#1D4ED8] text-center"
          >
            Đăng ký
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
            hoặc đăng ký bằng email
          </span>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600 flex-shrink-0">warning</span>
            <div className="flex-1">
              <p className="font-semibold">Đăng ký không thành công</p>
              <p className="mt-0.5 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 mb-1">
              Họ và tên <span className="text-[#D70018]">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              placeholder="Nguyễn Văn A"
              className={`w-full h-10 px-3 text-sm bg-white border rounded-lg focus:border-[#1D4ED8] focus:ring-0 outline-none transition-colors ${
                errors.fullName ? 'border-rose-400 text-rose-900' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
              Địa chỉ Email <span className="text-[#D70018]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="vidu@madkstore.vn"
              className={`w-full h-10 px-3 text-sm bg-white border rounded-lg focus:border-[#1D4ED8] focus:ring-0 outline-none transition-colors ${
                errors.email ? 'border-rose-400 text-rose-900' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phoneNumber" className="block text-xs font-semibold text-gray-700 mb-1">
              Số điện thoại <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              placeholder="0912 345 678"
              className="w-full h-10 px-3 text-sm bg-white border border-[#E5E7EB] rounded-lg focus:border-[#1D4ED8] focus:ring-0 outline-none transition-colors"
            />
            {errors.phoneNumber && <p className="mt-1 text-xs text-rose-600">{errors.phoneNumber}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
              Mật khẩu <span className="text-[#D70018]">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="Tối thiểu 6 ký tự"
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1">
              Xác nhận mật khẩu <span className="text-[#D70018]">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder="Nhập lại mật khẩu"
              className={`w-full h-10 px-3 text-sm bg-white border rounded-lg focus:border-[#1D4ED8] focus:ring-0 outline-none transition-colors ${
                errors.confirmPassword ? 'border-rose-400 text-rose-900' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>}
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-[#1D4ED8] focus:ring-0 border-gray-300"
            />
            <span className="text-xs text-gray-600">
              Tôi đồng ý với <a href="#" className="text-[#1D4ED8] hover:underline">Điều khoản dịch vụ</a> và{' '}
              <a href="#" className="text-[#1D4ED8] hover:underline">Chính sách bảo mật</a>
            </span>
          </label>
          {errors.acceptTerms && <p className="text-xs text-rose-600">{errors.acceptTerms}</p>}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
          </button>

          <p className="text-center text-xs text-gray-500 pt-2">
            Đã có tài khoản?{' '}
            <Link
              to={`/auth/login${explicitRedirect ? `?redirect=${encodeURIComponent(explicitRedirect)}` : ''}`}
              className="text-[#1D4ED8] font-semibold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
