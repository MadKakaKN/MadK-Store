import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Shop Brand & Mission */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                M
              </span>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                MadK<span className="text-brand-500">Store</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              Hệ sinh thái mua sắm công nghệ hiện đại. Cung cấp điện thoại thông minh, máy tính xách
              tay, gaming gear và linh kiện PC chính hãng với mô hình 3D tương tác đa chiều.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hệ thống trực tuyến 24/7
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
                🛡️ Cam kết 100% Chính hãng
              </span>
            </div>
          </div>

          {/* Catalog shortcuts */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Danh mục sản phẩm
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/categories/dien-thoai" className="hover:text-brand-400 transition-colors">
                  Điện thoại & Tablet
                </Link>
              </li>
              <li>
                <Link to="/categories/laptop" className="hover:text-brand-400 transition-colors">
                  Laptop & Máy tính
                </Link>
              </li>
              <li>
                <Link to="/categories/phu-kien" className="hover:text-brand-400 transition-colors">
                  Gaming Gear & Phụ kiện
                </Link>
              </li>
              <li>
                <Link to="/categories/linh-kien" className="hover:text-brand-400 transition-colors">
                  Linh kiện PC & VGA
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                  Tất cả sản phẩm &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer policies */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Chính sách & Hỗ trợ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="hover:text-slate-200 cursor-pointer">Chính sách bảo hành 12-24 tháng</li>
              <li className="hover:text-slate-200 cursor-pointer">Chính sách đổi trả trong 7 ngày</li>
              <li className="hover:text-slate-200 cursor-pointer">Vận chuyển & Giao nhận hỏa tốc</li>
              <li className="hover:text-slate-200 cursor-pointer">Bảo mật thông tin khách hàng</li>
              <li className="hover:text-slate-200 cursor-pointer">Hướng dẫn mua trả góp 0%</li>
            </ul>
          </div>

          {/* Contact & Payments */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Thanh toán & Liên hệ
            </h4>
            <div className="space-y-3 text-sm">
              <p>
                <strong className="text-slate-200">Hotline:</strong>{' '}
                <a href="tel:19008888" className="hover:text-brand-400 font-mono">1900 8888</a>
              </p>
              <p>
                <strong className="text-slate-200">Email:</strong>{' '}
                <span className="font-mono">support@madkstore.vn</span>
              </p>
              <div className="pt-2">
                <span className="text-xs uppercase font-semibold text-slate-400 block mb-2">
                  Phương thức thanh toán:
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded text-xs font-bold border border-slate-700">
                    💵 COD
                  </span>
                  <span className="px-2.5 py-1 bg-brand-950 text-brand-300 rounded text-xs font-bold border border-brand-800">
                    💳 VNPay
                  </span>
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded text-xs font-bold border border-slate-700">
                    🏦 Chuyển khoản
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} MadK Store. Đã đăng ký bản quyền thương mại.</p>
          <p className="flex items-center gap-4">
            <span>ASP.NET Core 8 Clean Architecture</span>
            <span>&bull;</span>
            <span>React 18 + TypeScript</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
