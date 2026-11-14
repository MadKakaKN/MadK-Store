import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import catalogApi from '../../../api/catalogApi';
import { ProductListDto } from '../../../types/catalog';
import ProductCard from '../components/ProductCard';
import Hero3DShowcase from '../components/Hero3DShowcase';
import FlashSaleSection from '../components/FlashSaleSection';
import RecentlyViewedBar from '../components/RecentlyViewedBar';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import SEOHead, { buildOrganizationSchema, buildWebSiteSchema } from '../../../components/common/SEOHead';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductListDto[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'laptop' | 'phone' | 'pc'>('all');
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const productsRes = await catalogApi.getProducts({ isFeatured: true, pageSize: 12 });

        if (isMounted) {
          setFeaturedProducts(productsRes.items || []);
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      navigate(`/tracking?q=${encodeURIComponent(trackingCode.trim())}`);
    } else {
      navigate('/tracking');
    }
  };

  const filteredProducts = featuredProducts.filter((p) => {
    if (activeTab === 'all') return true;
    const cat = p.categorySlug.toLowerCase();
    if (activeTab === 'laptop') return cat.includes('laptop');
    if (activeTab === 'phone') return cat.includes('dien-thoai') || cat.includes('phone') || cat.includes('tablet');
    if (activeTab === 'pc') return cat.includes('pc') || cat.includes('linh-kien') || cat.includes('vga');
    return true;
  });

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-4 space-y-4">
      <SEOHead
        title="MadK Store | Hệ Thống Bán Lẻ Công Nghệ Chính Hãng Hàng Đầu Việt Nam"
        description="MadK Store phân phối điện thoại thông minh, laptop gaming, linh kiện PC và phụ kiện công nghệ chính hãng với trải nghiệm tương tác mô hình 3D trực quan."
        canonicalUrl="https://madk.store/"
        keywords="madk store, điện thoại chính hãng, laptop gaming, linh kiện pc, trải nghiệm 3d, mua hàng công nghệ"
        structuredData={[buildOrganizationSchema(), buildWebSiteSchema()]}
      />

      {/* SECTION 1: HERO SECTION (Retail 3-Column Grid - Stitch Screen 2 & Screen 4) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Col 1: Vertical Category Menu (3 cols) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-none divide-y divide-[#E5E7EB]">
          <Link
            to="/categories/laptop"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gray-500 group-hover:text-[#1D4ED8]">laptop_mac</span>
              <span className="font-medium">Laptop Chính Hãng & Gaming</span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
          </Link>

          <Link
            to="/categories/dien-thoai"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gray-500 group-hover:text-[#1D4ED8]">smartphone</span>
              <span className="font-medium">Điện thoại & Tablet Flagship</span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
          </Link>

          <Link
            to="/categories/pc-gaming"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gray-500 group-hover:text-[#1D4ED8]">desktop_windows</span>
              <span className="font-medium">Máy tính để bàn & PC</span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
          </Link>

          <Link
            to="/categories/man-hinh"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gray-500 group-hover:text-[#1D4ED8]">tv</span>
              <span className="font-medium">Màn hình máy tính 2K/4K</span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
          </Link>

          <Link
            to="/categories/linh-kien-pc"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gray-500 group-hover:text-[#1D4ED8]">developer_board</span>
              <span className="font-medium">Linh kiện PC & VGA</span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
          </Link>

          <Link
            to="/categories/ban-phim-co"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gray-500 group-hover:text-[#1D4ED8]">keyboard</span>
              <span className="font-medium">Chuột & Bàn phím cơ Custom</span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
          </Link>

          <Link
            to="/categories/tai-nghe"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-gray-500 group-hover:text-[#1D4ED8]">headphones</span>
              <span className="font-medium">Tai nghe & Loa Hi-Res</span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
          </Link>

          <Link
            to="/pc-builder"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] font-semibold transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-[#1D4ED8]">construction</span>
              <span>Xây Dựng Cấu Hình PC</span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#1D4ED8]">arrow_forward</span>
          </Link>
        </aside>

        {/* Col 2: Main Promotional Banner (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col justify-between relative shadow-none overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-2 max-w-xs">
              <span className="inline-block bg-[#FEF2F2] text-[#D70018] border border-[#FECACA] text-xs font-semibold px-2 py-0.5 rounded">
                SIÊU SALE CÔNG NGHỆ 2026
              </span>
              <h2 className="text-xl font-bold text-[#111827] leading-snug">
                Đại Tiệc Laptop & Gaming Gear Mùa Mới
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Giảm đến <strong className="text-[#D70018] font-bold">5.000.000₫</strong> & tặng Balo Gaming cao cấp. Trải nghiệm tương tác 3D 360° trực quan.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
                <span className="bg-[#F3F4F6] px-2 py-0.5 rounded border border-[#E5E7EB]">Intel Core Ultra / i9</span>
                <span className="bg-[#F3F4F6] px-2 py-0.5 rounded border border-[#E5E7EB]">RTX 4070 / 4080</span>
              </div>
              <div className="pt-2">
                <Link
                  to="/categories/laptop"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded text-xs font-semibold transition-colors"
                >
                  <span>Khám phá ngay</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center p-2">
              <img
                alt="Laptop Gaming ASUS ROG"
                className="w-56 h-40 object-contain hover:scale-105 transition-transform duration-300"
                src="/images/products/laptop-asus-rog-strix-scar-16.png"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = '1';
                    target.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW7LkbSNfKhe31jizmkkaPmmzysigmJqhq46ycjebbsF4V4Hnd7g6m4ex8jo22zgKmBPXN-JpvB7yE5KKoUmIYQYxKidvKarCj4OewYYpuEE3ncIKDnrJ_cJ3h0i0gPu_DailrHd6D4lZ649eEogrIJq8WwkSJUqbeQfApGBJSGC_L_hcxbLU1jXdwKKdCVWy4MlhKU00f3CgZzfF9YSPZvmT-QCPdFI97JEmDGKlj';
                  }
                }}
              />
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            <span className="w-5 h-1.5 rounded-full bg-[#1D4ED8]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
          </div>
        </div>

        {/* Col 3: Two Sub-Banners (3 cols) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
          {/* Sub-banner 1: Thu cũ đổi mới */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 flex flex-col justify-between shadow-none hover:border-[#1D4ED8] transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-bold px-1.5 py-0.5 rounded">
                TRỢ GIÁ THU CŨ
              </span>
              <h3 className="text-xs font-bold text-[#111827] mt-1">Thu Cũ Đổi Mới Trợ Giá 3.000.000₫</h3>
              <p className="text-[11px] text-gray-500">Áp dụng cho iPhone, MacBook, Laptop Gaming toàn quốc.</p>
            </div>
            <div className="pt-2">
              <Link to="/categories" className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1">
                <span>Xem bảng giá thu</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Link>
            </div>
          </div>

          {/* Sub-banner 2: Trả góp 0% */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 flex flex-col justify-between shadow-none hover:border-[#1D4ED8] transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] bg-[#FEF2F2] text-[#D70018] border border-[#FECACA] font-bold px-1.5 py-0.5 rounded">
                LÃI SUẤT 0%
              </span>
              <h3 className="text-xs font-bold text-[#111827] mt-1">Trả Góp 0% Duyệt Nhanh 5 Phút</h3>
              <p className="text-[11px] text-gray-500">Qua thẻ tín dụng hoặc CCCD gắn chip, không giữ giấy tờ.</p>
            </div>
            <div className="pt-2">
              <Link to="/categories" className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1">
                <span>Xem chi tiết điều kiện</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 TRUST BADGES STRIP (Screen 4 Retail Standard) */}
      <section className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 shadow-none">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl text-[#1D4ED8]">verified</span>
            <div>
              <div className="font-semibold text-[#111827]">100% Chính Hãng</div>
              <div className="text-[11px] text-gray-500">Bảo hành chính hãng 24 tháng</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl text-[#1D4ED8]">local_shipping</span>
            <div>
              <div className="font-semibold text-[#111827]">Giao Hàng GHN 2h</div>
              <div className="text-[11px] text-gray-500">Miễn phí ship đơn từ 1.000.000₫</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl text-[#1D4ED8]">published_with_changes</span>
            <div>
              <div className="font-semibold text-[#111827]">Đổi Mới 30 Ngày</div>
              <div className="text-[11px] text-gray-500">Lỗi 1 đổi 1 tận nơi nhanh chóng</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl text-[#1D4ED8]">credit_card</span>
            <div>
              <div className="font-semibold text-[#111827]">Trả Góp 0% Lãi Suất</div>
              <div className="text-[11px] text-gray-500">Duyệt hồ sơ online trong 5 phút</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FLASH SALE GIỜ VÀNG */}
      <FlashSaleSection />

      {/* SECTION 4: 3D INTERACTIVE SPOTLIGHT SHOWCASE */}
      <section className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-none">
        <div className="flex items-center justify-between mb-3 border-b border-[#E5E7EB] pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#1D4ED8]">view_in_ar</span>
            <h3 className="text-sm font-bold text-[#111827]">Trải Nghiệm Tương Tác Mô Hình 3D Xoay 360°</h3>
          </div>
          <span className="text-[11px] text-gray-500 hidden sm:inline">Dùng chuột hoặc ngón tay để xoay đa chiều</span>
        </div>
        <Hero3DShowcase />
      </section>

      {/* SECTION 5: FEATURED PRODUCTS WITH CATEGORY TABS */}
      <section className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-none space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#D70018]">local_fire_department</span>
            <h2 className="text-base font-bold text-[#111827]">Sản Phẩm Nổi Bật & Bán Chạy</h2>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-[#F3F4F6] text-gray-700 hover:bg-[#E5E7EB]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('laptop')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === 'laptop'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-[#F3F4F6] text-gray-700 hover:bg-[#E5E7EB]'
              }`}
            >
              Laptop
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phone')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === 'phone'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-[#F3F4F6] text-gray-700 hover:bg-[#E5E7EB]'
              }`}
            >
              Điện thoại
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pc')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === 'pc'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-[#F3F4F6] text-gray-700 hover:bg-[#E5E7EB]'
              }`}
            >
              PC & Linh kiện
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Đang nạp danh sách sản phẩm nổi bật..." />
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            Chưa có sản phẩm nào trong mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 6: TWO UTILITY BANNERS (PC Builder & Order Tracking - Screen 4 Retail Standard) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Banner 1: Build PC */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-none flex flex-col justify-between" id="pc-builder">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#1D4ED8]">construction</span>
              <h3 className="text-base font-bold text-[#111827]">Xây dựng cấu hình PC</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tự do phối ghép linh kiện máy tính, hệ thống tự động kiểm tra tương thích giữa CPU, Mainboard, RAM, Nguồn và vỏ Case. Đảm bảo cấu hình tối ưu chi phí và hiệu năng.
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#15803D]">check_circle</span>
                Tự động tính công suất nguồn (W)
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#15803D]">check_circle</span>
                Dự đoán FPS Gaming AI
              </span>
            </div>
          </div>
          <div className="pt-4">
            <Link
              to="/pc-builder"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded text-xs font-semibold transition-colors"
            >
              <span>Bắt đầu ráp PC ngay</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Banner 2: Order & Warranty Tracking */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-none flex flex-col justify-between" id="tracking">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#1D4ED8]">manage_search</span>
              <h3 className="text-base font-bold text-[#111827]">Tra cứu đơn hàng & Bảo hành</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kiểm tra chi tiết lộ trình vận chuyển GHN thời gian thực và tra cứu thông tin bảo hành điện tử e-Warranty theo mã đơn hàng, số điện thoại hoặc số Serial/IMEI thiết bị.
            </p>
            <form onSubmit={handleTrackingSubmit} className="pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Nhập mã đơn hàng hoặc SĐT..."
                  className="flex-1 h-9 px-3 bg-white border border-[#D1D5DB] rounded text-xs text-[#111827] focus:outline-none focus:border-[#1D4ED8]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded text-xs font-semibold transition-colors shrink-0"
                >
                  Tra cứu ngay
                </button>
              </div>
            </form>
          </div>
          <div className="pt-3 text-[11px] text-gray-500 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-gray-400">info</span>
            <span>Bảo hành chính hãng 1 đổi 1 trong 30 ngày đầu tiên nếu phát sinh lỗi</span>
          </div>
        </div>
      </section>

      {/* SECTION 7: SẢN PHẨM ĐÃ XEM GẦN ĐÂY */}
      <RecentlyViewedBar />
    </div>
  );
};

export default HomePage;
