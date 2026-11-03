import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import catalogApi from '../../api/catalogApi';
import { ProductListDto } from '../../types/catalog';

export interface TrendingItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnailUrl: string;
  categoryName: string;
  has3D?: boolean;
}

// 10 Hot Recommended Products specifically from MadKStore's catalog
const TRENDING_STORE_PRODUCTS: TrendingItem[] = [
  {
    id: 'p-1',
    name: 'iPhone 15 Pro Max',
    slug: 'dien-thoai-iphone-15-pro-max',
    price: 34990000,
    thumbnailUrl: '/images/products/dien-thoai-iphone-15-pro-max.png',
    categoryName: 'Điện thoại',
    has3D: true,
  },
  {
    id: 'p-5',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'dien-thoai-samsung-galaxy-s24-ultra',
    price: 31990000,
    thumbnailUrl: '/images/products/dien-thoai-samsung-galaxy-s24-ultra.png',
    categoryName: 'Điện thoại',
    has3D: true,
  },
  {
    id: 'p-11',
    name: 'MacBook Pro 16 M3 Max',
    slug: 'laptop-apple-macbook-pro-16-m3-max',
    price: 89990000,
    thumbnailUrl: '/images/products/laptop-apple-macbook-pro-16-m3-max.png',
    categoryName: 'Laptop Apple',
    has3D: true,
  },
  {
    id: 'p-12',
    name: 'ASUS ROG Strix SCAR 16',
    slug: 'laptop-asus-rog-strix-scar-16-2024',
    price: 74990000,
    thumbnailUrl: '/images/products/laptop-asus-rog-strix-scar-16-2024.png',
    categoryName: 'Laptop Gaming',
    has3D: true,
  },
  {
    id: 'p-21',
    name: 'iPad Pro 13 M4 OLED',
    slug: 'may-tinh-bang-ipad-pro-m4-13-inch',
    price: 37990000,
    thumbnailUrl: '/images/products/may-tinh-bang-ipad-pro-m4-13-inch.png',
    categoryName: 'Máy tính bảng',
    has3D: true,
  },
  {
    id: 'p-31',
    name: 'VGA ASUS ROG Strix RTX 4090',
    slug: 'vga-asus-rog-strix-geforce-rtx-4090-oc-24gb',
    price: 59990000,
    thumbnailUrl: '/images/products/vga-asus-rog-strix-geforce-rtx-4090-oc-24gb.png',
    categoryName: 'Card đồ họa',
    has3D: true,
  },
  {
    id: 'p-32',
    name: 'Bàn phím cơ Keychron Q1 Pro',
    slug: 'ban-phim-co-keychron-q1-pro-wireless',
    price: 4500000,
    thumbnailUrl: '/images/products/ban-phim-co-keychron-q1-pro-wireless.png',
    categoryName: 'Bàn phím cơ',
    has3D: true,
  },
  {
    id: 'p-41',
    name: 'Chuột Logitech G Pro X Superlight 2',
    slug: 'chuot-gaming-logitech-g-pro-x-superlight-2',
    price: 3490000,
    thumbnailUrl: '/images/products/chuot-gaming-logitech-g-pro-x-superlight-2.png',
    categoryName: 'Chuột Gaming',
    has3D: true,
  },
  {
    id: 'p-51',
    name: 'Tai nghe Sony WH-1000XM5',
    slug: 'tai-nghe-chong-on-sony-wh-1000xm5',
    price: 8490000,
    thumbnailUrl: '/images/products/tai-nghe-chong-on-sony-wh-1000xm5.png',
    categoryName: 'Tai nghe',
    has3D: true,
  },
  {
    id: 'p-71',
    name: 'SSD Samsung 990 PRO 2TB NVMe',
    slug: 'o-cung-ssd-samsung-990-pro-m2-nvme-pcie-40-2tb',
    price: 4890000,
    thumbnailUrl: '/images/products/o-cung-ssd-samsung-990-pro-m2-nvme-pcie-40-2tb.png',
    categoryName: 'Ổ cứng SSD',
    has3D: true,
  },
];

const POPULAR_SEARCH_TAGS = [
  'iPhone 15 Pro Max',
  'MacBook Pro',
  'RTX 4090',
  'Keychron',
  'Logitech G Pro',
  'Sony XM5',
  'SSD 2TB',
];

