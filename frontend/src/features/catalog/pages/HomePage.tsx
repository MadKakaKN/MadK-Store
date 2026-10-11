import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import catalogApi from '../../../api/catalogApi';
import { CategoryTreeDto, ProductListDto } from '../../../types/catalog';
import ProductCard from '../components/ProductCard';
import Hero3DShowcase from '../components/Hero3DShowcase';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

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
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 sm:space-y-16">
      {/* Hero Section Banner */}
      <section className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white p-6 sm:p-10 lg:p-14 overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.25),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (7 cols): Hero Text & Primary CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
              MadK Store Next-Gen Commerce
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-tight">
              Khám phá thiết bị công nghệ đỉnh cao cùng{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-300">
                MadK Store
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-xl">
              Hệ thống phân phối điện thoại thông minh, laptop gaming, linh kiện PC và gaming gear chính hãng.
              Trải nghiệm video 3D chân thực và sẵn sàng tương tác mô hình 3D đa chiều trên từng sản phẩm.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/categories"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Mua sắm ngay &rarr;
              </Link>
              <Link
                to="/categories/laptop"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:text-white transition-all backdrop-blur-sm"
              >
                Xem Laptop Gaming
              </Link>
            </div>
          </div>

          {/* Right Column (5 cols): 3D Video Showcase & Spotlight Devices */}
          <div className="lg:col-span-5">
            <Hero3DShowcase />
          </div>
        </div>

        {/* Feature badges row */}
        <div className="relative z-10 mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span>100% Chính hãng</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <span>Đổi trả 7 ngày</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚚</span>
            <span>Giao hỏa tốc 2H</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <span>Sẵn sàng mô hình 3D</span>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block">
              Khám phá ngay
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Danh mục công nghệ
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            <span>Tất cả</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center transition-colors duration-300 overflow-hidden shadow-inner">
                  {cat.iconUrl ? (
                    <img src={cat.iconUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">💻</span>
                  )}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 group-hover:text-brand-600 text-base sm:text-lg transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              {cat.children && cat.children.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {cat.children.slice(0, 2).map((sub) => (
                    <span
                      key={sub.id}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors"
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
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block">
              Hot Deal & Trend
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Sản phẩm nổi bật
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            <span>Xem thêm</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Đang nạp danh sách sản phẩm nổi bật..." />
        ) : featuredProducts.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
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
      <section className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-12 shadow-xl border border-indigo-800/50 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
            Sắp ra mắt trong Giai đoạn 2
          </span>
          <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold">
            Trải nghiệm tương tác 3D WebGL trực quan
          </h3>
          <p className="mt-2 text-sm text-indigo-200 leading-relaxed">
            Xem cận cảnh từng chi tiết sản phẩm, xoay 360 độ, đổi màu sắc và bóc tách linh kiện công
            nghệ chân thực nhất trước khi quyết định mua hàng.
          </p>
        </div>

        <Link
          to="/categories"
          className="px-6 py-3 rounded-2xl font-bold text-sm bg-white text-indigo-950 hover:bg-indigo-50 transition-colors shadow-lg shadow-black/30 flex-shrink-0"
        >
          Khám phá danh mục &rarr;
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
