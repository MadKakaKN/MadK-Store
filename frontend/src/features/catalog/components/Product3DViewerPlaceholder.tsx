import React from 'react';

interface Product3DViewerPlaceholderProps {
  model3DUrl?: string;
  productName: string;
}

export const Product3DViewerPlaceholder: React.FC<Product3DViewerPlaceholderProps> = ({
  model3DUrl,
  productName,
}) => {
  return (
    <div
      id="product-3d-viewer-container"
      className="relative aspect-square sm:aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center select-none"
    >
      {/* Background 3D grid lines effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Floating 3D Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          Three.js 3D Canvas
        </span>
        {model3DUrl && (
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono">
            GLB Ready
          </span>
        )}
      </div>

      {/* Center 3D Graphic Icon & Animation */}
      <div className="relative z-10 max-w-sm space-y-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/10 group cursor-pointer hover:scale-105 transition-transform duration-300">
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>

        <div>
          <h4 className="text-base sm:text-lg font-extrabold text-white">
            Trình xem mô hình 3D tương tác
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
            {model3DUrl ? (
              <>
                Mô hình 3D cho <strong className="text-indigo-300">{productName}</strong> đã được nạp sẵn.
                Tính năng xoay 360°, zoom chi tiết và tùy biến màu sắc bằng Three.js WebGL sẽ kích hoạt ở Giai đoạn 2.
              </>
            ) : (
              'Sản phẩm này hiện tại chỉ hỗ trợ hình ảnh thực tế 2D tiêu chuẩn.'
            )}
          </p>
        </div>

        {model3DUrl && (
          <div className="pt-2">
            <span className="inline-block px-3 py-1 text-[11px] font-mono text-slate-400 bg-slate-900/80 rounded-lg border border-slate-800 truncate max-w-xs">
              {model3DUrl}
            </span>
          </div>
        )}
      </div>

      {/* Placeholder interactive toolbar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
            Chuột trái
          </kbd>
          Xoay 360°
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
            Con lăn
          </kbd>
          Phóng to / Thu nhỏ
        </span>
      </div>
    </div>
  );
};

export default Product3DViewerPlaceholder;
