import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import catalogApi from '../../../api/catalogApi';
import {
  CategoryDetailDto,
  CategoryTreeDto,
  CategoryFiltersDto,
  BrandDto,
  ProductListDto,
  PagedResult,
} from '../../../types/catalog';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { formatVND } from '../../../utils/format';
import SEOHead, { buildBreadcrumbSchema } from '../../../components/common/SEOHead';

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 10 triệu', min: 0, max: 10000000 },
  { label: '10 – 20 triệu', min: 10000000, max: 20000000 },
  { label: '20 – 30 triệu', min: 20000000, max: 30000000 },
  { label: '30 – 50 triệu', min: 30000000, max: 50000000 },
  { label: 'Trên 50 triệu', min: 50000000, max: undefined },
];

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetailDto | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFiltersDto | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeDto[]>([]);
  const [allBrands, setAllBrands] = useState<BrandDto[]>([]);
  const [pagedData, setPagedData] = useState<PagedResult<ProductListDto>>({
    items: [],
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Custom price input state
  const [customMinInput, setCustomMinInput] = useState('');
  const [customMaxInput, setCustomMaxInput] = useState('');

  // Parse search params from URL
  const searchQuery = searchParams.get('search') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const selectedSort = (searchParams.get('sort') || 'newest') as 'newest' | 'price_asc' | 'price_desc';
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // Sync inputs when params change
  useEffect(() => {
    setCustomMinInput(minPriceParam !== undefined ? minPriceParam.toString() : '');
    setCustomMaxInput(maxPriceParam !== undefined ? maxPriceParam.toString() : '');
  }, [minPriceParam, maxPriceParam]);

  // Collect specs from URL: specs[ram]=16GB -> specs: { ram: '16GB' }
  const selectedSpecs = useMemo(() => {
    const specs: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      const match = key.match(/^specs\[(.*?)\]$/);
      if (match && match[1]) {
        specs[match[1]] = value;
      }
    }
    return specs;
  }, [searchParams]);

  // Load category tree and brands once
  useEffect(() => {
    catalogApi.getCategoryTree().then(setCategoryTree);
    catalogApi.getBrands().then(setAllBrands);
  }, []);

  // Load category details and dynamic filters when slug changes
  useEffect(() => {
    if (slug) {
      catalogApi.getCategoryBySlug(slug).then(setCategoryDetail);
      catalogApi.getCategoryFilters(slug).then(setCategoryFilters);
    } else {
      setCategoryDetail(null);
      catalogApi.getCategoryFilters('all').then(setCategoryFilters);
    }
  }, [slug]);

  // Load products when filters or slug change
  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await catalogApi.getProducts({
          categorySlug: slug,
          brandSlug: selectedBrand || undefined,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          search: searchQuery || undefined,
          sort: selectedSort,
          specs: Object.keys(selectedSpecs).length > 0 ? selectedSpecs : undefined,
          page: currentPage,
          pageSize: 12,
        });

        if (isMounted) {
          setPagedData(res);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [slug, selectedBrand, minPriceParam, maxPriceParam, searchQuery, selectedSort, selectedSpecs, currentPage]);

  // URL update helpers
  const updateQuery = (updates: Record<string, string | null | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === undefined || val === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    }
    if (!('page' in updates)) {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleBrandChange = (brandSlug: string) => {
    updateQuery({ brand: selectedBrand === brandSlug ? null : brandSlug });
  };

  const handlePricePreset = (min?: number, max?: number) => {
    updateQuery({
      minPrice: min !== undefined ? min.toString() : null,
      maxPrice: max !== undefined ? max.toString() : null,
    });
  };

  const handleCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const min = customMinInput ? Number(customMinInput) : undefined;
    const max = customMaxInput ? Number(customMaxInput) : undefined;
    handlePricePreset(min, max);
  };

  const handleSpecChange = (specKey: string, specVal: string) => {
    const current = selectedSpecs[specKey];
    const key = `specs[${specKey}]`;
    if (current === specVal) {
      updateQuery({ [key]: null });
    } else {
      updateQuery({ [key]: specVal });
    }
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('search', searchQuery);
    setSearchParams(newParams);
  };

  const hasActiveFilters = Boolean(
    selectedBrand || minPriceParam !== undefined || maxPriceParam !== undefined || Object.keys(selectedSpecs).length > 0
  );

  const activeBrandName = useMemo(() => {
    if (!selectedBrand) return '';
    const b = allBrands.find((brand) => brand.slug === selectedBrand);
    return b ? b.name : selectedBrand;
  }, [selectedBrand, allBrands]);

  const pageTitle = categoryDetail?.name
    ? `${categoryDetail.name} Chính Hãng, Giá Tốt Nhất`
    : searchQuery
      ? `Tìm kiếm "${searchQuery}"`
      : 'Tất Cả Thiết Bị Công Nghệ Chính Hãng';

  const pageDesc = categoryDetail?.description
    ? categoryDetail.description
    : `Khám phá danh sách ${categoryDetail?.name || 'sản phẩm công nghệ'} chính hãng tại MadK Store. Giá ưu đãi, trả góp 0%, hỗ trợ trải nghiệm 3D trực quan.`;

  const breadcrumbList = slug
    ? [
        { name: 'Trang chủ', url: '/' },
        { name: 'Danh mục', url: '/categories' },
        { name: categoryDetail?.name || slug, url: `/categories/${slug}` },
      ]
    : [
        { name: 'Trang chủ', url: '/' },
        { name: 'Danh mục sản phẩm', url: '/categories' },
      ];

  const brandsList = categoryFilters?.brands && categoryFilters.brands.length > 0 ? categoryFilters.brands : allBrands;

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-4 space-y-3.5">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonicalUrl={slug ? `https://madk.store/categories/${slug}` : 'https://madk.store/categories'}
        keywords={`madk store, ${categoryDetail?.name || 'thiết bị công nghệ'}, mua ${categoryDetail?.name || 'công nghệ'}`}
        structuredData={buildBreadcrumbSchema(breadcrumbList)}
      />

      {/* BREADCRUMB (Stitch Screen 1) */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link to="/" className="hover:text-[#1D4ED8] flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-sm">home</span>
          <span>Trang chủ</span>
        </Link>
        <span>/</span>
        {slug ? (
          <>
            <Link to="/categories" className="hover:text-[#1D4ED8] transition-colors">
              Danh mục
            </Link>
            <span>/</span>
            <span className="text-[#111827] font-semibold">{categoryDetail?.name || slug}</span>
          </>
        ) : (
          <span className="text-[#111827] font-semibold">Tất cả sản phẩm</span>
        )}
      </nav>

      {/* CATEGORY HEADER ROW */}
      <div className="flex items-baseline justify-between gap-4 border-b border-[#E5E7EB] pb-2">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[20px] font-bold text-[#111827] tracking-tight">
            {categoryDetail?.name || (searchQuery ? `Kết quả cho "${searchQuery}"` : 'Tất cả thiết bị công nghệ')}
          </h1>
          <span className="text-xs text-gray-500">({pagedData.totalItems} sản phẩm)</span>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden px-3 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#111827] rounded text-xs font-semibold flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">tune</span>
          <span>Bộ lọc</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]"></span>
          )}
        </button>
      </div>

      {/* QUICK BRAND STRIP / PILLS (Stitch Screen 1) */}
      {brandsList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
          <button
            type="button"
            onClick={() => handleBrandChange('')}
            className={`px-3 py-1.5 rounded text-xs font-semibold shrink-0 transition-colors border ${
              !selectedBrand
                ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                : 'bg-white text-[#111827] hover:text-[#1D4ED8] hover:border-[#1D4ED8] border-[#E5E7EB]'
            }`}
          >
            Tất cả
          </button>
          {brandsList.map((b) => {
            const isSelected = selectedBrand === b.slug;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleBrandChange(b.slug)}
                className={`px-3 py-1.5 rounded text-xs font-medium shrink-0 transition-colors border ${
                  isSelected
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#111827] hover:text-[#1D4ED8] hover:border-[#1D4ED8] border-[#E5E7EB]'
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      )}

      {/* SORT & ACTIVE FILTER BAR (Stitch Screen 1) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-gray-500 mr-1">Đang lọc:</span>
          {activeBrandName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium text-[#111827]">
              {activeBrandName}
              <button onClick={() => handleBrandChange('')} className="text-gray-400 hover:text-red-600">✕</button>
            </span>
          )}
          {(minPriceParam !== undefined || maxPriceParam !== undefined) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium text-[#111827]">
              {minPriceParam ? formatVND(minPriceParam) : '0₫'} – {maxPriceParam ? formatVND(maxPriceParam) : 'Max'}
              <button onClick={() => handlePricePreset(undefined, undefined)} className="text-gray-400 hover:text-red-600">✕</button>
            </span>
          )}
          {Object.entries(selectedSpecs).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium text-[#111827]">
              {v}
              <button onClick={() => handleSpecChange(k, v)} className="text-gray-400 hover:text-red-600">✕</button>
            </span>
          ))}
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-xs text-[#1D4ED8] hover:underline font-medium ml-1">
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Right: Sort buttons */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Sắp xếp:</span>
          <button
            type="button"
            onClick={() => updateQuery({ sort: 'newest' })}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedSort === 'newest'
                ? 'bg-[#1D4ED8] text-white font-semibold'
                : 'text-gray-600 hover:text-[#111827] bg-[#F3F4F6]'
            }`}
          >
            Mới nhất
          </button>
          <button
            type="button"
            onClick={() => updateQuery({ sort: 'price_asc' })}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedSort === 'price_asc'
                ? 'bg-[#1D4ED8] text-white font-semibold'
                : 'text-gray-600 hover:text-[#111827] bg-[#F3F4F6]'
            }`}
          >
            Giá thấp → cao
          </button>
          <button
            type="button"
            onClick={() => updateQuery({ sort: 'price_desc' })}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedSort === 'price_desc'
                ? 'bg-[#1D4ED8] text-white font-semibold'
                : 'text-gray-600 hover:text-[#111827] bg-[#F3F4F6]'
            }`}
          >
            Giá cao → thấp
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT: SIDEBAR + PRODUCT GRID */}
      <div className="flex flex-col lg:flex-row items-start gap-3.5">
        {/* LEFT FILTER SIDEBAR (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white border border-[#E5E7EB] rounded-lg p-3.5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-[#111827]">
              <span className="material-symbols-outlined text-base text-gray-600">tune</span>
              <span>Bộ lọc sản phẩm</span>
            </div>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-xs text-[#1D4ED8] hover:underline" type="button">
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-1.5 pb-3 border-b border-[#E5E7EB]">
            <div className="text-xs font-semibold text-[#111827]">Danh mục</div>
            <div className="space-y-1 text-xs">
              <Link
                to="/categories"
                className={`block px-2 py-1 rounded ${!slug ? 'bg-[#EFF6FF] text-[#1D4ED8] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Tất cả sản phẩm
              </Link>
              {categoryTree.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className={`block px-2 py-1 rounded truncate ${slug === cat.slug ? 'bg-[#EFF6FF] text-[#1D4ED8] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2 pb-3 border-b border-[#E5E7EB]">
            <div className="text-xs font-semibold text-[#111827]">Thương hiệu</div>
            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              {brandsList.map((b) => {
                const isChecked = selectedBrand === b.slug;
                return (
                  <label key={b.id} className="flex items-center justify-between hover:text-[#1D4ED8] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBrandChange(b.slug)}
                        className="w-3.5 h-3.5 rounded border-[#D1D5DB] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                      />
                      <span>{b.name}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2 pb-3 border-b border-[#E5E7EB]">
            <div className="text-xs font-semibold text-[#111827]">Khoảng giá</div>
            <form onSubmit={handleCustomPriceSubmit} className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  placeholder="Từ (₫)"
                  value={customMinInput}
                  onChange={(e) => setCustomMinInput(e.target.value)}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1 text-[#111827] focus:outline-none focus:border-[#1D4ED8]"
                />
                <input
                  type="number"
                  placeholder="Đến (₫)"
                  value={customMaxInput}
                  onChange={(e) => setCustomMaxInput(e.target.value)}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1 text-[#111827] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB] rounded text-xs font-semibold transition-colors"
              >
                Áp dụng
              </button>
            </form>

            <div className="flex flex-wrap gap-1 pt-1">
              {PRICE_PRESETS.map((preset, idx) => {
                const isSelected = minPriceParam === preset.min && maxPriceParam === preset.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePricePreset(preset.min, preset.max)}
                    className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                      isSelected
                        ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                        : 'border-[#E5E7EB] text-gray-600 hover:border-[#1D4ED8]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Spec Filters */}
          {categoryFilters?.specFilters && categoryFilters.specFilters.map((spec) => (
            <div key={spec.key} className="space-y-2 pb-3 border-b border-[#E5E7EB] last:border-0">
              <div className="text-xs font-semibold text-[#111827]">{spec.label}</div>
              <div className="flex flex-wrap gap-1 text-xs">
                {spec.options.map((opt) => {
                  const isSelected = selectedSpecs[spec.key] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSpecChange(spec.key, opt)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${
                        isSelected
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                          : 'border-[#E5E7EB] text-gray-600 hover:border-[#1D4ED8]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* RIGHT PRODUCT RESULTS (4-Column Dense Grid - Stitch Screen 1) */}
        <div className="flex-1 w-full space-y-3.5">
          {loading ? (
            <div className="py-16 bg-white border border-[#E5E7EB] rounded-lg">
              <LoadingSpinner message="Đang tải danh sách sản phẩm..." />
            </div>
          ) : pagedData.items.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#E5E7EB] rounded-lg p-6 space-y-3">
              <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
              <p className="text-sm font-semibold text-gray-700">Không tìm thấy sản phẩm phù hợp.</p>
              <p className="text-xs text-gray-400">Vui lòng thử điều chỉnh lại bộ lọc hoặc tìm từ khóa khác.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-[#1D4ED8] text-white rounded text-xs font-semibold"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                {pagedData.items.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagedData.totalPages > 1 && (
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Trang {pagedData.page} / {pagedData.totalPages} ({pagedData.totalItems} sản phẩm)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pagedData.page <= 1}
                      onClick={() => updateQuery({ page: (pagedData.page - 1).toString() })}
                      className="px-3 py-1.5 border border-[#D1D5DB] rounded text-gray-700 hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      &larr; Trước
                    </button>
                    {Array.from({ length: Math.min(5, pagedData.totalPages) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => updateQuery({ page: p.toString() })}
                          className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                            pagedData.page === p
                              ? 'bg-[#1D4ED8] text-white'
                              : 'hover:bg-[#F3F4F6] text-gray-700'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={pagedData.page >= pagedData.totalPages}
                      onClick={() => updateQuery({ page: (pagedData.page + 1).toString() })}
                      className="px-3 py-1.5 border border-[#D1D5DB] rounded text-gray-700 hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sau &rarr;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MOBILE FILTER SHEET DRAWER (Stitch Screen 14: Mobile 390px Filter Sheet) */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-[#1D4ED8]">tune</span>
                <span className="font-bold text-sm text-[#111827]">Bộ lọc sản phẩm</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Brands in Mobile Sheet */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#111827]">Thương hiệu</div>
              <div className="flex flex-wrap gap-1.5">
                {brandsList.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBrandChange(b.slug)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border ${
                      selectedBrand === b.slug
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                        : 'bg-white border-[#D1D5DB] text-gray-700'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Presets */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#111827]">Khoảng giá</div>
              <div className="flex flex-wrap gap-1.5">
                {PRICE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePricePreset(preset.min, preset.max)}
                    className={`px-2.5 py-1 rounded text-xs border ${
                      minPriceParam === preset.min && maxPriceParam === preset.max
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                        : 'bg-white border-[#D1D5DB] text-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setMobileFilterOpen(false);
                }}
                className="flex-1 py-2.5 border border-[#D1D5DB] rounded text-xs font-semibold text-gray-700"
              >
                Xóa tất cả
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded text-xs font-semibold"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
