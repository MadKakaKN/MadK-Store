import React from 'react';
import { Link } from 'react-router-dom';

export const CartPage: React.FC = () => {
  return (
    <div className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-8 gap-2">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>&rsaquo;</span>
        <span className="font-semibold text-slate-900">Giỏ hàng</span>
      </nav>

      {/* Empty Cart Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-sm text-center space-y-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
          <svg
            className="w-12 h-12 sm:w-14 sm:h-14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Giỏ hàng của bạn đang trống
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            Chưa có sản phẩm nào được thêm vào giỏ. Hãy dạo quanh cửa hàng để tìm kiếm những thiết bị
            công nghệ và phụ kiện ưng ý nhất!
          </p>
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            to="/categories"
            className="inline-flex items-center px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Khám phá sản phẩm ngay &rarr;
          </Link>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base transition-colors"
          >
            Về trang chủ
          </Link>
        </div>

        {/* Benefits strip */}
        <div className="pt-10 mt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">🚚</span>
            <span>Giao hàng toàn quốc</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">🛡️</span>
            <span>Thanh toán an toàn COD/VNPay</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">🔄</span>
            <span>Đổi trả thuận tiện 7 ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
