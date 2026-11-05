import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800/80 relative overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-blue-600/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Newsletter Card */}
        <div className="mb-14 p-6 sm:p-8 rounded-3.5xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-blue-950/60 border border-slate-800/80 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 font-semibold text-xs mb-3">
              <span>⭐</span>
              <span>ĐẶC QUYỀN MADK REWARDS</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Nhận voucher 200.000₫ và thông tin sản phẩm mới
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Đăng ký nhận bản tin để đón đầu xu hướng công nghệ 3D, ưu đãi độc quyền dành riêng cho thành viên hội viên.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            {subscribed ? (
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold animate-fade-in">
                <span>✓</span>
                <span>Cảm ơn bạn! Mã voucher đã được gửi vào hòm thư.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full sm:w-80 px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/30 hover:scale-102 flex-shrink-0"
                >
                  Đăng ký ngay
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Shop Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/30">
                M
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                MadK<span className="text-gradient-sapphire font-black">Store</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Hệ sinh thái thiết bị công nghệ chính hãng hàng đầu với trải nghiệm tương tác mô hình 3D trực quan xoay 360°. Tận hưởng mua sắm thông minh, giao hàng hỏa tốc và tích lũy điểm thưởng không giới hạn.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hệ thống trực tuyến 24/7
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
                🛡️ 100% Chính hãng
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-amber-300">
                ⭐ MadK Rewards
              </span>
            </div>
          </div>

          {/* Catalog shortcuts */}
          <div>
            <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
              <span>Danh mục sản phẩm</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/categories/dien-thoai" className="hover:text-blue-400 transition-colors">
                  Điện thoại & Tablet
                </Link>
              </li>
              <li>
                <Link to="/categories/laptop" className="hover:text-blue-400 transition-colors">
                  Laptop & Máy tính
                </Link>
              </li>
              <li>
                <Link to="/categories/phu-kien" className="hover:text-blue-400 transition-colors">
                  Gaming Gear & Phụ kiện
                </Link>
              </li>
              <li>
                <Link to="/categories/linh-kien" className="hover:text-blue-400 transition-colors">
                  Linh kiện PC & VGA
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1">
                  <span>Tất cả sản phẩm</span>
                  <span>&rarr;</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer policies */}
          <div>
            <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-4">
              Chính sách & Hỗ trợ
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/policies/warranty" className="hover:text-slate-200 transition-colors">
                  Chính sách bảo hành 12-24 tháng
                </Link>
              </li>
              <li>
                <Link to="/policies/returns" className="hover:text-slate-200 transition-colors">
                  Chính sách đổi trả trong 7 ngày
                </Link>
              </li>
              <li>
                <Link to="/policies/shipping" className="hover:text-slate-200 transition-colors">
                  Vận chuyển GHN hỏa tốc
                </Link>
              </li>
              <li>
                <Link to="/policies/privacy" className="hover:text-slate-200 transition-colors">
                  Bảo mật thông tin khách hàng
                </Link>
              </li>
              <li>
                <Link to="/account?tab=loyalty" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                  Chương trình MadK Rewards &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact, Delivery & Payments */}
          <div>
            <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-4">
              Thanh toán & Vận chuyển
            </h4>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1.5">
                  Đối tác giao hàng:
                </span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-950/40 border border-orange-500/30 text-orange-300 rounded-xl font-bold text-xs">
                  <span>🚚</span>
                  <span>Giao Hàng Nhanh (GHN)</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1.5">
                  Phương thức thanh toán:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 bg-pink-950/60 text-pink-300 rounded-lg text-[11px] font-bold border border-pink-500/30 flex items-center gap-1">
                    <span>📱</span>
                    <span>Ví MoMo / QR</span>
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg text-[11px] font-bold border border-slate-700">
                    💵 COD
                  </span>
                  <span className="px-2.5 py-1 bg-blue-950/60 text-blue-300 rounded-lg text-[11px] font-bold border border-blue-500/30">
                    ⭐ Đổi điểm thưởng
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 text-xs">
                <p className="text-slate-400">
                  Hotline hỗ trợ: <a href="tel:19008888" className="text-blue-400 font-bold hover:underline font-mono">1900 8888</a>
                </p>
                <p className="text-slate-400 mt-1">
                  Email: <span className="text-slate-300 font-mono">support@madkstore.vn</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & tech stack */}
        <div className="mt-14 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} MadK Store. Bản quyền thiết kế thương mại thuộc về MadK.</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              ASP.NET Core 8 Clean Architecture
            </span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              React 18 & Three.js 3D
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
