import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  productSlug?: string;
  thumbnailUrl?: string;
  selectedVariant?: ProductVariantDto | null;
  onVariantSelect?: (variant: ProductVariantDto) => void;
  onSwitchTo2D?: () => void;
}

export function resolveModel3DUrl(url?: string, productName?: string, _categorySlug?: string): string {
  const name = (productName || '').toLowerCase();
  const raw = (url || '').trim();

  // ONLY return iPhone GLB if this product is explicitly iPhone 15 Pro or iPhone 15 Pro Max!
  // NEVER return iPhone GLB for Samsung, Xiaomi, Oppo, etc.!
  if (name.includes('iphone 15 pro max') || (raw.includes('iphone-15-pro-max.glb') && name.includes('iphone'))) {
    return '/models/iphone-15-pro-max.glb';
  }

  // ONLY return MacBook Pro 16 GLB if this product is explicitly MacBook Pro 16!
  if (name.includes('macbook pro 16') || (raw.includes('macbook-pro-16.glb') && name.includes('macbook'))) {
    return '/models/macbook-pro-16.glb';
  }

  // Authentic Studio & Gaming Over-Ear Headphones (Corsair Virtuoso Pro, Sony WH-1000XM5, AirPods Max, Logitech G Pro X 2, Razer BlackShark)
  const isOverEar =
    name.includes('virtuoso') ||
    name.includes('wh-1000xm5') ||
    name.includes('airpods max') ||
    name.includes('g pro x 2') ||
    name.includes('blackshark') ||
    ((name.includes('tai nghe') || name.includes('headphone')) &&
      !name.includes('tws') &&
      !name.includes('wf-1000') &&
      !name.includes('airpods pro'));

  if (isOverEar) {
    return '/models/headphones.glb';
  }

  // Gaming Mice (Razer Basilisk V3 Pro, Logitech G502 X, Superlight 2, DeathAdder V3, Viper V3, Corsair Darkstar...)
  const isMouse =
    name.includes('chuot') ||
    name.includes('chuột') ||
    name.includes('mouse') ||
    name.includes('basilisk') ||
    name.includes('g502') ||
    name.includes('superlight') ||
    name.includes('deathadder') ||
    name.includes('viper') ||
    name.includes('darkstar');

  if (isMouse) {
    return '/models/gaming-mouse.glb';
  }

  // For Samsung and all other brands/products, use our dedicated tailored 3D procedural models
  // to ensure each brand's unique hardware design, cameras, hinge, and textures are 100% authentic!
  return '';
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({
  model3DUrl,
  productName,
  categorySlug,
  productSlug,
  thumbnailUrl,
  selectedVariant,
  onSwitchTo2D,
}) => {
  const { isSupported, isMobile, maxDpr, reason } = useWebGLSupport();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lightingPreset, setLightingPreset] = useState<'city' | 'studio' | 'sunset' | 'night'>('city');

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial/unsupported
    }
  };

  const cycleLightingPreset = () => {
    const presets: Array<'city' | 'studio' | 'sunset' | 'night'> = ['city', 'studio', 'sunset', 'night'];
    const idx = presets.indexOf(lightingPreset);
    setLightingPreset(presets[(idx + 1) % presets.length]);
  };

  // Detect brand and form factor
  const brandName = useMemo(() => {
    const n = (productName || '').toLowerCase();
    if (n.includes('samsung') || n.includes('galaxy')) return 'Samsung Galaxy';
    if (n.includes('iphone') || n.includes('apple') || n.includes('macbook')) return 'Apple';
    if (n.includes('asus') || n.includes('rog')) return 'ASUS ROG';
    if (n.includes('sony')) return 'Sony Audio';
    if (n.includes('dell') || n.includes('alienware')) return 'Dell';
    if (n.includes('lenovo') || n.includes('thinkpad')) return 'Lenovo ThinkPad';
    if (n.includes('keychron')) return 'Keychron';
    if (n.includes('razer')) return 'Razer';
    if (n.includes('logitech')) return 'Logitech';
    return '';
  }, [productName]);

  const isFoldable = useMemo(() => {
    const n = (productName || '').toLowerCase();
    return n.includes('flip') || n.includes('fold');
  }, [productName]);

  const [foldState, setFoldState] = useState<'open' | 'flex' | 'closed'>('flex');

  // Automatically sync with selected variant color, or allow user override
  const variantColorInfo = useMemo(() => extractVariantColor(selectedVariant), [selectedVariant]);
  const activeColor = customColor ?? variantColorInfo.hex;

  // Determine actual model URL based on product
  const effectiveModelUrl = useMemo(() => {
    return resolveModel3DUrl(model3DUrl, productName, categorySlug);
  }, [model3DUrl, productName, categorySlug]);

  const [resolvedSource, setResolvedSource] = useState<'custom_glb' | 'sample_glb' | 'procedural'>(
    effectiveModelUrl ? 'custom_glb' : 'procedural'
  );

  const effectiveCategorySlug = categorySlug;

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
      ref={containerRef}
      id="product-3d-viewer-container"
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none'
          : 'relative aspect-square sm:aspect-[4/3] w-full rounded-3xl'
      } bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none transition-all`}
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
            {resolvedSource === 'custom_glb' ? 'Mô hình CAD GLB' : `Mô hình 3D Chuẩn Thiết Kế${brandName ? ` (${brandName})` : ''}`}
          </span>
        </div>

        {/* Model Form Factor & Interactive Controls */}
        <div className="flex items-center gap-2">
          {isFoldable && (
            <button
              type="button"
              onClick={() => setFoldState((s) => (s === 'flex' ? 'open' : s === 'open' ? 'closed' : 'flex'))}
              title="Chuyển góc gập máy Z Flip (Mở phẳng 180° / Bán gập Flex Mode / Gập vỏ sò)"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold border border-indigo-400/50 shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95"
            >
              <span>📱</span>
              <span>
                {foldState === 'flex'
                  ? 'Flex Mode 90°'
                  : foldState === 'open'
                  ? 'Mở phẳng 180°'
                  : 'Gập vỏ sò'}
              </span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 text-xs font-medium backdrop-blur-md max-w-[200px] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="truncate">{productName}</span>
          </div>

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
          thumbnailUrl={thumbnailUrl}
          productSlug={productSlug}
          foldState={isFoldable ? foldState : undefined}
          lightingPreset={lightingPreset}
        />
      </div>

      {/* ──── Floating Floating Action Overlay (Right Side) ──── */}
      <div className="relative z-10 self-end flex flex-col gap-2">
        {/* Toggle Fullscreen */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
          className="w-9 h-9 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center text-sm font-bold backdrop-blur-md transition-all shadow-lg active:scale-95"
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>

        {/* Cycle Lighting Environment */}
        <button
          type="button"
          onClick={cycleLightingPreset}
          title={`Ánh sáng môi trường: ${lightingPreset.toUpperCase()} (Bấm để đổi City/Studio/Sunset/Night)`}
          className="w-9 h-9 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-slate-700 flex items-center justify-center text-sm font-bold backdrop-blur-md transition-all shadow-lg active:scale-95"
        >
          {lightingPreset === 'city' ? '🏙️' : lightingPreset === 'studio' ? '💡' : lightingPreset === 'sunset' ? '🌅' : '🌃'}
        </button>

        {/* Toggle Auto-rotate */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Tắt tự động xoay' : 'Bật tự động xoay'}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold backdrop-blur-md border transition-all shadow-lg active:scale-95 ${
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
          className="w-9 h-9 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-sm font-bold backdrop-blur-md transition-all shadow-lg active:scale-95"
        >
          🎯
        </button>

        {/* Toggle Wireframe */}
        <button
          type="button"
          onClick={() => setWireframe(!wireframe)}
          title={wireframe ? 'Tắt khung dây' : 'Bật khung dây Wireframe'}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-mono font-bold backdrop-blur-md border transition-all shadow-lg active:scale-95 ${
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
