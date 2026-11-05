import React from 'react';
import { Link } from 'react-router-dom';
import { ProductListDto } from '../../../types/catalog';
import { formatVND } from '../../../utils/format';
import { useWishlist } from '../../wishlist/context/WishlistContext';

interface ProductCardProps {
  product: ProductListDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isLiked = isInWishlist(product.id);

  const displayPrice =
    product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice
      ? `${formatVND(product.minPrice)} - ${formatVND(product.maxPrice)}`
      : formatVND(product.basePrice);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Wishlist Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        title={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm backdrop-blur-md ${
          isLiked
            ? 'bg-rose-50 text-rose-500 scale-105 border border-rose-200'
            : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:scale-110 border border-slate-200'
        }`}
      >
        <svg
          className="w-4 h-4 transition-transform active:scale-75"
          viewBox="0 0 24 24"
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Badges container */}
      <div className="absolute top-3 left-3 right-13 z-10 flex items-center justify-between pointer-events-none">
        {product.isFeatured && (
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-amber-500 text-white shadow-sm">
            Nổi bật
          </span>
        )}
        {product.model3DUrl ? (
          <span className="ml-auto px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600/90 text-white backdrop-blur-sm flex items-center gap-1 shadow-sm">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            3D Ready
          </span>
        ) : null}
      </div>

      {/* Image thumbnail */}
      <Link
        to={`/products/${product.slug}`}
        className="block relative aspect-square bg-slate-50 overflow-hidden flex items-center justify-center p-3"
      >
        <img
          src={
            product.thumbnailUrl && !product.thumbnailUrl.includes('unsplash')
              ? product.thumbnailUrl
              : `/images/products/${product.slug}.png`
          }
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.fallback) {
              target.dataset.fallback = '1';
              target.src = `/images/products/${product.slug}.png`;
            }
          }}
        />
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-brand-600 hover:underline">{product.brandName}</span>
            <span>&bull;</span>
            <span className="truncate">{product.categoryName}</span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {product.shortDescription && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
              {product.shortDescription}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Giá từ</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 text-brand-700">
              {displayPrice}
            </span>
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-brand-600 text-slate-700 hover:text-white text-xs font-semibold transition-all duration-200 flex items-center gap-1"
            title="Xem chi tiết"
          >
            <span className="hidden sm:inline">Chi tiết</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
