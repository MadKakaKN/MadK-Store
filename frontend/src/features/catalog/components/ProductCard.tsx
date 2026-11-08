import React from 'react';
import { Link } from 'react-router-dom';
import { ProductListDto } from '../../../types/catalog';
import { formatVND } from '../../../utils/format';
import { useWishlist } from '../../wishlist/context/WishlistContext';
import { useCompare } from '../../../context/CompareContext';

interface ProductCardProps {
  product: ProductListDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isLiked = isInWishlist(product.id);
  const { isInCompare, toggleCompare } = useCompare();
  const inCompare = isInCompare(product.id);

  const displayPrice =
    product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice
      ? `${formatVND(product.minPrice)} - ${formatVND(product.maxPrice)}`
      : formatVND(product.basePrice);

  // Calculate approximate MadK reward points (1% base)
  const estimatedPoints = Math.max(10, Math.floor((product.minPrice || product.basePrice) * 0.01));

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-card-hover hover:border-blue-300/80 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Wishlist Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        title={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        className={`absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-xs ${
          isLiked
            ? 'bg-rose-50 text-rose-500 scale-105 border border-rose-200'
            : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:scale-110 border border-slate-200/70 hover:bg-white'
        }`}
      >
        <svg
          className="w-4 h-4 transition-transform active:scale-75"
          viewBox="0 0 24 24"
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Compare Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCompare(product);
        }}
        title={inCompare ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
        className={`absolute top-14 right-3.5 z-20 w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-xs ${
          inCompare
            ? 'bg-cyan-500 text-white scale-105 border border-cyan-400 shadow-cyan-500/30'
            : 'bg-white/80 text-slate-400 hover:text-cyan-600 hover:scale-110 border border-slate-200/70 hover:bg-white'
        }`}
      >
        <svg
          className="w-4 h-4 transition-transform active:scale-75"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Badges container */}
      <div className="absolute top-3.5 left-3.5 right-14 z-10 flex items-center gap-1.5 pointer-events-none flex-wrap">
        {product.isFeatured && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
            Nổi bật
          </span>
        )}
        {product.model3DUrl && (
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white backdrop-blur-sm flex items-center gap-1 shadow-xs">
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            3D 360°
          </span>
        )}
      </div>

      {/* Image thumbnail */}
      <Link
        to={`/products/${product.slug}`}
        className="block relative aspect-square bg-gradient-to-b from-slate-50/60 to-slate-100/40 overflow-hidden flex items-center justify-center p-5"
      >
        <img
          src={
            product.thumbnailUrl && !product.thumbnailUrl.includes('unsplash')
              ? product.thumbnailUrl
              : `/images/products/${product.slug}.png`
          }
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.fallback) {
              target.dataset.fallback = '1';
              target.src = `/images/products/${product.slug}.png`;
            }
          }}
        />

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-x-4 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hidden sm:flex items-center justify-center">
          <span className="w-full py-2 rounded-2xl bg-slate-900/90 hover:bg-blue-600 text-white text-xs font-bold backdrop-blur-md shadow-lg transition-colors text-center flex items-center justify-center gap-1.5">
            <span>🔍 Xem tương tác</span>
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="text-blue-600 hover:underline">{product.brandName}</span>
            <span>&bull;</span>
            <span className="truncate">{product.categoryName}</span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {product.shortDescription && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
              {product.shortDescription}
            </p>
          )}

          {/* Loyalty points highlight badge */}
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-xl w-fit border border-amber-200/50">
            <span>⭐</span>
            <span>+{estimatedPoints.toLocaleString('vi-VN')} điểm MadK</span>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase block tracking-wider">Giá từ</span>
            <span className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">
              {displayPrice}
            </span>
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white text-xs font-bold transition-all duration-200 flex items-center gap-1 shadow-2xs hover:shadow-xs hover:scale-105"
            title="Xem chi tiết"
          >
            <span className="hidden sm:inline">Chi tiết</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
