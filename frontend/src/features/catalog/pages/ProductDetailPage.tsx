import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import catalogApi from '../../../api/catalogApi';
import { ProductDetailDto, ProductVariantDto } from '../../../types/catalog';
import { formatVND } from '../../../utils/format';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'policy'>('specs');
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setLoading(true);
    catalogApi
      .getProductBySlug(slug)
      .then((data) => {
        if (isMounted) {
          setProduct(data);
          if (data && data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching product:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner message="Đang tải thông tin chi tiết sản phẩm..." size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center text-4xl mb-6">
          ⚠️
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Không tìm thấy sản phẩm
        </h1>
        <p className="mt-3 text-slate-500 max-w-md mx-auto">
          Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc đường dẫn không chính xác.
        </p>
        <div className="mt-8">
          <Link
            to="/categories"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-colors"
          >
            Quay lại danh mục sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // Parse specifications JSON
  let specsObj: Record<string, string> = {};
  try {
    if (product.specifications) {
      specsObj = JSON.parse(product.specifications);
    }
  } catch {
    specsObj = { 'Thông tin': product.specifications || '' };
  }

  // All product images
  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: 'default', imageUrl: product.thumbnailUrl || '', altText: product.name, displayOrder: 1, isPrimary: true }];

  const currentPrice = selectedVariant ? selectedVariant.salePrice : product.basePrice;
  const originalPrice = selectedVariant?.originalPrice;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  const handleAddToCart = () => {
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    navigate('/cart');
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Toast notification */}
      {addedToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-bold">Đã thêm vào giỏ hàng thành công!</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-2 truncate">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>&rsaquo;</span>
        <Link to="/categories" className="hover:text-brand-600 transition-colors">
          Danh mục
        </Link>
        <span>&rsaquo;</span>
        <Link
          to={`/categories/${product.category.slug}`}
          className="hover:text-brand-600 transition-colors truncate"
        >
          {product.category.name}
        </Link>
        <span>&rsaquo;</span>
        <span className="font-semibold text-slate-900 truncate">{product.name}</span>
      </nav>

      {/* Main Product Showcase: Gallery + Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: 2D Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex items-center justify-center p-4">
            {/* 3D badge */}
            {product.model3DUrl && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-indigo-900/90 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <svg className="w-4 h-4 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>Hỗ trợ mô hình 3D (Giai đoạn 2)</span>
              </div>
            )}

            <img
              src={allImages[selectedImageIndex]?.imageUrl || product.thumbnailUrl}
              alt={product.name}
              className="w-full h-full object-contain object-center hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80';
              }}
            />
          </div>

          {/* Thumbnail list */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-brand-600 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=100&q=80';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Purchase Box */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span className="text-brand-600 font-bold">{product.brand.name}</span>
              <span>&bull;</span>
              <span>{product.category.name}</span>
              {selectedVariant && (
                <>
                  <span>&bull;</span>
                  <span className="font-mono text-slate-400">SKU: {selectedVariant.sku}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Price Area */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50/60 to-slate-50 border border-brand-100/60 flex items-baseline gap-4">
            <span className="text-3xl sm:text-4xl font-black text-brand-700">
              {formatVND(currentPrice)}
            </span>
            {originalPrice && originalPrice > currentPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base text-slate-400 line-through">
                  {formatVND(originalPrice)}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-600 text-xs font-bold">
                  -{discountPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Chọn phiên bản / màu sắc:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  let attrLabel = v.name;
                  try {
                    const attrs = JSON.parse(v.attributes);
                    attrLabel = Object.values(attrs).join(' - ') || v.name;
                  } catch {
                    // fallback
                  }

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{attrLabel}</div>
                      <div className="text-xs font-semibold text-brand-700 mt-1">
                        {formatVND(v.salePrice)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock & Quantity */}
          <div className="flex items-center gap-6 pt-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Số lượng:
              </span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="self-end pb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Còn hàng &bull; Sẵn sàng giao ngay
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Thêm vào giỏ</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/30"
            >
              Mua ngay
            </button>
          </div>

          {/* Value perks row */}
          <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs text-slate-600 font-medium">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-lg block mb-1">🛡️</span>
              Bảo hành 12-24T
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-lg block mb-1">🔄</span>
              1 đổi 1 trong 30 ngày
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-lg block mb-1">🚚</span>
              Freeship toàn quốc
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Specifications & Description */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'specs'
                ? 'border-brand-600 text-brand-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông số kỹ thuật
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'desc'
                ? 'border-brand-600 text-brand-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Mô tả sản phẩm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'policy'
                ? 'border-brand-600 text-brand-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Chính sách đổi trả
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'specs' && (
            <div className="max-w-3xl">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Bảng thông số kỹ thuật chi tiết
              </h3>
              {Object.keys(specsObj).length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {Object.entries(specsObj).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`grid grid-cols-3 p-3.5 text-sm ${
                        idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                      }`}
                    >
                      <span className="font-semibold text-slate-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="col-span-2 text-slate-900 font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Chưa có thông số kỹ thuật cập nhật.</p>
              )}
            </div>
          )}

          {activeTab === 'desc' && (
            <div className="max-w-3xl prose prose-slate text-sm sm:text-base leading-relaxed text-slate-700">
              <p>
                {product.description ||
                  product.shortDescription ||
                  'Sản phẩm công nghệ phân phối chính hãng bởi MadK Store.'}
              </p>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="max-w-3xl space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                <strong>Cam kết chính hãng:</strong> Tất cả sản phẩm được bán ra tại MadK Store đều
                là hàng mới 100%, nguyên seal, đầy đủ hóa đơn VAT và bảo hành điện tử chính hãng từ
                nhà phân phối.
              </p>
              <p>
                <strong>Chính sách 1 đổi 1:</strong> Trong vòng 30 ngày kể từ ngày nhận hàng, nếu
                phát sinh lỗi phần cứng do nhà sản xuất, khách hàng được đổi ngay sản phẩm mới hoàn
                toàn miễn phí.
              </p>
              <p>
                <strong>Hỗ trợ kỹ thuật:</strong> Đội ngũ kỹ thuật viên sẵn sàng tư vấn cấu hình,
                cài đặt phần mềm và hỗ trợ bảo hành trọn đời thiết bị qua Hotline 1900 8888.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
