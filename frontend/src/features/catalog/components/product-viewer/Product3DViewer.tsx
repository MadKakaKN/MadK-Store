import React, { useState, useRef, useMemo } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ProductVariantDto } from '../../../../types/catalog';
import { useWebGLSupport } from './useWebGLSupport';
import { extractVariantColor, PRESET_3D_PALETTE } from './colorUtils';
import ModelCanvas from './ModelCanvas';
import WebGLFallback from './WebGLFallback';

export interface Product3DViewerProps {
  model3DUrl?: string;
  productName: string;
  thumbnailUrl?: string;
  selectedVariant?: ProductVariantDto | null;
  onVariantSelect?: (variant: ProductVariantDto) => void;
  onSwitchTo2D?: () => void;
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({
  model3DUrl,
  productName,
  thumbnailUrl,
  selectedVariant,
  onSwitchTo2D,
}) => {
  const { isSupported, isMobile, maxDpr, reason } = useWebGLSupport();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [activeModelOption, setActiveModelOption] = useState<'product' | 'sample_keyboard' | 'sample_gadget'>('product');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [resolvedSource, setResolvedSource] = useState<'custom_glb' | 'sample_glb' | 'procedural'>(
    model3DUrl ? 'custom_glb' : 'procedural'
  );

  // Automatically sync with selected variant color, or allow user override
  const variantColorInfo = useMemo(() => extractVariantColor(selectedVariant), [selectedVariant]);
  const activeColor = customColor ?? variantColorInfo.hex;

  // Determine actual model URL based on selection
  const effectiveModelUrl = useMemo(() => {
    if (activeModelOption === 'sample_keyboard') {
      return ''; // Trigger procedural high-detail keyboard
    }
    if (activeModelOption === 'sample_gadget') {
      return '/models/sample-gadget.glb';
    }
    // 'product'
    if (model3DUrl && model3DUrl.trim().length > 0) {
      return model3DUrl;
    }
    return ''; // Fallback to procedural model
  }, [activeModelOption, model3DUrl]);

  // Reset camera view
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!isSupported) {
    return (
      <WebGLFallback
        imageUrl={thumbnailUrl}
        productName={productName}
        reason={reason}
        onSwitchTo2D={onSwitchTo2D}
      />
    );
  }

