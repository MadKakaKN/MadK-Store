import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import wishlistApi from '../../../api/wishlistApi';
import { WishlistItemDto } from '../../../types/wishlist';
import { formatVND } from '../../../utils/format';
import { useWishlist } from '../../wishlist/context/WishlistContext';

export const WishlistList: React.FC = () => {
  const { toggleWishlist } = useWishlist();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wishlistApi.getWishlist();
      setItems(data);
    } catch (err: any) {
      console.error('Failed to load wishlist:', err);
      setError(err?.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await toggleWishlist(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center py-16 text-slate-400">
        <div className="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium">Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center py-12">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchWishlist}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-3xl shadow-sm">
          ❤️
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Danh sách yêu thích trống</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Bạn chưa lưu sản phẩm nào. Hãy bấm vào biểu tượng trái tim trên các sản phẩm để lưu lại mua sau nhé!
          </p>
        </div>
        <Link
          to="/categories"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all"
        >
          Khám phá sản phẩm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Sản phẩm yêu thích
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Đang lưu {items.length} món đồ công nghệ bạn quan tâm
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-2xl border border-slate-200 hover:border-brand-300 p-4 transition-all hover:shadow-md flex flex-col justify-between bg-white"
          >
            {/* Delete button */}
            <button
              type="button"
              onClick={() => handleRemove(item.productId)}
              title="Xóa khỏi yêu thích"
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 flex items-center justify-center transition-all shadow-2xs"
            >
              ✕
            </button>

            <div>
              {/* Thumbnail */}
              <Link
                to={`/products/${item.productSlug}`}
                className="aspect-square rounded-xl bg-slate-50 overflow-hidden block mb-3 border border-slate-100 p-2"
              >
                <img
                  src={item.thumbnailUrl || `/images/products/${item.productSlug}.png`}
                  alt={item.productName}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Brand & Category */}
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-1">
                {item.brandName} &bull; {item.categoryName}
              </span>

              {/* Title */}
              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                <Link to={`/products/${item.productSlug}`}>{item.productName}</Link>
              </h4>
            </div>

            {/* Price & Action */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-sm font-black text-brand-700">
                {formatVND(item.basePrice)}
              </span>

              <Link
                to={`/products/${item.productSlug}`}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-brand-600 text-white text-[11px] font-bold transition-colors"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistList;
