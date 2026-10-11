import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authApi from '../../../api/authApi';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Địa chỉ email không đúng định dạng.');
      return;
    }

    setIsSubmitting(true);
    const res = await authApi.forgotPassword({ email: email.trim() });
    setIsSubmitting(false);

    if (res.isSuccess) {
      setSubmittedMessage(
        res.message || 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới bạn.'
      );
    } else {
      setEmailError(res.error || 'Đã xảy ra lỗi khi gửi yêu cầu.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 sm:px-0">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
            M
          </span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quên mật khẩu?</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          Nhập địa chỉ email đăng ký để nhận hướng dẫn và mã đặt lại mật khẩu của bạn.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {submittedMessage ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center text-3xl mb-4">
                📬
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Kiểm tra hộp thư của bạn</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{submittedMessage}</p>

              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs text-left">
                💡 <strong>Dev Tip:</strong> Xem mã token đặt lại mật khẩu trong console log của backend.
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to={`/auth/reset-password?email=${encodeURIComponent(email)}`}
                  className="py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-colors text-center"
                >
                  Tôi đã có mã đặt lại mật khẩu &rarr;
                </Link>
                <Link
                  to="/auth/login"
                  className="py-3 px-4 rounded-2xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors text-center"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Địa chỉ Email tài khoản <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="vidu@madkstore.vn"
                  className={`mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none transition-all ${
                    emailError
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                  }`}
                />
                {emailError && <p className="mt-1.5 text-xs text-rose-600 font-medium">{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-brand-600/20 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang xử lý...
                  </span>
                ) : (
                  'Gửi yêu cầu đặt lại mật khẩu'
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/auth/login"
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  &larr; Nhớ mật khẩu rồi? Đăng nhập ngay
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
