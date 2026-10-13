import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import catalogApi from '../../../api/catalogApi';
import { ProductDetailDto, ProductVariantDto } from '../../../types/catalog';
import { formatVND } from '../../../utils/format';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Product3DViewerPlaceholder from '../components/Product3DViewerPlaceholder';
import { useCart } from '../../cart/context/CartContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'policy'>('desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // When variant changes, ensure quantity is within available stock
  useEffect(() => {
    if (selectedVariant) {
      const stock = selectedVariant.stockQuantity ?? 10;
      setQuantity((prev) => {
        if (stock === 0) return 0;
        if (prev === 0 || prev > stock) return 1;
        return prev;
      });
    }
  }, [selectedVariant]);

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner message="Đang tải thông tin chi tiết sản phẩm..." size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center text-4xl mb-6 shadow-sm">
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
            className="inline-flex items-center px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-colors"
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
    specsObj = { 'Thông số': product.specifications || '' };
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

  const stockAvailable = selectedVariant?.stockQuantity ?? 10;
  const isOutOfStock = stockAvailable === 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || !selectedVariant) return;
    setIsAddingToCart(true);
    const res = await addToCart(selectedVariant.id, quantity);
    setIsAddingToCart(false);
    if (res.success) {
      const variantLabel = selectedVariant?.name || 'Mặc định';
      showToast(res.message || `Đã thêm ${quantity}x "${product?.name} (${variantLabel})" vào giỏ hàng!`);
    } else {
      showToast(res.error || 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || !selectedVariant) return;
    setIsAddingToCart(true);
    const res = await addToCart(selectedVariant.id, quantity);
    setIsAddingToCart(false);
    if (res.success) {
      navigate('/cart');
    } else {
      showToast(res.error || 'Không thể thêm vào giỏ hàng.');
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 pb-28 sm:pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            ✓
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
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

      {/* Main Product Section: Gallery/3D + Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Visual Showcase (2D Gallery vs 3D Viewer Mode) */}
        <div className="space-y-4">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center justify-between p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Ảnh thực tế (2D)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-indigo-950 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span>Mô hình 3D Canvas</span>
              {product.model3DUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Display viewport */}
          {viewMode === '2d' ? (
            <div className="space-y-4">
              <div className="relative aspect-square bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex items-center justify-center p-6">
                {product.isFeatured && (
                  <span className="absolute top-4 left-4 z-10 px-3 py-1 text-xs font-bold uppercase rounded-lg bg-amber-500 text-white shadow-sm">
                    Nổi bật
                  </span>
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

              {/* Thumbnails list */}
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
          ) : (
            /* 3D Viewer Placeholder Component (chừa chỗ cho Three.js WebGL sau này) */
            <Product3DViewerPlaceholder
              model3DUrl={product.model3DUrl}
              productName={product.name}
            />
          )}
        </div>

        {/* Right Column: Product Buy Box & Configuration */}
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

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Dynamic Price Display */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50/70 to-slate-50 border border-brand-100 flex items-baseline gap-4">
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

          {/* Variant Selection (Màu sắc, Dung lượng, Switch...) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Chọn biến thể / phiên bản:
                </span>
                {selectedVariant && (
                  <span className="text-xs text-brand-600 font-semibold">
                    Đang chọn: {selectedVariant.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const vStock = v.stockQuantity ?? 10;
                  const vOutOfStock = vStock === 0;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      } ${vOutOfStock ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {v.name}
                        </span>
                        {vOutOfStock ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 flex-shrink-0">
                            Hết hàng
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                            Kho: {vStock}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-brand-700 mt-1.5">
                        {formatVND(v.salePrice)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Status & Quantity Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Số lượng:
              </span>
              <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-colors"
                >
                  -
                </button>
                <span className="px-5 py-2 text-sm font-bold text-slate-900 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= stockAvailable || isOutOfStock}
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Live Stock Indicator */}
            <div className="sm:self-end pb-1">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Tạm hết hàng phiên bản này
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Còn {stockAvailable} sản phẩm sẵn sàng giao
                </div>
              )}
            </div>
          </div>

          {/* Action CTA Buttons (Desktop view) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              disabled={isOutOfStock || isAddingToCart}
              onClick={handleAddToCart}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg className={`w-5 h-5 ${isAddingToCart ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>{isOutOfStock ? 'Tạm hết hàng' : isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/30"
            >
              {isOutOfStock ? 'Liên hệ khi có hàng' : 'Mua ngay'}
            </button>
          </div>

          {/* Service Perks */}
          <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs text-slate-600 font-medium">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-lg block mb-1">🛡️</span>
              Bảo hành 12-24T
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-lg block mb-1">🔄</span>
              1 đổi 1 30 ngày
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-lg block mb-1">🚚</span>
              Freeship toàn quốc
            </div>
          </div>
        </div>
      </div>

      {/* Information Tabs: HTML Description, Specifications Table, Policy */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
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
            onClick={() => setActiveTab('policy')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'policy'
                ? 'border-brand-600 text-brand-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Chính sách bảo hành & đổi trả
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          {activeTab === 'desc' && (
            <div className="max-w-4xl text-slate-700 leading-relaxed space-y-4">
              {/* Product description rendered as normal HTML */}
              <div
                className="prose prose-slate max-w-none text-sm sm:text-base space-y-3"
                dangerouslySetInnerHTML={{
                  __html:
                    product.description ||
                    `<p>${product.shortDescription || 'Sản phẩm công nghệ cao cấp chính hãng tại MadK Store.'}</p>`,
                }}
              />
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-3xl">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Bảng thông số kỹ thuật chi tiết
              </h3>
              {Object.keys(specsObj).length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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

          {activeTab === 'policy' && (
            <div className="max-w-3xl space-y-4 text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Cam kết 100% Chính hãng</h4>
                <p>
                  Sản phẩm phân phối chính thức từ {product.brand.name}. Nguyên seal hộp, đầy đủ phụ kiện
                  kèm hóa đơn điện tử VAT.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Chính sách Đổi trả 7 ngày</h4>
                <p>
                  Đổi mới miễn phí trong 7 ngày đầu nếu máy phát sinh lỗi từ nhà sản xuất. Hỗ trợ gửi trả
                  hàng tận nơi qua bưu tá.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Bảo hành điện tử toàn quốc</h4>
                <p>
                  Bảo hành từ 12 - 24 tháng theo số serial và IMEI tại các trung tâm ủy quyền chính hãng
                  trên toàn quốc.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 px-4 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold">Giá sản phẩm</span>
          <span className="text-base font-black text-brand-700">{formatVND(currentPrice)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs"
          >
            Thêm giỏ
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            className="px-4 py-2.5 rounded-xl bg-brand-600 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-brand-600/30"
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
