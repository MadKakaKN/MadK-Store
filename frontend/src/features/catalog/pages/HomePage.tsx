import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import catalogApi from '../../../api/catalogApi';
import { CategoryTreeDto, ProductListDto } from '../../../types/catalog';
import ProductCard from '../components/ProductCard';
import Hero3DShowcase from '../components/Hero3DShowcase';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import SEOHead, { buildOrganizationSchema, buildWebSiteSchema } from '../../../components/common/SEOHead';
import { IconShield, IconTruck, IconStar, IconCube3D, IconLaptop } from '../../../components/common/Icons';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTreeDto[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductListDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [cats, productsRes] = await Promise.all([
          catalogApi.getCategoryTree(),
          catalogApi.getProducts({ isFeatured: true, pageSize: 8 }),
        ]);

        if (isMounted) {
          setCategories(cats);
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

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-14 sm:space-y-20">
      <SEOHead
        title="MadK Store - Thiết bị công nghệ chính hãng & Trải nghiệm 3D"
        description="MadK Store phân phối điện thoại thông minh, laptop gaming, linh kiện PC và phụ kiện công nghệ chính hãng với trải nghiệm tương tác mô hình 3D trực quan."
        canonicalUrl="https://madk.store/"
        keywords="madk store, điện thoại chính hãng, laptop gaming, linh kiện pc, trải nghiệm 3d, mua hàng công nghệ"
        structuredData={[buildOrganizationSchema(), buildWebSiteSchema()]}
      />

      {/* Hero Section Banner - Sapphire Luxury Tech Style */}
      <section className="relative rounded-3.5xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-10 lg:p-14 overflow-hidden shadow-2xl border border-slate-800/80">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Text & Primary CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-500/15 text-blue-300 border border-blue-400/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>MADK NEXT-GEN 3D COMMERCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1]">
              Khám phá thiết bị công nghệ đỉnh cao cùng{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
                MadK Store
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300/90 leading-relaxed max-w-xl">
              Hệ thống phân phối điện thoại thông minh, laptop cao cấp, linh kiện PC và gaming gear chính hãng. 
              Trải nghiệm xoay 360° tương tác mô hình 3D chân thực trước khi quyết định sở hữu.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/categories"
                className="inline-flex items-center justify-center px-7 py-4 rounded-2.5xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/30 hover:scale-102 active:scale-98"
              >
                <span>Khám phá ngay</span>
                <span className="ml-2">&rarr;</span>
              </Link>
              <Link
                to="/categories/laptop"
                className="inline-flex items-center justify-center px-6 py-4 rounded-2.5xl font-bold text-sm sm:text-base text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:text-white transition-all backdrop-blur-md"
              >
                Xem Laptop Gaming
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Video Showcase & Spotlight Devices */}
          <div className="lg:col-span-5">
            <Hero3DShowcase />
          </div>
        </div>

        {/* Feature badges row */}
        <div className="relative z-10 mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm text-slate-300 font-semibold">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/20 text-blue-400 flex items-center justify-center"><IconShield className="w-4 h-4" /></span>
            <span>100% Chính hãng</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/20 text-blue-400 flex items-center justify-center"><IconTruck className="w-4 h-4" /></span>
            <span>Giao nhanh GHN</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/20 text-amber-400 flex items-center justify-center"><IconStar className="w-4 h-4" /></span>
            <span>Tích điểm tới 5%</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-400/20 text-indigo-400 flex items-center justify-center"><IconCube3D className="w-4 h-4" /></span>
            <span>Mô hình 3D xoay 360°</span>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Hệ sinh thái sản phẩm
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Danh mục công nghệ
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span>Tất cả danh mục</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-card-hover hover:border-blue-300/80 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2.5xl bg-gradient-to-tr from-blue-50 to-indigo-50 group-hover:from-blue-600 group-hover:to-indigo-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 overflow-hidden shadow-xs">
                  {cat.iconUrl ? (
                    <img src={cat.iconUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <IconLaptop className="w-7 h-7" />
                  )}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 group-hover:text-blue-600 text-base sm:text-lg transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              {cat.children && cat.children.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {cat.children.slice(0, 2).map((sub) => (
                    <span
                      key={sub.id}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Hot Deal & Trend 3D
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Sản phẩm nổi bật
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span>Xem tất cả</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Đang nạp danh sách sản phẩm nổi bật..." />
        ) : featuredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-slate-500 font-medium">Chưa có sản phẩm nổi bật nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3D Interactive Feature Callout Banner */}
      <section className="rounded-3.5xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl border border-blue-900/40 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl relative z-10 space-y-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
            ĐỘC QUYỀN MADK STORE
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trải nghiệm tương tác 3D WebGL xoay 360°
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Xem cận cảnh từng đường nét, xoay đa chiều, khám phá chân thực thiết kế vỏ máy và linh kiện trước khi đặt hàng. 
            Tất cả sản phẩm đều được kiểm định chất lượng và hỗ trợ giao hàng hỏa tốc GHN.
          </p>
        </div>

        <Link
          to="/categories"
          className="relative z-10 px-7 py-3.5 rounded-2.5xl font-bold text-xs sm:text-sm bg-white text-slate-950 hover:bg-blue-50 transition-all shadow-xl shadow-black/20 hover:scale-105 flex-shrink-0"
        >
          Trải nghiệm ngay &rarr;
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
