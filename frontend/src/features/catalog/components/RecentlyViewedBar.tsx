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
    <section className="bg-slate-50 rounded-3.5xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            🕒
          </span>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              Sản phẩm bạn vừa xem
            </h3>
            <p className="text-xs text-slate-500">Tiếp tục tham khảo các thiết bị bạn đang cân nhắc</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            clearRecentlyViewed();
            setItems([]);
          }}
          className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
        >
          Xóa lịch sử xem
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {items.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            to={`/products/${item.slug}`}
            className="group p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden mb-2.5">
                <img
                  src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h4 className="font-bold text-slate-900 text-xs line-clamp-2 group-hover:text-blue-600 transition-colors">
                {item.name}
              </h4>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-black text-blue-700 block">
                {formatVND(item.price)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedBar;
