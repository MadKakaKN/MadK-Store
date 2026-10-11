import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import authApi from '../../../api/authApi';
import { useAuth } from '../context/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const executeVerify = async (emailToVerify: string, tokenToVerify: string) => {
    if (!emailToVerify.trim() || !tokenToVerify.trim()) {
      setStatus('error');
      setMessage('Vui lòng nhập đầy đủ địa chỉ email và mã xác thực.');
      return;
    }

    setStatus('verifying');
    setMessage('Đang tiến hành xác thực tài khoản của bạn...');

    try {
      const res = await authApi.verifyEmail({
        email: emailToVerify.trim(),
        token: tokenToVerify.trim(),
      });

      if (res.isSuccess) {
        setStatus('success');
        setMessage(res.message || 'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt đầy đủ.');
        refreshUser();
      } else {
        setStatus('error');
        setMessage(res.error || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
      }
    } catch {
      setStatus('error');
      setMessage('Không thể kết nối đến máy chủ để xác thực email.');
    }
  };

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlToken = searchParams.get('token');
    if (urlEmail && urlToken) {
      executeVerify(urlEmail, urlToken);
    }
  }, [searchParams]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerify(email, token);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 sm:px-0">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
            M
          </span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Xác thực Email</h1>
        <p className="mt-2 text-sm text-slate-600">Kích hoạt tài khoản để trải nghiệm toàn bộ tiện ích MadK Store.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 text-center">
          {status === 'verifying' && (
            <div className="py-6">
              <div className="w-16 h-16 mx-auto rounded-3xl border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
              <h3 className="mt-6 text-lg font-bold text-slate-900">Đang xác thực...</h3>
              <p className="mt-2 text-sm text-slate-500">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-4 shadow-sm shadow-emerald-600/20">
                ✅
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Xác thực thành công!</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{message}</p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/account"
                  className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/20 transition-all text-center"
                >
                  Vào trang cá nhân
                </Link>
                <Link
                  to="/"
                  className="w-full py-3 px-4 rounded-2xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors text-center"
                >
                  Khám phá cửa hàng
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 text-left">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-4">
                ⚠️
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 text-center">Xác thực thất bại</h3>
              <p className="mt-2 text-sm text-rose-700 bg-rose-50 p-3 rounded-2xl border border-rose-200 text-center">
                {message}
              </p>

              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500 mb-3 text-center">Thử nhập lại thông tin xác thực:</p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Địa chỉ Email"
                      className="w-full px-4 py-2.5 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Mã token xác thực"
                      className="w-full px-4 py-2.5 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors"
                  >
                    Xác thực lại
                  </button>
                </form>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vidu@madkstore.vn"
                  className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mã token xác thực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Nhập mã token từ email"
                  className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/20 transition-all"
              >
                Kích hoạt tài khoản
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
