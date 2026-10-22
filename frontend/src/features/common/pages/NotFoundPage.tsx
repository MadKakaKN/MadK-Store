import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';

const NotFound3DCanvas = React.lazy(() => import('../components/NotFound3DCanvas'));

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
      {/* 3D Highlight Viewport with 2D Fallback */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto mb-4 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="w-24 h-24 rounded-3xl bg-slate-100 flex flex-col items-center justify-center border border-slate-200 shadow-inner">
              <span className="text-4xl select-none animate-pulse">🧭</span>
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mt-2" />
            </div>
          }
        >
          <NotFound3DCanvas />
        </Suspense>
      </div>

      {/* HTML Typography & Content (outside 3D Canvas) */}
      <div className="max-w-md mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider">
          <span>⚠️</span> Mã lỗi 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Lạc vào không gian số rồi!
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại, đã hết hạn hoặc đã được MadK Store di dời sang địa chỉ mới.
        </p>
      </div>

      {/* HTML Navigation CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
        >
          Quay về trang chủ
        </Link>
        <Link
          to="/categories"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors text-center"
        >
          Khám phá sản phẩm &rarr;
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
