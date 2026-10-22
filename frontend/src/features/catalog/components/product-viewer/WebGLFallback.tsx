import React from 'react';

interface WebGLFallbackProps {
  imageUrl?: string;
  productName: string;
  reason?: string;
  onSwitchTo2D?: () => void;
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({
  imageUrl,
  productName,
  reason = 'Thiết bị hoặc trình duyệt không hỗ trợ WebGL 3D.',
  onSwitchTo2D,
}) => {
  return (
    <div className="relative aspect-square w-full rounded-3xl bg-slate-100 border border-slate-200 shadow-sm overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={productName}
          className="w-3/4 h-3/4 object-contain object-center opacity-80"
        />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center text-2xl mb-4">
          🖼️
        </div>
      )}

      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-xl mb-3 shadow-lg">
          ⚠️
        </div>
        <h4 className="font-bold text-base text-white">Chế độ 3D tạm dừng</h4>
        <p className="mt-1 text-xs text-slate-300 max-w-xs">{reason}</p>

        {onSwitchTo2D && (
          <button
            type="button"
            onClick={onSwitchTo2D}
            className="mt-4 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow-md transition-colors"
          >
            Xem bộ sưu tập ảnh 2D
          </button>
        )}
      </div>
    </div>
  );
};

export default WebGLFallback;
