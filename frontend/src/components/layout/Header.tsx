import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import catalogApi from '../../api/catalogApi';
import { CategoryTreeDto } from '../../types/catalog';

export const Header: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTreeDto[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMobileCats, setExpandedMobileCats] = useState<Record<string, boolean>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    catalogApi.getCategoryTree().then((tree) => {
      if (isMounted) setCategories(tree);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoryDropdownOpen(false);
  }, [location.pathname, location.search]);

  // Click outside listener for desktop dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileCat = (catId: string) => {
    setExpandedMobileCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-300 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium tracking-wide">
        🚀 Miễn phí vận chuyển cho đơn hàng từ 1.000.000₫ &bull; Trải nghiệm mô hình 3D tương tác sống động
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-600/30 group-hover:scale-105 transition-transform">
                M
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  MadK<span className="text-brand-600">Store</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                  Tech & 3D Catalog
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Category Menu trigger */}
          <div className="hidden lg:block relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                categoryDropdownOpen
                  ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>Danh mục</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown mega menu */}
            {categoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
                  Khám phá danh mục
                </div>
                <div className="space-y-1">
                  <Link
                    to="/categories"
                    onClick={() => setCategoryDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <span>⚡</span>
                    <span>Tất cả sản phẩm</span>
                  </Link>
                  {categories.map((cat) => (
                    <div key={cat.id} className="group/item relative">
                      <Link
                        to={`/categories/${cat.slug}`}
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {cat.iconUrl ? (
                            <img src={cat.iconUrl} alt="" className="w-5 h-5 rounded object-cover" />
                          ) : (
                            <span>📦</span>
                          )}
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {cat.children && cat.children.length > 0 && (
                          <span className="text-xs text-slate-400">&rsaquo;</span>
                        )}
                      </Link>

                      {/* Sub-categories tooltip/panel */}
                      {cat.children && cat.children.length > 0 && (
                        <div className="hidden group-hover/item:block absolute left-full top-0 ml-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                          <div className="text-xs font-semibold text-slate-400 px-3 py-1">
                            {cat.name}
                          </div>
                          {cat.children.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/categories/${sub.slug}`}
                              onClick={() => setCategoryDropdownOpen(false)}
                              className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-brand-600 hover:bg-brand-50"
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
            )}
          </div>

          {/* Search bar (Desktop & Tablet) */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Tìm điện thoại, laptop, linh kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm rounded-2xl pl-11 pr-24 py-2.5 sm:py-3 border border-transparent focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 sm:py-2 rounded-xl transition-colors shadow-sm"
              >
                Tìm
              </button>
            </form>
          </div>

          {/* Action buttons (Cart, Auth) */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Link
              to="/categories"
              className="hidden md:inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Tất cả sản phẩm
            </Link>

            <Link
              to="/cart"
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-brand-600 hover:bg-brand-50 transition-colors relative flex items-center gap-1.5"
              title="Giỏ hàng"
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  0
                </span>
              </div>
              <span className="hidden xl:inline text-xs font-semibold">Giỏ hàng</span>
            </Link>

            <Link
              to="/auth/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 rounded-xl transition-colors"
            >
              Đăng nhập
            </Link>

            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:hidden rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mobile search bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-sm rounded-xl pl-9 pr-14 py-2 border border-slate-200 focus:outline-none focus:border-brand-500"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-brand-600 text-white text-xs font-medium px-2.5 py-1 rounded-lg"
            >
              Tìm
            </button>
          </form>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 text-center text-sm font-semibold">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800"
            >
              Trang chủ
            </Link>
            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-brand-50 text-brand-700"
            >
              Tất cả sản phẩm
            </Link>
          </div>

          {/* Category Accordion */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Danh mục công nghệ
            </div>
            <div className="space-y-1">
              {categories.map((cat) => {
                const isExpanded = !!expandedMobileCats[cat.id];
                const hasChildren = cat.children && cat.children.length > 0;

                return (
                  <div key={cat.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50">
                      <Link
                        to={`/categories/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-semibold text-slate-800 hover:text-brand-600 flex items-center gap-2 truncate"
                      >
                        {cat.iconUrl && (
                          <img src={cat.iconUrl} alt="" className="w-5 h-5 rounded object-cover" />
                        )}
                        <span className="truncate">{cat.name}</span>
                      </Link>

                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => toggleMobileCat(cat.id)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          aria-label="Expand category"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {hasChildren && isExpanded && (
                      <div className="bg-white px-3 py-2 space-y-1.5 border-t border-slate-100">
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/categories/${sub.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-xs font-medium text-slate-600 hover:text-brand-600 py-1 pl-4 border-l-2 border-brand-200"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User links */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 font-semibold flex items-center gap-2"
            >
              <span>🛒 Giỏ hàng</span>
            </Link>
            <Link
              to="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-brand-600 font-bold"
            >
              Đăng nhập / Đăng ký &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
