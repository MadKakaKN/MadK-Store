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

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 10 triệu', min: 0, max: 10000000 },
  { label: '10 - 25 triệu', min: 10000000, max: 25000000 },
  { label: '25 - 50 triệu', min: 25000000, max: 50000000 },
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
      setCategoryFilters(null);
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
    // Always reset page to 1 when changing filters, unless page was specifically set
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

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-6 gap-2">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>&rsaquo;</span>
        {slug ? (
          <>
            <Link to="/categories" className="hover:text-brand-600 transition-colors">
              Danh mục
            </Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-slate-900 truncate">
              {categoryDetail?.name || slug}
            </span>
          </>
        ) : (
          <span className="font-semibold text-slate-900">Tất cả sản phẩm</span>
        )}
      </nav>

      {/* Category Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {categoryDetail?.name || (searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Tất cả sản phẩm')}
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
              {categoryDetail?.description ||
                'Khám phá bộ sưu tập thiết bị số, linh kiện máy tính và phụ kiện cao cấp chính hãng tại MadK Store.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200/60">
              {pagedData.totalItems} sản phẩm
            </span>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-6 sticky top-24 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>⚡</span> Bộ lọc tìm kiếm
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Categories Tree */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Danh mục
              </h3>
              <div className="space-y-1 text-sm">
                <Link
                  to="/categories"
                  className={`block px-3 py-2 rounded-xl font-medium transition-colors ${
                    !slug ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tất cả sản phẩm
                </Link>
                {categoryTree.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <Link
                      to={`/categories/${cat.slug}`}
                      className={`block px-3 py-2 rounded-xl font-medium transition-colors ${
                        slug === cat.slug ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat.name}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-4 space-y-1">
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/categories/${sub.slug}`}
                            className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              slug === sub.slug
                                ? 'bg-brand-50 text-brand-700 font-bold'
                                : 'text-slate-500 hover:text-brand-600 hover:bg-slate-50'
                            }`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Brands Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Thương hiệu
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(categoryFilters?.brands && categoryFilters.brands.length > 0
                  ? categoryFilters.brands
                  : allBrands
                ).map((b) => {
                  const isSelected = selectedBrand === b.slug;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBrandChange(b.slug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50'
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Presets & Custom inputs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Khoảng giá
              </h3>
              <div className="space-y-1.5">
                {PRICE_PRESETS.map((preset, index) => {
                  const isSelected =
                    minPriceParam === preset.min && maxPriceParam === preset.max;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePricePreset(preset.min, preset.max)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-300'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom price min-max */}
              <form onSubmit={handleCustomPriceSubmit} className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">Hoặc tự nhập khoảng giá:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Tối thiểu"
                    value={customMinInput}
                    onChange={(e) => setCustomMinInput(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="number"
                    placeholder="Tối đa"
                    value={customMaxInput}
                    onChange={(e) => setCustomMaxInput(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Áp dụng giá
                </button>
              </form>
            </div>

            {/* Dynamic Spec Filters from API */}
            {categoryFilters?.specFilters && categoryFilters.specFilters.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-slate-100">
                {categoryFilters.specFilters.map((spec) => (
                  <div key={spec.key}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {spec.label}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {spec.options.map((opt) => {
                        const isSelected = selectedSpecs[spec.key] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSpecChange(spec.key, opt)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-brand-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Products List Area */}
        <section className="lg:col-span-3 space-y-6">
          {/* Toolbar: Sort & Status */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Sắp xếp:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => updateQuery({ sort: 'newest' })}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedSort === 'newest'
                      ? 'bg-white text-brand-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mới nhất
                </button>
                <button
                  type="button"
                  onClick={() => updateQuery({ sort: 'price_asc' })}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedSort === 'price_asc'
                      ? 'bg-white text-brand-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Giá thấp &rarr; cao
                </button>
                <button
                  type="button"
                  onClick={() => updateQuery({ sort: 'price_desc' })}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedSort === 'price_desc'
                      ? 'bg-white text-brand-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Giá cao &rarr; thấp
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Trang {pagedData.page} / {Math.max(1, pagedData.totalPages)} &bull; {pagedData.totalItems} kết quả
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-brand-50/50 rounded-2xl border border-brand-100">
              <span className="text-xs font-bold text-slate-600">Đang lọc:</span>

              {selectedBrand && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-brand-200 text-xs font-semibold text-brand-700 shadow-sm">
                  <span>Hãng: {activeBrandName}</span>
                  <button
                    type="button"
                    onClick={() => handleBrandChange(selectedBrand)}
                    className="ml-1 text-slate-400 hover:text-rose-500 font-bold"
                  >
                    &times;
                  </button>
                </span>
              )}

              {(minPriceParam !== undefined || maxPriceParam !== undefined) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-brand-200 text-xs font-semibold text-brand-700 shadow-sm">
                  <span>
                    Giá:{' '}
                    {minPriceParam !== undefined && maxPriceParam !== undefined
                      ? `${formatVND(minPriceParam)} - ${formatVND(maxPriceParam)}`
                      : minPriceParam !== undefined
                      ? `Từ ${formatVND(minPriceParam)}`
                      : `Đến ${formatVND(maxPriceParam!)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePricePreset(undefined, undefined)}
                    className="ml-1 text-slate-400 hover:text-rose-500 font-bold"
                  >
                    &times;
                  </button>
                </span>
              )}

              {Object.entries(selectedSpecs).map(([specKey, specVal]) => (
                <span
                  key={specKey}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-brand-200 text-xs font-semibold text-brand-700 shadow-sm"
                >
                  <span className="capitalize">{specKey}: {specVal}</span>
                  <button
                    type="button"
                    onClick={() => handleSpecChange(specKey, specVal)}
                    className="ml-1 text-slate-400 hover:text-rose-500 font-bold"
                  >
                    &times;
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:underline font-bold ml-auto px-2"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <LoadingSpinner message="Đang tải danh sách sản phẩm..." />
          ) : pagedData.items.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl">
                🔍
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Không có kết quả nào cho các điều kiện tìm kiếm và bộ lọc hiện tại. Hãy thử chọn thương hiệu khác hoặc xóa bớt tiêu chí lọc.
              </p>
              <div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedData.items.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagedData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => updateQuery({ page: (currentPage - 1).toString() })}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                &larr; Trước
              </button>

              {Array.from({ length: pagedData.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => updateQuery({ page: pageNum.toString() })}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= pagedData.totalPages}
                onClick={() => updateQuery({ page: (currentPage + 1).toString() })}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau &rarr;
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Mobile Filter Slide-out Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Bộ lọc sản phẩm</h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Brands */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Thương hiệu</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(categoryFilters?.brands || allBrands).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBrandChange(b.slug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        selectedBrand === b.slug
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Khoảng giá</h4>
                <div className="space-y-1">
                  {PRICE_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePricePreset(p.min, p.max)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                        minPriceParam === p.min && maxPriceParam === p.max
                          ? 'bg-brand-50 text-brand-700 font-bold'
                          : 'text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Specs in Mobile */}
              {categoryFilters?.specFilters && categoryFilters.specFilters.length > 0 && (
                <div className="mt-6 space-y-4">
                  {categoryFilters.specFilters.map((spec) => (
                    <div key={spec.key}>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">{spec.label}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {spec.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSpecChange(spec.key, opt)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                              selectedSpecs[spec.key] === opt
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md"
              >
                Áp dụng bộ lọc
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
