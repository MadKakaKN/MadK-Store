import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';

const STAFF_ROLES = ['Admin', 'Sales', 'Warehouse'];

export const AdminLoginPage: React.FC = () => {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email công vụ và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({ email: email.trim(), password });
      if (!res.success) {
        setError(res.error || 'Email hoặc mật khẩu không chính xác.');
        setIsSubmitting(false);
        return;
      }

      // Read updated user from local storage or context
      const uJson = localStorage.getItem('auth_user');
      const authUser = uJson ? JSON.parse(uJson) : user;
      const userRoles: string[] = authUser?.roles || [];

      const isStaff = userRoles.some((r) => STAFF_ROLES.includes(r));

      if (!isStaff) {
        // Reject customer accounts trying to enter admin portal
        await logout();
        setError(
          'Truy cập bị từ chối: Tài khoản của bạn không có vai trò nhân viên (Admin, Sales hoặc Warehouse) để truy cập cổng nội bộ.'
        );
        setIsSubmitting(false);
        return;
      }

      // Successful staff login -> redirect to admin dashboard
      navigate(redirectUrl, { replace: true });
    } catch {
      setError('Lỗi kết nối máy chủ xác thực. Vui lòng kiểm tra lại mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle tech grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b1a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b1a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-600/30 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-2xl tracking-tight text-white leading-none">
                MadK<span className="text-gradient-sapphire font-black">Admin</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mt-1">
                ENTERPRISE PORTAL
              </span>
            </div>
          </Link>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Cổng Quản Trị & Vận Hành Nội Bộ
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            Dành riêng cho Quản trị viên, Nhân viên kinh doanh và Thủ kho
          </p>
        </div>

        {/* Login Box */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="backdrop-blur-2xl bg-slate-900/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3.5xl border border-slate-800/90 relative">
            {/* Top Security Banner */}
            <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SSL 256-Bit Encrypted
              </span>
              <span className="text-slate-500 font-mono">Port 5000 API</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2.5 animate-fade-in">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Email công vụ / nội bộ
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="admin@madkstore.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    ✉️
                  </span>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Mật khẩu tài khoản
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-semibold"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/30 hover:scale-101 active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác thực bảo mật...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập Quản Trị</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </form>

            {/* Default credentials note for review / testing */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
              <p className="font-bold text-slate-300">🔑 Tài khoản nội bộ dùng thử:</p>
              <p>• Admin: <code className="text-blue-300 font-mono">admin@madkstore.vn</code> / <code className="text-slate-300 font-mono">Admin@123456</code></p>
              <p>• Sales: <code className="text-blue-300 font-mono">sales@madkstore.vn</code> / <code className="text-slate-300 font-mono">Sales@123456</code></p>
            </div>

            {/* Return to Customer Storefront */}
            <div className="mt-6 text-center text-xs text-slate-400">
              <span>Bạn là khách hàng mua sắm? </span>
              <Link to="/auth/login" className="text-blue-400 font-bold hover:underline">
                Đăng nhập tại đây
              </Link>
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-8 text-center text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
          Cảnh báo an ninh: Mọi hoạt động đăng nhập trái phép vào cổng quản trị nội bộ đều được tự động lưu lại vào hệ thống Audit Log kèm địa chỉ IP và thiết bị.
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
