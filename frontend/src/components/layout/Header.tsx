import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import catalogApi from '../../api/catalogApi';
import { CategoryTreeDto } from '../../types/catalog';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useCart } from '../../features/cart/context/CartContext';
import { useWishlist } from '../../features/wishlist/context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import SearchBox from './SearchBox';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { items: compareItems } = useCompare();
  const [categories, setCategories] = useState<CategoryTreeDto[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState<Record<string, boolean>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  // Click outside listener for desktop dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileCat = (catId: string) => {
    setExpandedMobileCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200/70 shadow-2xs transition-all">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-300 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 font-semibold text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          NEW TECH
        </span>
        <span className="truncate">
          Miễn phí giao hàng GHN cho đơn từ 1.000.000₫ &bull; Trải nghiệm tương tác mô hình 3D xoay 360°
        </span>
      </div>

      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-105 group-hover:shadow-blue-600/40 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg className="w-6 h-6 transform -rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 leading-none">
                  MadK<span className="text-gradient-sapphire font-black">Store</span>
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-1 flex items-center gap-1">
                  <span>3D TECH CATALOG</span>
                  <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Category Menu trigger */}
          <div className="hidden lg:block relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all duration-200 border ${
                categoryDropdownOpen
                  ? 'bg-blue-50/80 text-blue-700 border-blue-200/80 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200/70 hover:border-slate-300'
              }`}
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>Danh mục</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown mega menu */}
            {categoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-2.5 w-80 backdrop-blur-2xl bg-white/95 rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 mb-1 flex items-center justify-between">
                  <span>Khám phá công nghệ</span>
                  <span className="text-[10px] text-blue-600 font-semibold lowercase">3D catalog</span>
                </div>
                <div className="space-y-1">
                  <Link
                    to="/categories"
                    onClick={() => setCategoryDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xs">⚡</span>
                    <span>Tất cả sản phẩm</span>
                  </Link>
                  {categories.map((cat) => (
                    <div key={cat.id} className="group/item relative">
                      <Link
                        to={`/categories/${cat.slug}`}
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {cat.iconUrl ? (
                            <img src={cat.iconUrl} alt="" className="w-5 h-5 rounded-lg object-cover" />
                          ) : (
                            <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs">📦</span>
                          )}
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {cat.children && cat.children.length > 0 && (
                          <span className="text-xs text-slate-400 group-hover/item:text-blue-600 transition-colors">&rsaquo;</span>
                        )}
                      </Link>

                      {/* Sub-categories tooltip/panel */}
                      {cat.children && cat.children.length > 0 && (
                        <div className="hidden group-hover/item:block absolute left-full top-0 ml-2 w-64 backdrop-blur-2xl bg-white/95 rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-200/80 p-3 z-50">
                          <div className="text-xs font-bold text-slate-400 px-3 py-1 mb-1">
                            {cat.name}
                          </div>
                          {cat.children.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/categories/${sub.slug}`}
                              onClick={() => setCategoryDropdownOpen(false)}
                              className="block px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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

          {/* Search bar with Recommendation Dropdown (Desktop & Tablet) */}
          <div className="hidden md:flex flex-1 max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-3 sm:mx-6 min-w-[280px]">
            <SearchBox />
          </div>

          {/* Action buttons (Wishlist, Cart, Auth) */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Link
              to="/categories"
              className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              Khám phá
            </Link>

            {/* Compare Icon */}
            <Link
              to="/compare"
              className="p-2 sm:px-3 sm:py-2 rounded-2xl text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 transition-colors relative flex items-center gap-1.5 border border-transparent hover:border-cyan-100"
              title="So sánh sản phẩm"
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-5 sm:h-5 text-slate-700 hover:text-cyan-600 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {compareItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {compareItems.length}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-semibold">So sánh</span>
            </Link>

            {/* Wishlist Icon */}
            <Link
              to="/account?tab=wishlist"
              className="p-2 sm:px-3 sm:py-2 rounded-2xl text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors relative flex items-center gap-1.5 border border-transparent hover:border-rose-100"
              title="Danh sách yêu thích"
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-5 sm:h-5 text-slate-700 hover:text-rose-600 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-semibold">Yêu thích</span>
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="p-2 sm:px-3 sm:py-2 rounded-2xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors relative flex items-center gap-1.5 border border-transparent hover:border-blue-100"
              title="Giỏ hàng"
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-5 sm:h-5 text-slate-700 hover:text-blue-600 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              </div>
              <span className="hidden xl:inline text-xs font-semibold">Giỏ hàng</span>
            </Link>

            {/* Quick Admin Portal shortcut button on Desktop */}
            {isAuthenticated && user?.roles?.includes('Admin') && (
              <Link
                to="/admin"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all hover:scale-105"
              >
                <span>🛡️ Admin</span>
              </Link>
            )}

            {/* Auth button / User Dropdown */}
            {isAuthenticated && user ? (
              <div className="hidden sm:block relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl hover:bg-slate-100/80 transition-colors border border-slate-200/70"
                >
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight">
                      {user.roles?.[0] || 'Khách hàng'}
                    </span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-blue-600' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 rounded-3xl backdrop-blur-2xl bg-white/95 shadow-2xl shadow-slate-900/10 border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {user.roles?.includes('Admin') && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors mb-1"
                        >
                          <span>🛡️ Quản trị hệ thống (Admin)</span>
                        </Link>
                      )}
                      <Link
                        to="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors"
                      >
                        <span>👤 Hồ sơ & Tích điểm hội viên</span>
                      </Link>
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors"
                      >
                        <span>📦 Đơn hàng & Vận đơn GHN</span>
                      </Link>
                      <Link
                        to="/account?tab=loyalty"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-2xl transition-colors"
                      >
                        <span>⭐ MadK Rewards</span>
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await logout();
                          window.location.href = '/';
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors text-left"
                      >
                        <span>🚪 Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 rounded-2xl transition-all shadow-xs hover:shadow-glow-sm hover:scale-102"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:hidden rounded-2xl text-slate-700 hover:bg-slate-100 transition-colors"
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

        {/* Mobile & Small Screens Dedicated Full-Width Search Bar */}
        <div className="md:hidden pb-3 pt-0.5">
          <SearchBox isMobile />
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-2xl px-4 pt-3 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mobile search bar */}
          <SearchBox isMobile onNavigate={() => setMobileMenuOpen(false)} />

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-2xl bg-slate-100 text-slate-800"
            >
              Trang chủ
            </Link>
            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/50"
            >
              Tất cả sản phẩm
            </Link>
          </div>

          {/* Category Accordion */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Danh mục công nghệ
            </div>
            <div className="space-y-1">
              {categories.map((cat) => {
                const isExpanded = !!expandedMobileCats[cat.id];
                const hasChildren = cat.children && cat.children.length > 0;

                return (
                  <div key={cat.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50">
                      <Link
                        to={`/categories/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-2 truncate"
                      >
                        {cat.iconUrl && (
                          <img src={cat.iconUrl} alt="" className="w-4 h-4 rounded object-cover" />
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
                            className="block text-xs font-medium text-slate-600 hover:text-blue-600 py-1 pl-4 border-l-2 border-blue-200"
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
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              to="/account?tab=wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 font-semibold flex items-center gap-1.5"
            >
              <span>❤️ Yêu thích</span>
              {wishlistCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 font-semibold flex items-center gap-2"
            >
              <span>🛒 Giỏ hàng</span>
              {itemCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                  {itemCount}
                </span>
              )}
            </Link>
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-2 w-full pt-1">
                <div className="flex items-center justify-between">
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-blue-600 font-bold"
                  >
                    👤 {user.fullName}
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                      window.location.href = '/';
                    }}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Đăng xuất
                  </button>
                </div>
                {user.roles?.includes('Admin') && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-2 rounded-2xl flex items-center justify-center gap-1.5"
                  >
                    🛡️ Vào Trang Quản Trị Hệ Thống (Admin)
                  </Link>
                )}
              </div>
            ) : (
              <Link
                to="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-blue-600 font-bold"
              >
                Đăng nhập / Đăng ký &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