  return (
    <div
      id="product-3d-viewer-container"
      className="relative aspect-square sm:aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none"
    >
      {/* Background 3D Grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* ──── Top Overlay Bar: Badges & Model Source Toggle ──── */}
      <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Three.js 3D View
          </span>

          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-mono">
            {resolvedSource === 'custom_glb' ? 'GLB Custom' : '3D Tech Demo'}
          </span>
        </div>

        {/* Quick Sample Switcher & Guide Button */}
        <div className="flex items-center gap-1.5">
          <select
            value={activeModelOption}
            onChange={(e) => setActiveModelOption(e.target.value as 'product' | 'sample_keyboard' | 'sample_gadget')}
            className="text-[11px] font-semibold bg-slate-900/90 text-slate-300 border border-slate-700/80 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500 backdrop-blur-md cursor-pointer transition-colors"
          >
            <option value="product">
              {model3DUrl ? 'Model sản phẩm (GLB)' : 'Model mặc định'}
            </option>
            <option value="sample_keyboard">Mẫu Bàn phím cơ (3D)</option>
            <option value="sample_gadget">Mẫu Duck Gadget (GLB)</option>
          </select>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            title="Hướng dẫn thêm model 3D mới"
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-all shadow-md"
          >
            ?
          </button>
        </div>
      </div>

      {/* ──── Middle: 3D WebGL Canvas Viewport ──── */}
      <div className="absolute inset-0 z-0">
        <ModelCanvas
          modelUrl={effectiveModelUrl}
          variantColor={activeColor}
          wireframe={wireframe}
          autoRotate={autoRotate}
          maxDpr={maxDpr}
          controlsRef={controlsRef}
          onModelSourceChange={setResolvedSource}
        />
      </div>

      {/* ──── Floating Floating Action Overlay (Right Side) ──── */}
      <div className="relative z-10 self-end flex flex-col gap-2">
        {/* Toggle Auto-rotate */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Tắt tự động xoay' : 'Bật tự động xoay'}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold backdrop-blur-md border transition-all shadow-lg ${
            autoRotate
              ? 'bg-indigo-600/80 text-white border-indigo-400'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          🔄
        </button>

        {/* Reset Camera Angle */}
        <button
          type="button"
          onClick={handleResetCamera}
          title="Đặt lại góc nhìn chính diện"
          className="w-9 h-9 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-sm font-bold backdrop-blur-md transition-all shadow-lg"
        >
          🎯
        </button>

        {/* Toggle Wireframe */}
        <button
          type="button"
          onClick={() => setWireframe(!wireframe)}
          title={wireframe ? 'Tắt khung dây' : 'Bật khung dây Wireframe'}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-mono font-bold backdrop-blur-md border transition-all shadow-lg ${
            wireframe
              ? 'bg-purple-600/80 text-white border-purple-400'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          🔲
        </button>
      </div>

      {/* ──── Bottom Controls: Color Palette & Interaction Guide ──── */}
      <div className="relative z-10 space-y-2.5">
        {/* Dynamic Color Palette Bar */}
        <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl overflow-x-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 pl-1">
            <span>Màu:</span>
            <span className="text-white font-bold">{customColor ? 'Tùy chỉnh' : variantColorInfo.name}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {PRESET_3D_PALETTE.map((c) => {
              const isSelected = activeColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCustomColor(c.hex)}
                  title={`Xem màu ${c.name}`}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'scale-125 border-indigo-400 ring-2 ring-indigo-500/50 shadow-md'
                      : 'border-slate-600 hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}

            {customColor && (
              <button
                type="button"
                onClick={() => setCustomColor(null)}
                title="Khôi phục theo biến thể đang chọn"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded bg-indigo-950/60 border border-indigo-800/60"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Interaction Hints Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              {isMobile ? '1 ngón' : 'Chuột trái'}
            </kbd>
            Xoay 360°
          </span>

          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              {isMobile ? '2 ngón' : 'Con lăn'}
            </kbd>
            Zoom
          </span>

          {onSwitchTo2D && (
            <button
              type="button"
              onClick={onSwitchTo2D}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Xem ảnh 2D
            </button>
          )}
        </div>
      </div>

      {/* ──── Guide Modal: How to add new GLB models ──── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="font-extrabold text-white text-base">Hướng dẫn thêm Model 3D (GLB)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 max-h-96 overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-1">
                <strong className="text-indigo-300 text-xs block">1. Định dạng & Tiêu chuẩn khuyến nghị:</strong>
                <p>
                  - Định dạng: <strong>.glb</strong> (glTF Binary đóng gói sẵn mesh, materials, textures).
                  <br />
                  - Dung lượng: Dưới <strong>2MB - 5MB</strong> cho trải nghiệm tải mượt trên mobile.
                  <br />
                  - Texture: Kích thước tối đa <strong>1024x1024</strong> hoặc <strong>2048x2048</strong> định dạng WebP/PNG.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <strong className="text-white text-xs block">2. Nén tối ưu hóa bằng Draco / gltf-transform:</strong>
                <p className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-2 rounded-lg">
                  npx @gltf-transform/cli optimize input.glb output.glb --draco --texture-compress webp
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <strong className="text-white text-xs block">3. Nơi đặt file model trong dự án:</strong>
                <p>
                  - <strong>Môi trường Local/Frontend:</strong> Lưu vào thư mục <code className="text-amber-300">frontend/public/models/ten-san-pham.glb</code>, sau đó cấu hình URL là <code className="text-amber-300">/models/ten-san-pham.glb</code>.
                  <br />
                  - <strong>Môi trường Production/CDN:</strong> Upload qua trang Quản trị Admin Catalog hoặc đẩy lên S3 / MinIO (<code className="text-amber-300">https://cdn.madkstore.vn/...</code>).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <strong className="text-white text-xs block">4. Gắn vào sản phẩm:</strong>
                <p>
                  Điền đường dẫn model vào trường <code className="text-indigo-300">Model3DUrl</code> trong trang <strong>Admin Quản trị Sản phẩm</strong> (hoặc Database column <code>model3d_url</code> trong bảng Products).
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product3DViewer;
