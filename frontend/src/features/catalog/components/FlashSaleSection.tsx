import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatVND } from '../../../utils/format';

interface FlashSaleItem {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  soldCount: number;
  totalStock: number;
  tag: string;
}

export const FlashSaleSection: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 3,
    minutes: 42,
    seconds: 15,
  });

  // Countdown timer ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 4, minutes: 0, seconds: 0 }; // Loop/reset
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const flashSaleItems: FlashSaleItem[] = [
    {
      id: 'fs-1',
      name: 'Laptop Gaming ASUS ROG Zephyrus G16 (Core Ultra 7, RTX 4070 8GB, OLED 240Hz)',
      slug: 'asus-rog-zephyrus-g16',
      thumbnailUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60',
      originalPrice: 54990000,
      salePrice: 47990000,
      discountPercent: 13,
      soldCount: 8,
      totalStock: 10,
      tag: 'GIÁ SỐC CHỈ HÔM NAY',
    },
    {
      id: 'fs-2',
      name: 'Card Màn Hình ASUS Dual GeForce RTX 4070 SUPER EVO OC 12GB GDDR6X',
      slug: 'asus-rtx-4070-super-evo',
      thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=60',
      originalPrice: 18990000,
      salePrice: 15890000,
      discountPercent: 16,
      soldCount: 14,
      totalStock: 15,
      tag: 'SẮP CHÁY HÀNG',
    },
    {
      id: 'fs-3',
      name: 'Màn Hình Gaming ASUS TUF VG249Q3A 24 inch Fast IPS 180Hz 1ms',
      slug: 'asus-tuf-vg249q3a',
      thumbnailUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
      originalPrice: 3890000,
      salePrice: 3190000,
      discountPercent: 18,
      soldCount: 22,
      totalStock: 25,
      tag: 'TOP DEAL QUỐC DÂN',
    },
    {
      id: 'fs-4',
      name: 'Tai Nghe Gaming Chống Ồn Sony WH-1000XM5 Hi-Res Audio 30H',
      slug: 'sony-wh-1000xm5',
      thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
      originalPrice: 8990000,
      salePrice: 6990000,
      discountPercent: 22,
      soldCount: 19,
      totalStock: 20,
      tag: 'GIẢM TỚI 22%',
    },
  ];

  return (
    <section className="rounded-3.5xl bg-gradient-to-br from-rose-950 via-slate-950 to-blue-950 p-6 sm:p-8 lg:p-10 border border-rose-900/40 shadow-2xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 pb-6 border-b border-rose-900/30">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center text-xl shadow-lg shadow-rose-600/40 animate-bounce">
              🔥
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  FLASH SALE GIỜ VÀNG
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                  TRỰC TIẾP
                </span>
              </div>
              <p className="text-xs text-rose-200/80">Số lượng có hạn &bull; Cập nhật liên tục mỗi ngày</p>
            </div>
          </div>
        </div>

        {/* Real-time Countdown Box */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-rose-500/30 px-4 py-2.5 rounded-2.5xl backdrop-blur-md shadow-lg">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Kết thúc sau:
          </span>
          <div className="flex items-center gap-1.5 font-mono text-white text-sm sm:text-base font-black">
            <span className="px-2 py-1 rounded-xl bg-rose-600 text-white shadow-xs">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-rose-400 font-bold">:</span>
            <span className="px-2 py-1 rounded-xl bg-rose-600 text-white shadow-xs">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-rose-400 font-bold">:</span>
            <span className="px-2 py-1 rounded-xl bg-rose-600 text-white shadow-xs">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Flash Sale Product Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {flashSaleItems.map((item) => {
          const soldPercent = Math.min(100, Math.round((item.soldCount / item.totalStock) * 100));
          return (
            <div
              key={item.id}
              className="group bg-slate-900/80 rounded-3xl p-4 border border-slate-800 hover:border-rose-500/60 shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                {/* Thumbnail & Discount badge */}
                <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-950 mb-3.5">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md">
                    -{item.discountPercent}%
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-bold text-center">
                    {item.tag}
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 group-hover:text-rose-400 transition-colors">
                  {item.name}
                </h3>

                {/* Price block */}
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-black text-rose-400">
                    {formatVND(item.salePrice)}
                  </span>
                  <span className="text-xs text-slate-500 line-through">
                    {formatVND(item.originalPrice)}
                  </span>
                </div>
              </div>

              {/* Sold Progress Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-rose-300 font-semibold">
                    <span>🔥</span>
                    <span>Đã bán {item.soldCount}/{item.totalStock}</span>
                  </span>
                  <span className="font-mono text-slate-400">{soldPercent}%</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-500"
                    style={{ width: `${soldPercent}%` }}
                  />
                </div>

                <Link
                  to={`/products/${item.slug}`}
                  className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs text-center transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
                >
                  <span>Săn Deal Ngay</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FlashSaleSection;
