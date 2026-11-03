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
  categorySlug?: string;
  thumbnailUrl?: string;
  selectedVariant?: ProductVariantDto | null;
  onVariantSelect?: (variant: ProductVariantDto) => void;
  onSwitchTo2D?: () => void;
}

export function resolveModel3DUrl(url?: string, productName?: string, categorySlug?: string): string {
  const raw = (url || '').trim();
  const name = (productName || '').toLowerCase();
  const cat = (categorySlug || '').toLowerCase();

  if (raw) {
    if (raw.includes('iphone-15-pro-max.glb') || (raw.includes('models.madkstore.vn') && raw.includes('iphone'))) {
      return '/models/iphone-15-pro-max.glb';
    }
    if (raw.includes('galaxy-s24-ultra.glb') || (raw.includes('models.madkstore.vn') && raw.includes('galaxy'))) {
      return '/models/galaxy-s24-ultra.glb';
    }
    if (raw.includes('macbook-pro-16.glb') || (raw.includes('models.madkstore.vn') && raw.includes('macbook'))) {
      return '/models/macbook-pro-16.glb';
    }
    if (raw.includes('smartwatch.glb') || raw.includes('watch.glb')) {
      return '/models/smartwatch.glb';
    }
    // Handle mock domain replacement
    if (raw.includes('models.madkstore.vn/')) {
      const filename = raw.split('/').pop();
      if (filename) return `/models/${filename}`;
    }
    // If it's a relative path or valid http(s) URL
    if (raw.startsWith('/models/') || raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
  }

  // Smart product-based detection fallback
  if (name.includes('iphone') || name.includes('15 pro max')) {
    return '/models/iphone-15-pro-max.glb';
  }
  if (name.includes('galaxy') || name.includes('s24')) {
    return '/models/galaxy-s24-ultra.glb';
  }
  if (name.includes('macbook')) {
    return '/models/macbook-pro-16.glb';
  }
  if (name.includes('watch') || cat.includes('dong-ho')) {
    return '/models/smartwatch.glb';
  }

  return raw;
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({
  model3DUrl,
  productName,
  categorySlug,
  thumbnailUrl,
  selectedVariant,
  onSwitchTo2D,
}) => {
  const { isSupported, isMobile, maxDpr, reason } = useWebGLSupport();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [activeModelOption, setActiveModelOption] = useState<
    'product' | 'sample_iphone' | 'sample_macbook' | 'sample_watch' | 'sample_keyboard' | 'sample_gadget'
  >('product');
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Automatically sync with selected variant color, or allow user override
  const variantColorInfo = useMemo(() => extractVariantColor(selectedVariant), [selectedVariant]);
  const activeColor = customColor ?? variantColorInfo.hex;

  // Determine actual model URL based on selection
  const effectiveModelUrl = useMemo(() => {
    switch (activeModelOption) {
      case 'sample_iphone':
        return '/models/iphone-15-pro-max.glb';
      case 'sample_macbook':
        return '/models/macbook-pro-16.glb';
      case 'sample_watch':
        return '/models/smartwatch.glb';
      case 'sample_gadget':
        return '/models/sample-gadget.glb';
      case 'sample_keyboard':
        return ''; // Trigger procedural high-detail keyboard
      case 'product':
      default:
        return resolveModel3DUrl(model3DUrl, productName, categorySlug);
    }
  }, [activeModelOption, model3DUrl, productName, categorySlug]);

  const [resolvedSource, setResolvedSource] = useState<'custom_glb' | 'sample_glb' | 'procedural'>(
    effectiveModelUrl ? 'custom_glb' : 'procedural'
  );

  // Pass category override if keyboard demo was selected
  const effectiveCategorySlug = activeModelOption === 'sample_keyboard' ? 'ban-phim-co' : categorySlug;

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
            {resolvedSource === 'custom_glb' ? 'Mô hình Thực tế (GLB)' : 'Mô hình 3D Chuẩn'}
          </span>
        </div>

        {/* Quick Sample Switcher & Guide Button */}
        <div className="flex items-center gap-1.5">
          <select
            value={activeModelOption}
            onChange={(e) => setActiveModelOption(e.target.value as any)}
            className="text-[11px] font-semibold bg-slate-900/90 text-slate-300 border border-slate-700/80 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500 backdrop-blur-md cursor-pointer transition-colors"
          >
            <option value="product">Sản phẩm hiện tại ({productName.split(' ')[0]})</option>
            <option value="sample_iphone">iPhone 15 Pro Max (GLB thực tế)</option>
            <option value="sample_macbook">MacBook Pro 16" (GLB thực tế)</option>
            <option value="sample_watch">Đồng hồ Chronograph (GLB thực tế)</option>
            <option value="sample_gadget">Mô hình mẫu (GLB)</option>
            <option value="sample_keyboard">Bàn phím cơ (3D Procedural)</option>
          </select>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            title="Hướng dẫn tiêu chuẩn file 3D GLB"
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center text-xs font-bold backdrop-blur-md transition-colors"
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
          categorySlug={effectiveCategorySlug}
          productName={productName}
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

          <div className="flex items-center gap-2 pr-1">
            {PRESET_3D_PALETTE.map((c) => {
              const isSelected = activeColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCustomColor(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    isSelected ? 'scale-125 border-white shadow-md' : 'border-slate-700 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
        </div>

        {/* Interaction hints */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              {isMobile ? 'Chạm vuốt' : 'Chuột trái'}
            </kbd>
            Xoay 360°
          </span>

          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              Chuột phải
            </kbd>
            Di chuyển
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

              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                <strong className="text-white text-xs block">2. Đặt tên Mesh để đổi màu tự động:</strong>
                <p>
                  Đặt tên cho các phần tử chính là <strong>Body</strong>, <strong>Case</strong>, <strong>Frame</strong>, hoặc <strong>Chassis</strong> trong Blender/Maya. Hệ thống sẽ tự động bắt và phủ màu theo biến thể bạn chọn!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                <strong className="text-white text-xs block">3. Nơi lưu trữ file:</strong>
                <p>
                  Đặt file vào thư mục <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">public/models/ten-san-pham.glb</code>, sau đó cập nhật cột <strong>Model3DUrl</strong> trong Admin hoặc Database.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs transition-colors shadow-lg shadow-indigo-600/30"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product3DViewer;
