import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { formatVND } from '../../utils/format';

export const CompareFloatingBar: React.FC = () => {
  const { items, removeFromCompare, clearCompare, maxItems } = useCompare();
  const location = useLocation();

  // Ẩn thanh so sánh nếu đang ở chính trang /compare hoặc không có sản phẩm nào
  if (items.length === 0 || location.pathname === '/compare') {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 text-white rounded-2xl p-3 md:p-4 shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Header / Info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-100">So sánh sản phẩm</h4>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {items.length}/{maxItems}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {items.length < 2
                ? 'Chọn thêm ít nhất 1 sản phẩm để so sánh thông số'
                : 'Sẵn sàng so sánh thông số chi tiết'}
            </p>
          </div>
        </div>

        {/* Selected Products Preview */}
        <div className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto py-1 scrollbar-none justify-start md:justify-center">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1.5 pr-2.5 shrink-0 max-w-[180px] hover:border-cyan-500/50 transition-colors"
            >
              <img
                src={item.thumbnailUrl || `/images/products/${item.slug}.png`}
                alt={item.name}
                className="w-10 h-10 object-contain bg-slate-950/60 rounded-lg p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/products/placeholder.png';
                }}
              />
              <div className="overflow-hidden text-left">
                <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                <p className="text-[11px] font-semibold text-cyan-400">
                  {formatVND(item.minPrice || item.basePrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFromCompare(item.id)}
                title="Xóa khỏi so sánh"
                className="w-5 h-5 rounded-full bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors shrink-0"
              >
                ×
              </button>
            </div>
          ))}

          {/* Empty slot indicators */}
          {Array.from({ length: maxItems - items.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="hidden lg:flex items-center justify-center w-28 h-12 rounded-xl border border-dashed border-slate-700/80 text-slate-500 text-xs shrink-0 select-none"
            >
              + Trống
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={clearCompare}
            className="px-3 py-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            Xóa hết
          </button>
          <Link
            to="/compare"
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs md:text-sm shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <span>So sánh ngay</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareFloatingBar;
