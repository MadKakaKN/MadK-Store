import React, { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { formatVND } from '../../../utils/format';

const Hero3DCanvas = React.lazy(() => import('./hero-3d/Hero3DCanvas'));

interface SpotlightProduct {
  id: string;
  name: string;
  categoryName: string;
  slug: string;
  price: number;
  badge: string;
  videoUrl: string;
  imageUrl: string;
  keySpecs: string[];
  features: string;
}

const SPOTLIGHT_PRODUCTS: SpotlightProduct[] = [
  {
    id: 'spotlight-1',
    name: 'iPhone 15 Pro Max',
    categoryName: 'Điện thoại thông minh',
    slug: 'dien-thoai-iphone-15-pro-max',
    price: 34990000,
    badge: 'Đỉnh cao Công Nghệ',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-computer-screens-with-charts-and-diagrams-43224-large.mp4',
    imageUrl: '/images/products/iphone-15-pro-max.jpg',
    keySpecs: ['Chip A17 Pro', 'Titanium Grade 5', 'Camera 5x Zoom'],
    features: 'Hỗ trợ mô hình 3D xoay 360°',
  },
  {
    id: 'spotlight-2',
    name: 'ROG Strix SCAR 16 (2024)',
    categoryName: 'Laptop Gaming',
    slug: 'laptop-asus-rog-strix-scar-16',
    price: 69990000,
    badge: 'Quái Thú Gaming',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-motherboard-details-and-components-in-macro-view-42861-large.mp4',
    imageUrl: '/images/products/rog-strix-scar-16.jpg',
    keySpecs: ['Core i9-14900HX', 'RTX 4090 16GB', 'Mini LED 240Hz'],
    features: 'Tản nhiệt 3 quạt kim loại lỏng',
  },
  {
    id: 'spotlight-3',
    name: 'ROG Strix RTX 4090 OC 24GB',
    categoryName: 'VGA - Card màn hình',
    slug: 'vga-asus-rog-strix-geforce-rtx-4090',
    price: 58990000,
    badge: 'Vũ Khí Tối Thượng',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-glowing-signals-43187-large.mp4',
    imageUrl: '/images/products/rog-strix-rtx-4090.jpg',
    keySpecs: ['24GB GDDR6X', 'Ada Lovelace', 'Ray Tracing On'],
    features: 'Hiệu năng đồ họa 4K & AI',
  },
];

export const Hero3DShowcase: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [displayMode, setDisplayMode] = useState<'3d' | 'video'>('3d');

  // Auto rotate spotlight every 7 seconds unless hovered/paused
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % SPOTLIGHT_PRODUCTS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeProduct = SPOTLIGHT_PRODUCTS[selectedIndex];

  return (
    <div
      className="relative rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl p-4 sm:p-6 backdrop-blur-xl overflow-hidden group/showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with live 3D status badge & Mode toggle */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            3D Tech Spotlight
          </span>
        </div>

        {/* View Mode Toggle: 3D Canvas vs Video Showcase */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            onClick={() => setDisplayMode('3d')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              displayMode === '3d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Canvas
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('video')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              displayMode === 'video'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Video
          </button>
        </div>
      </div>

      {/* Main 3D Canvas / Video & Visual Frame */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-inner group">
        {displayMode === '3d' ? (
          <Suspense
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-mono">Đang nạp 3D...</span>
              </div>
            }
          >
            <Hero3DCanvas
              key={activeProduct.slug}
              productSlug={activeProduct.slug}
              productCategory={activeProduct.categoryName}
              productName={activeProduct.name}
            />
          </Suspense>
        ) : (
          <>
            {/* Looping 3D / Tech Video with ambient styling */}
            <video
              key={activeProduct.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              poster={activeProduct.imageUrl}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            >
              <source src={activeProduct.videoUrl} type="video/mp4" />
            </video>

            {/* Subtle grid mesh overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e90a_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e90a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

            {/* Floating 3D Device Cutout / Poster */}
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.name}
                className="max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] transform group-hover:scale-110 group-hover:-rotate-1 transition-transform duration-500"
              />
            </div>
          </>
        )}

        {/* Holographic Badge in Viewport */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-white shadow-lg pointer-events-none">
          <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 21 16z" />
          </svg>
          <span>{displayMode === '3d' ? 'Xoay 360° chuột' : 'Mô hình 3D'}</span>
        </div>

        {/* Overlay Info at bottom of frame */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between pointer-events-none">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {activeProduct.categoryName}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              {activeProduct.name}
            </h3>
          </div>
          <span className="text-base sm:text-lg font-black text-brand-400 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            {formatVND(activeProduct.price)}
          </span>
        </div>
      </div>

      {/* Key Tech Specs Pills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {activeProduct.keySpecs.map((spec, idx) => (
          <span
            key={idx}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300"
          >
            ⚡ {spec}
          </span>
        ))}
      </div>

      {/* Spotlight Selector Tabs */}
      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Chọn thiết bị tiêu biểu:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {SPOTLIGHT_PRODUCTS.map((prod, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`p-2 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-brand-600/20 border-brand-500 text-white shadow-sm'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold truncate">{prod.name}</div>
                <div className="text-[10px] text-brand-400 font-semibold mt-0.5 truncate">
                  {formatVND(prod.price)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Button to Product Detail */}
      <div className="mt-4 pt-1">
        <Link
          to={`/products/${activeProduct.slug}`}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <span>Khám phá chi tiết {activeProduct.name}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default Hero3DShowcase;
