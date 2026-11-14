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

  const priceNum = product.minPrice || product.basePrice;
  const displayPrice =
    product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice
      ? `${formatVND(product.minPrice)} - ${formatVND(product.maxPrice)}`
      : formatVND(product.basePrice);

  // Approximate old price (simulate 8-15% retail discount)
  const oldPrice = Math.round(priceNum * 1.1);
  const discountPercent = Math.round(((oldPrice - priceNum) / oldPrice) * 100);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col justify-between hover:border-[#1D4ED8] transition-all hover:shadow-sm relative group">
      <div>
        {/* Badges Container */}
        <div className="relative bg-white aspect-square flex items-center justify-center mb-2 overflow-hidden rounded">
          <span className="absolute top-0 left-0 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[10px] font-semibold px-1.5 py-0.5 rounded z-10">
            Trả góp 0%
          </span>

          {product.model3DUrl ? (
            <span className="absolute top-0 right-0 border border-[#D1D5DB] text-gray-700 bg-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
              <span className="material-symbols-outlined text-[12px] text-[#1D4ED8]">view_in_ar</span>
              <span>3D</span>
            </span>
          ) : (
            product.isFeatured && (
              <span className="absolute top-0 right-0 bg-[#FEF2F2] text-[#D70018] border border-[#FECACA] text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                HOT
              </span>
            )
          )}

          {/* Quick Floating Action Buttons on Hover */}
          <div className="absolute bottom-1 right-1 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Wishlist */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              title={isLiked ? 'Bỏ yêu thích' : 'Yêu thích'}
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs border transition-colors ${
                isLiked
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-gray-500 hover:text-rose-600 border-gray-200 hover:bg-rose-50'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isLiked ? 'favorite' : 'favorite_border'}
              </span>
            </button>

            {/* Compare */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCompare(product);
              }}
              title={inCompare ? 'Bỏ so sánh' : 'So sánh'}
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs border transition-colors ${
                inCompare
                  ? 'bg-cyan-600 text-white border-cyan-700'
                  : 'bg-white text-gray-500 hover:text-cyan-600 border-gray-200 hover:bg-cyan-50'
              }`}
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
            </button>
          </div>

          {/* Thumbnail */}
          <Link to={`/products/${product.slug}`} className="w-full h-full flex items-center justify-center p-2">
            <img
              src={
                product.thumbnailUrl && !product.thumbnailUrl.includes('unsplash')
                  ? product.thumbnailUrl
                  : `/images/products/${product.slug}.png`
              }
              alt={product.name}
              loading="lazy"
              className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = '1';
                  target.src = `/images/products/${product.slug}.png`;
                }
              }}
            />
          </Link>
        </div>

        {/* Title */}
        <h4 className="text-xs font-semibold text-[#111827] line-clamp-2 hover:text-[#1D4ED8] leading-snug">
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h4>

        {/* Specs / Category tag */}
        <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">
          {product.brandName} • {product.categoryName} {product.shortDescription ? `• ${product.shortDescription}` : ''}
        </div>

        {/* Price Block */}
        <div className="mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#D70018] text-base font-bold leading-none">
              {displayPrice}
            </span>
            <span className="bg-[#FEF2F2] text-[#D70018] border border-[#FECACA] text-[10px] font-bold px-1 rounded">
              -{discountPercent}%
            </span>
          </div>
          <div className="text-gray-400 text-xs line-through mt-0.5">
            {formatVND(oldPrice)}
          </div>
        </div>

        {/* Promotion Gift Line */}
        <div className="text-[11px] text-gray-600 mt-1.5 line-clamp-1">
          Quà: Balo Gaming + Chuột không dây chính hãng
        </div>

        {/* Rating & Delivery Status */}
        <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
          <span className="material-symbols-outlined text-xs text-amber-500">star</span>
          <span className="font-semibold text-[#111827]">
            {(product as { rating?: number }).rating ? (product as { rating?: number }).rating!.toFixed(1) : '5.0'}
          </span>
          <span>({(product as { reviewCount?: number }).reviewCount || 128}) • Giao nhanh GHN 2h</span>
        </div>
      </div>

      {/* Card Actions Bottom Grid */}
      <div className="mt-3 pt-2 border-t border-[#E5E7EB] grid grid-cols-2 gap-1.5">
        <Link
          to={`/products/${product.slug}`}
          className="px-2 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm text-[#1D4ED8]">view_in_ar</span>
          <span>Xem 3D</span>
        </Link>
        <Link
          to={`/products/${product.slug}`}
          className="px-2 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">shopping_cart</span>
          <span>Chi tiết</span>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
