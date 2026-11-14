import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import catalogApi from '../../../api/catalogApi';
import { ProductDetailDto, ProductVariantDto, ProductListDto } from '../../../types/catalog';
import { formatVND } from '../../../utils/format';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
const Product3DViewer = React.lazy(
  () => import('../components/product-viewer/Product3DViewer')
);
import { useCart } from '../../cart/context/CartContext';
import { useAuth } from '../../auth/context/AuthContext';
import SEOHead, { buildProductSchema, buildBreadcrumbSchema } from '../../../components/common/SEOHead';
import AuthRequiredModal from '../../../components/common/AuthRequiredModal';
import ProductReviewsSection from '../components/ProductReviewsSection';
import { InstallmentCalculatorModal } from '../components/InstallmentCalculatorModal';
import { KeyboardSoundTestModal } from '../components/KeyboardSoundTestModal';
import RecentlyViewedBar from '../components/RecentlyViewedBar';
import { addRecentlyViewed } from '../../../utils/recentlyViewed';
import { useWishlist } from '../../wishlist/context/WishlistContext';
import { useCompare } from '../../../context/CompareContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useCompare();

  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const isLiked = product ? isInWishlist(product.id) : false;
  const inCompare = product ? isInCompare(product.id) : false;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === '3d' || params.get('tab') === '3d' ? '3d' : '2d';
  });
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showSoundTestModal, setShowSoundTestModal] = useState(false);

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
          if (data) {
            addRecentlyViewed({
              id: data.id,
              name: data.name,
              slug: data.slug,
              price: data.basePrice,
              thumbnailUrl: data.thumbnailUrl,
              categoryName: data.category?.name,
            });
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
      <div className="py-24 max-w-[1240px] mx-auto px-4">
        <LoadingSpinner message="Đang tải thông tin chi tiết sản phẩm..." size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1240px] mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-[#D70018] flex items-center justify-center text-3xl mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h1 className="text-xl font-bold text-[#111827]">Không tìm thấy sản phẩm</h1>
        <p className="mt-2 text-xs text-gray-500 max-w-md mx-auto">
          Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc đường dẫn không chính xác.
        </p>
        <div className="mt-6">
          <Link
            to="/categories"
            className="inline-flex items-center px-5 py-2.5 rounded bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-colors"
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

  const verifiedPrimaryImg =
    product.thumbnailUrl && !product.thumbnailUrl.includes('unsplash')
      ? product.thumbnailUrl
      : `/images/products/${product.slug}.png`;

  const validGalleryImages = (product.images || []).filter(
    (img) => img?.imageUrl && !img.imageUrl.includes('unsplash')
  );

  const allImages =
    validGalleryImages.length > 0
      ? validGalleryImages
      : [{ id: 'primary-image', imageUrl: verifiedPrimaryImg, altText: product.name, displayOrder: 1, isPrimary: true }];

  const currentPrice = selectedVariant ? selectedVariant.salePrice : product.basePrice;
  const originalPrice = selectedVariant?.originalPrice || Math.round(currentPrice * 1.12);
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 10;

  const stockAvailable = selectedVariant?.stockQuantity ?? 10;
  const isOutOfStock = stockAvailable === 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || !selectedVariant) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsAddingToCart(true);
    const res = await addToCart(selectedVariant.id, quantity);
    setIsAddingToCart(false);
    if (res.success) {
      const variantLabel = selectedVariant?.name || 'Mặc định';
      showToast(res.message || `Đã thêm ${quantity}x "${product?.name} (${variantLabel})" vào giỏ hàng!`);
    } else {
      if (res.requireLogin) {
        setShowAuthModal(true);
      }
      showToast(res.error || 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || !selectedVariant) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsAddingToCart(true);
    const res = await addToCart(selectedVariant.id, quantity);
    setIsAddingToCart(false);
    if (res.success) {
      navigate('/cart');
    } else {
      if (res.requireLogin) {
        setShowAuthModal(true);
      }
      showToast(res.error || 'Không thể thêm vào giỏ hàng.');
    }
  };

  const productImagesList = allImages.map((img) => img.imageUrl).filter(Boolean);

  const productSchema = buildProductSchema({
    name: product.name,
    description: product.shortDescription || product.description,
    images: productImagesList,
    sku: selectedVariant?.sku || product.slug,
    brandName: product.brand?.name,
    categoryName: product.category?.name,
    price: currentPrice,
    inStock: !isOutOfStock,
    slug: product.slug,
  });

  const productBreadcrumbs = buildBreadcrumbSchema([
    { name: 'Trang chủ', url: '/' },
    { name: 'Danh mục', url: '/categories' },
    { name: product.category.name, url: `/categories/${product.category.slug}` },
    { name: product.name, url: `/products/${product.slug}` },
  ]);

  const isKeyboardProduct =
    product.category?.slug === 'ban-phim-co' ||
    product.category?.name?.toLowerCase().includes('bàn phím') ||
    product.name.toLowerCase().includes('bàn phím') ||
    product.name.toLowerCase().includes('keyboard') ||
    product.specifications?.toLowerCase().includes('switch');

  return (
    <div className="max-w-[1240px] w-full mx-auto px-4 py-3 space-y-4">
      <SEOHead
        title={`${product.name} | MadK Store`}
        description={
          product.shortDescription ||
          `Mua ngay ${product.name} chính hãng tại MadK Store. Giá chỉ từ ${formatVND(currentPrice)}, bảo hành chính hãng 24 tháng, trả góp 0%, tương tác xem mô hình 3D.`
        }
        canonicalUrl={`https://madk.store/products/${product.slug}`}
        ogType="product"
        ogImage={productImagesList[0] || product.thumbnailUrl}
        keywords={`madk store, ${product.name}, ${product.brand?.name || ''}, mua ${product.name}`}
        structuredData={[productSchema, productBreadcrumbs]}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#111827] text-white text-xs px-4 py-2.5 rounded shadow-xl border border-gray-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* BREADCRUMB (Stitch Screen 10) */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link to="/" className="hover:text-[#1D4ED8] flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">home</span>
          <span>Trang chủ</span>
        </Link>
        <span className="text-gray-400">/</span>
        <Link to="/categories" className="hover:text-[#1D4ED8]">
          Danh mục
        </Link>
        <span className="text-gray-400">/</span>
        <Link to={`/categories/${product.category.slug}`} className="hover:text-[#1D4ED8]">
          {product.category.name}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-[#111827] font-medium truncate max-w-sm">{product.name}</span>
      </nav>

      {/* 2-COLUMNS PRODUCT PURCHASE SECTION (Stitch Screen 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Gallery & 3D Interactive Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
            {/* Flat text switch tabs (no pills) */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2 mb-3">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`flex items-center gap-1 pb-1 transition-colors ${
                    viewMode === '2d'
                      ? 'text-[#1D4ED8] border-b-2 border-[#1D4ED8]'
                      : 'text-gray-500 hover:text-[#111827]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">photo_library</span>
                  <span>Ảnh thực tế ({allImages.length})</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`flex items-center gap-1 pb-1 transition-colors ${
                    viewMode === '3d'
                      ? 'text-[#1D4ED8] border-b-2 border-[#1D4ED8]'
                      : 'text-gray-500 hover:text-[#111827]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">3d_rotation</span>
                  <span>Xem mô hình 3D</span>
                  {product.model3DUrl && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-gray-500 border border-[#E5E7EB] px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-sm text-gray-500">rotate_90_degrees_ccw</span>
                <span>Kéo để xoay 360°</span>
              </div>
            </div>

            {/* Main Stage: 2D Image or Three.js 3D Viewer */}
            {viewMode === '2d' ? (
              <div className="relative w-full aspect-[4/3] bg-white border border-[#E5E7EB] rounded flex items-center justify-center p-4 overflow-hidden">
                <img
                  src={
                    allImages[selectedImageIndex]?.imageUrl &&
                    !allImages[selectedImageIndex]?.imageUrl.includes('unsplash')
                      ? allImages[selectedImageIndex].imageUrl
                      : verifiedPrimaryImg
                  }
                  alt={product.name}
                  className="max-h-72 w-auto object-contain hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.fallbackStep) {
                      target.dataset.fallbackStep = '1';
                      target.src = `/images/products/${product.slug}.png`;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="relative w-full aspect-[4/3] bg-slate-950 border border-[#E5E7EB] rounded overflow-hidden">
                <React.Suspense
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center text-white text-xs">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
                      <span>Đang nạp mô hình 3D Three.js...</span>
                    </div>
                  }
                >
                  <Product3DViewer
                    model3DUrl={product.model3DUrl}
                    productName={product.name}
                    categorySlug={product.category?.slug}
                    productSlug={product.slug}
                    thumbnailUrl={product.thumbnailUrl || `/images/products/${product.slug}.png`}
                    selectedVariant={selectedVariant}
                    onVariantSelect={setSelectedVariant}
                    onSwitchTo2D={() => setViewMode('2d')}
                  />
                </React.Suspense>
              </div>
            )}

            {/* Thumbnails Strip */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`rounded p-1 bg-white aspect-[4/3] flex items-center justify-center transition-colors ${
                      selectedImageIndex === idx
                        ? 'border-2 border-[#1D4ED8]'
                        : 'border border-[#E5E7EB] hover:border-[#1D4ED8]'
                    }`}
                  >
                    <img
                      src={img.imageUrl || `/images/products/${product.slug}.png`}
                      alt=""
                      className="max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = '1';
                          target.src = `/images/products/${product.slug}.png`;
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fast Commitments Strip below Gallery (Stitch Screen 10) */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="material-symbols-outlined text-base text-[#1D4ED8]">verified_user</span>
              <span className="font-medium">Hàng chính hãng 100%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="material-symbols-outlined text-base text-[#1D4ED8]">home_repair_service</span>
              <span className="font-medium">Bảo hành 24 tháng tận nơi</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="material-symbols-outlined text-base text-[#1D4ED8]">autorenew</span>
              <span className="font-medium">Đổi mới 30 ngày nếu lỗi NSX</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Details, Pricing, Variants & CTAs (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-3">
            {/* Product Name */}
            <h1 className="text-base font-semibold text-[#111827] leading-snug">
              {product.name}
            </h1>

            {/* SKU & Ratings */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-[#E5E7EB] pb-2.5">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">SKU: {selectedVariant?.sku || product.slug}</span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1 text-gray-700">
                  <span className="material-symbols-outlined text-sm text-amber-500">star</span>
                  <span className="font-semibold text-[#111827]">4.9</span>
                  <a className="text-[#1D4ED8] hover:underline" href="#reviews">
                    (128 đánh giá)
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`text-xs flex items-center gap-1 ${isLiked ? 'text-rose-600 font-semibold' : 'text-gray-500 hover:text-rose-600'}`}
                >
                  <span className="material-symbols-outlined text-sm">{isLiked ? 'favorite' : 'favorite_border'}</span>
                  <span>{isLiked ? 'Đã thích' : 'Yêu thích'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const compareItem: ProductListDto = {
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      shortDescription: product.shortDescription,
                      thumbnailUrl: product.thumbnailUrl,
                      basePrice: product.basePrice,
                      minPrice: product.basePrice,
                      maxPrice: product.basePrice,
                      model3DUrl: product.model3DUrl,
                      categoryId: product.category.id,
                      categoryName: product.category.name,
                      categorySlug: product.category.slug,
                      brandId: product.brand.id,
                      brandName: product.brand.name,
                      brandSlug: product.brand.slug,
                      isFeatured: product.isFeatured,
                      createdAt: new Date().toISOString(),
                    };
                    toggleCompare(compareItem);
                  }}
                  className={`text-xs flex items-center gap-1 ${inCompare ? 'text-cyan-600 font-semibold' : 'text-gray-500 hover:text-cyan-600'}`}
                >
                  <span className="material-symbols-outlined text-sm">compare_arrows</span>
                  <span>{inCompare ? 'Đang so sánh' : 'So sánh'}</span>
                </button>
              </div>
            </div>

            {/* Pricing Box (Stitch Screen 10) */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 space-y-2">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl font-bold text-[#D70018] leading-none">
                  {formatVND(currentPrice)}
                </span>
                {originalPrice > currentPrice && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      {formatVND(originalPrice)}
                    </span>
                    <span className="bg-[#FEF2F2] text-[#D70018] border border-[#FECACA] text-[10px] font-bold px-1.5 py-0.5 rounded">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
                <span className="text-[#15803D] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#15803D]">savings</span>
                  Tiết kiệm {formatVND(originalPrice - currentPrice)} khi đặt online
                </span>
                <span className="text-[11px] text-gray-400">Đã bao gồm VAT</span>
              </div>
            </div>

            {/* Virtual Keyboard Sound Test Studio Trigger Banner */}
            {isKeyboardProduct && (
              <div className="p-3 bg-[#111827] text-white border border-[#374151] rounded-lg flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-cyan-400">headphones</span>
                  <div>
                    <div className="text-xs font-semibold">Phòng Thử Âm Bàn Phím Cơ (Sound Studio)</div>
                    <div className="text-[11px] text-gray-400">Gõ trực tiếp bàn phím để nghe thử âm thanh switch thực tế</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSoundTestModal(true)}
                  className="px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded shrink-0 transition-colors"
                >
                  Gõ thử
                </button>
              </div>
            )}

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-1 text-xs">
                <div className="font-semibold text-gray-700">Chọn phiên bản cấu hình:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const vStock = v.stockQuantity ?? 10;
                    const vOutOfStock = vStock === 0;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 rounded text-left border transition-all ${
                          isSelected
                            ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                            : 'border-[#E5E7EB] hover:border-gray-400 bg-white text-gray-700'
                        } ${vOutOfStock ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{v.name}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-sm text-[#1D4ED8]">check</span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#D70018] mt-1">
                          {formatVND(v.salePrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Picker & Stock Info */}
            <div className="flex items-center justify-between gap-4 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Số lượng:</span>
                <div className="inline-flex items-center border border-[#D1D5DB] rounded bg-white overflow-hidden">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1 text-gray-600 hover:bg-[#F3F4F6] disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 font-bold text-[#111827] text-center min-w-[2rem]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= stockAvailable || isOutOfStock}
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-[#F3F4F6] disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                {isOutOfStock ? (
                  <span className="text-rose-600 font-bold">Hết hàng</span>
                ) : (
                  <span className="text-emerald-700 font-medium">Còn {stockAvailable} sản phẩm sẵn sàng giao</span>
                )}
              </div>
            </div>

            {/* Promotional Box (Stitch Screen 10) */}
            <div className="border border-[#E5E7EB] rounded-lg p-3 bg-white space-y-2 text-xs">
              <div className="font-semibold text-[#111827] flex items-center gap-1.5 pb-1 border-b border-[#E5E7EB]">
                <span className="material-symbols-outlined text-base text-[#1D4ED8]">card_giftcard</span>
                <span>Khuyến mãi đặc quyền trị giá 3.200.000₫</span>
              </div>
              <ul className="space-y-1.5 text-gray-700">
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#15803D] shrink-0 mt-0.5">check_circle</span>
                  <span>Tặng Balo Gaming cao cấp chính hãng MadK</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#15803D] shrink-0 mt-0.5">check_circle</span>
                  <span>Chuột quang không dây công thái học</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#15803D] shrink-0 mt-0.5">check_circle</span>
                  <span>Gói bảo hành VIP 1 đổi 1 trong 30 ngày đầu tiên</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#15803D] shrink-0 mt-0.5">check_circle</span>
                  <span>Giảm thêm 500.000₫ khi thanh toán qua VNPay-QR / MoMo</span>
                </li>
              </ul>
            </div>

            {/* CTA Cluster (Stitch Screen 10) */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isOutOfStock || isAddingToCart}
                onClick={handleBuyNow}
                className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-gray-400 text-white font-semibold rounded-lg text-sm transition-colors text-center"
              >
                MUA NGAY (Giao nhanh 2h hoặc nhận tại showroom)
              </button>

              <button
                type="button"
                disabled={isOutOfStock || isAddingToCart}
                onClick={handleAddToCart}
                className="w-full py-2.5 bg-white border border-[#1D4ED8] hover:bg-[#EFF6FF] text-[#1D4ED8] font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                <span>{isAddingToCart ? 'Đang thêm vào giỏ...' : 'Thêm vào giỏ hàng'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowInstallmentModal(true)}
                  className="py-2 px-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-[#111827] text-center transition-colors"
                >
                  <div className="font-semibold text-xs">Mua trả góp 0%</div>
                  <div className="text-[11px] text-gray-500">Duyệt hồ sơ 5 phút</div>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstallmentModal(true)}
                  className="py-2 px-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-[#111827] text-center transition-colors"
                >
                  <div className="font-semibold text-xs">Trả góp qua thẻ</div>
                  <div className="text-[11px] text-gray-500">Visa, Master, JCB</div>
                </button>
              </div>
            </div>

            {/* Service Policy Box */}
            <div className="border border-[#E5E7EB] rounded-lg p-3 bg-[#F9FAFB] text-xs space-y-2 text-gray-600 divide-y divide-[#E5E7EB]">
              <div className="flex items-center gap-2 pt-1 first:pt-0">
                <span className="material-symbols-outlined text-base text-gray-500 shrink-0">local_shipping</span>
                <span>Giao hàng hỏa tốc GHN 2h nội thành TP.HCM &amp; Hà Nội</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="material-symbols-outlined text-base text-gray-500 shrink-0">build</span>
                <span>Hỗ trợ cài đặt phần mềm &amp; vệ sinh máy trọn đời miễn phí</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="material-symbols-outlined text-base text-gray-500 shrink-0">inventory_2</span>
                <span>Kiểm tra hàng trước khi thanh toán, đảm bảo 100% nguyên seal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER INFORMATION TABS NAVIGATION STRIP (Stitch Screen 10) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 sticky top-14 z-30">
        <div className="flex items-center gap-6 overflow-x-auto text-xs font-semibold whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'desc'
                ? 'text-[#1D4ED8] border-[#1D4ED8]'
                : 'text-gray-600 hover:text-[#111827] border-transparent'
            }`}
          >
            Mô tả sản phẩm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'specs'
                ? 'text-[#1D4ED8] border-[#1D4ED8]'
                : 'text-gray-600 hover:text-[#111827] border-transparent'
            }`}
          >
            Thông số kỹ thuật chi tiết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'reviews'
                ? 'text-[#1D4ED8] border-[#1D4ED8]'
                : 'text-gray-600 hover:text-[#111827] border-transparent'
            }`}
          >
            <span>Đánh giá &amp; Nhận xét</span>
            <span className="bg-[#EFF6FF] text-[#1D4ED8] px-1.5 py-0.2 rounded text-[10px]">128</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'desc' && (
        <section className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Đặc điểm nổi bật {product.name}</h3>
          <div
            className="text-xs text-gray-700 leading-relaxed space-y-3 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                product.description ||
                `<p>${product.shortDescription || 'Sản phẩm công nghệ cao cấp chính hãng tại MadK Store với chế độ bảo hành 24 tháng chính hãng.'}</p>`,
            }}
          />
        </section>
      )}

      {activeTab === 'specs' && (
        <section className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="text-base font-bold text-[#111827]">Thông số kỹ thuật chi tiết</h3>
          </div>
          {Object.keys(specsObj).length > 0 ? (
            <div className="border border-[#E5E7EB] rounded overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-[#E5E7EB]">
                  {Object.entries(specsObj).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                      <td className="py-2.5 px-3.5 font-semibold text-[#111827] w-1/3 bg-[#F9FAFB] border-r border-[#E5E7EB] capitalize">
                        {key.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-700">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Chưa có bảng thông số kỹ thuật chi tiết cho sản phẩm này.</p>
          )}
        </section>
      )}

      {activeTab === 'reviews' && (
        <section className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-4" id="reviews">
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        </section>
      )}

      {/* RECENTLY VIEWED PRODUCTS ROW */}
      <RecentlyViewedBar currentProductId={product.id} />

      {/* INSTALLMENT CALCULATOR MODAL */}
      <InstallmentCalculatorModal
        isOpen={showInstallmentModal}
        onClose={() => setShowInstallmentModal(false)}
        productName={product.name}
        productPrice={currentPrice}
        productImage={product.thumbnailUrl}
      />

      {/* KEYBOARD SOUND TEST STUDIO MODAL */}
      <KeyboardSoundTestModal
        isOpen={showSoundTestModal}
        onClose={() => setShowSoundTestModal(false)}
        productTitle={product.name}
        onSelectSwitchVariant={(switchName) => {
          if (product.variants && product.variants.length > 0) {
            const matched = product.variants.find((v) =>
              v.name.toLowerCase().includes(switchName.toLowerCase()) ||
              v.attributes?.toLowerCase().includes(switchName.toLowerCase())
            );
            if (matched) {
              setSelectedVariant(matched);
              showToast(`Đã chọn phiên bản: ${matched.name}`);
            }
          }
        }}
      />

      {/* AUTH REQUIRED POPUP MODAL */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectUrl={location.pathname}
      />
    </div>
  );
};

export default ProductDetailPage;
