import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentlyViewed, clearRecentlyViewed, RecentlyViewedItem } from '../../../utils/recentlyViewed';
import { formatVND } from '../../../utils/format';

interface RecentlyViewedBarProps {
  currentProductId?: string;
}

export const RecentlyViewedBar: React.FC<RecentlyViewedBarProps> = ({ currentProductId }) => {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const list = getRecentlyViewed().filter((i) => i.id !== currentProductId);
    setItems(list);
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 shadow-none space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-gray-500">history</span>
          <h4 className="text-xs font-semibold text-[#111827]">Sản phẩm đã xem gần đây</h4>
        </div>

        <button
          type="button"
          onClick={() => {
            clearRecentlyViewed();
            setItems([]);
          }}
          className="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
        >
          Xóa lịch sử
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {items.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            to={`/products/${item.slug}`}
            className="border border-[#E5E7EB] rounded-lg p-2 flex items-center gap-2.5 hover:border-[#1D4ED8] transition-colors bg-white group"
          >
            <img
              src={item.thumbnailUrl || `/images/products/${item.slug}.png`}
              alt={item.name}
              className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition-transform"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = '1';
                  target.src = `/images/products/${item.slug}.png`;
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs text-[#111827] font-medium line-clamp-1 group-hover:text-[#1D4ED8] transition-colors">
                {item.name}
              </h5>
              <div className="text-[#D70018] text-xs font-bold mt-0.5">
                {formatVND(item.price)}
              </div>
              <span className="text-[10px] text-[#1D4ED8] font-medium">Xem lại</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedBar;