interface SearchBoxProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ isMobile = false, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [liveResults, setLiveResults] = useState<ProductListDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [trendingProducts, setTrendingProducts] = useState<TrendingItem[]>(TRENDING_STORE_PRODUCTS);

  // Load real featured products from database for trending list
  useEffect(() => {
    let isMounted = true;
    catalogApi
      .getProducts({ isFeatured: true, pageSize: 10 })
      .then((res) => {
        if (isMounted && res.items && res.items.length > 0) {
          setTrendingProducts(
            res.items.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.minPrice || p.basePrice,
              thumbnailUrl:
                p.thumbnailUrl ||
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80',
              categoryName: p.categoryName || 'Sản phẩm',
              has3D: !!p.model3DUrl,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Realtime search with debounce calling backend API (Supabase)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await catalogApi.getProducts({ search: q, pageSize: 6 });
        setLiveResults(res.items || []);
      } catch (err) {
        console.warn('Realtime search failed:', err);
        setLiveResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/categories?search=${encodeURIComponent(query.trim())}`);
      onNavigate?.();
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    navigate(`/products/${slug}`);
    onNavigate?.();
  };

  const handleSelectTag = (tag: string) => {
    setQuery(tag);
    setIsOpen(false);
    navigate(`/categories?search=${encodeURIComponent(tag)}`);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder="Bạn muốn mua gì hôm nay? (Tìm điện thoại, laptop, linh kiện...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={`w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm transition-all border border-transparent focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 ${
            isMobile
              ? 'rounded-xl pl-9 pr-14 py-2 border-slate-200'
              : 'rounded-2xl pl-11 pr-24 py-2.5 sm:py-3'
          }`}
        />

        {/* Search Icon */}
        <div
          className={`absolute pointer-events-none text-slate-400 top-1/2 -translate-y-1/2 ${
            isMobile ? 'left-3' : 'left-3.5'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Clear query button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 ${
              isMobile ? 'right-12' : 'right-14'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search Action Button */}
        <button
          type="submit"
          className={`absolute top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors shadow-sm ${
            isMobile
              ? 'right-1 text-xs px-2.5 py-1 rounded-lg'
              : 'right-1.5 text-xs px-3 py-1.5 sm:py-2 rounded-xl'
          }`}
        >
          Tìm
        </button>
      </form>

      {/* ──── RECOMMENDATION & SEARCH RESULTS DROPDOWN ──── */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
            isMobile
              ? 'w-full max-h-[75vh] overflow-y-auto'
              : 'w-[100%] sm:w-[580px] max-h-[85vh] overflow-y-auto left-0 md:-left-4'
          }`}
        >
          {/* 1. If Query is Empty: SHOW TRENDING & STORE RECOMMENDATIONS */}
          {!query.trim() && (
            <div className="p-3 sm:p-4 space-y-4">
              {/* Promotional Top Banner (as in user reference image) */}
              <div
                onClick={() => {
                  setIsOpen(false);
                  navigate('/categories');
                  onNavigate?.();
                }}
                className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 sm:p-4 text-white shadow-lg border border-slate-800 transition-all hover:shadow-indigo-500/10"
              >
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                      🔥 Siêu Sale Công Nghệ 2026
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-indigo-200 transition-colors">
                      Trải nghiệm Mô hình 3D Flagship tương tác
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Hơn 75+ điện thoại, laptop, linh kiện PC cao cấp chính hãng
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold group-hover:bg-indigo-50 transition-colors shadow-sm">
                      Xem ngay →
                    </span>
                  </div>
                </div>

                {/* Subtle visual glow */}
                <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Header "Xu hướng tìm kiếm" */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔥</span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Xu hướng tìm kiếm
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Sản phẩm nổi bật tại MadKStore
                </span>
              </div>

              {/* 2-Column Grid of Store Products */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trendingProducts.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectProduct(prod.slug)}
                    className="flex items-center gap-2.5 p-2 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group"
                  >
                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/60">
                      <img
                        src={prod.thumbnailUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      {prod.has3D && (
                        <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl bg-indigo-600 text-white text-[8px] font-bold">
                          3D
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-brand-600 truncate transition-colors">
                        {prod.name}
                      </div>
                      <div className="text-[11px] font-bold text-emerald-600">
                        {prod.price.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Popular quick tags */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">
                  Từ khóa tìm kiếm phổ biến:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectTag(tag)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-brand-600 text-[11px] font-medium transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. If Query has Text: SHOW REALTIME SEARCH RESULTS */}
          {query.trim().length > 0 && (
            <div className="p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>
                  Gợi ý tìm kiếm cho: <strong className="text-slate-900">"{query}"</strong>
                </span>
                {!isSearching && <span>{liveResults.length} kết quả</span>}
              </div>

              {isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Đang tìm kiếm trong kho dữ liệu...</span>
                </div>
              ) : liveResults.length > 0 ? (
                <div className="space-y-1">
                  {liveResults.map((p) => {
                    const price = p.minPrice || p.basePrice || 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p.slug)}
                        className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base">📦</div>
                          )}
                          {p.model3DUrl && (
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl bg-indigo-600 text-white text-[8px] font-bold">
                              3D
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-brand-600 truncate transition-colors">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-bold text-emerald-600">
                              {price.toLocaleString('vi-VN')} đ
                            </span>
                            {p.categoryName && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 truncate">{p.categoryName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-brand-600 transition-colors">
                          →
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full mt-2 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition-colors text-center"
                  >
                    Xem tất cả kết quả cho "{query}" →
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-sm text-slate-500">
                    Không tìm thấy sản phẩm nào khớp với <strong>"{query}"</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/categories');
                      onNavigate?.();
                    }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    Duyệt tất cả danh mục sản phẩm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
