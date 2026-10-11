import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

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
                className="flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-colors text-center"
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
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
              M
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tạo tài khoản mới</h1>
          <p className="mt-2 text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <Link
              to={`/auth/login${redirectUrl !== '/account' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-bold text-brand-600 hover:text-brand-500 hover:underline"
            >
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm flex items-start gap-3 animate-shake">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Đăng ký thất bại</p>
                <p className="text-xs text-rose-700 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Họ và tên <span className="text-rose-500">*</span>
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
                className={`mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                  errors.fullName
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.fullName && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.fullName}</p>}
            </div>

            {/* Email & Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Địa chỉ Email <span className="text-rose-500">*</span>
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
                  className={`mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                    errors.email
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Số điện thoại <span className="text-slate-400 font-normal lowercase">(tùy chọn)</span>
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
                  placeholder="0912345678"
                  className={`mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                    errors.phoneNumber
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                  }`}
                />
                {errors.phoneNumber && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* Password & Confirm Password grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5 relative">
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
                    className={`w-full pl-4 pr-10 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                      errors.password
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
                {errors.password && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Xác nhận mật khẩu <span className="text-rose-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Nhập lại mật khẩu"
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
            </div>

            {/* Accept Terms */}
            <div className="pt-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.acceptTerms) setErrors((prev) => ({ ...prev, acceptTerms: '' }));
                  }}
                  className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-xs text-slate-600">
                  Tôi đồng ý với{' '}
                  <span className="text-brand-600 font-medium underline">Điều khoản dịch vụ</span> và{' '}
                  <span className="text-brand-600 font-medium underline">Chính sách bảo mật</span> của MadK Store.
                </span>
              </label>
              {errors.acceptTerms && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.acceptTerms}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-brand-600/20 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  'Đăng ký tài khoản'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
