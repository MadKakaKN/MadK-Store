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
    <>
      {/* TOP ANNOUNCEMENT BAR (Screen 4 Retail Standard) */}
      <div className="bg-[#111827] text-white text-xs border-b border-[#374151]">
        <div className="max-w-[1240px] mx-auto px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300 text-xs">
            <span className="material-symbols-outlined text-sm text-gray-400">local_shipping</span>
            <span>Miễn phí giao hàng GHN cho đơn từ 1.000.000₫ &bull; Trải nghiệm tương tác 3D 360°</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-300">
            <Link to="/pc-builder" className="hover:text-white flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm text-gray-400">construction</span>
              <span>Xây dựng PC</span>
            </Link>
            <span className="text-gray-600">|</span>
            <Link to="/tracking" className="hover:text-white flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm text-gray-400">receipt_long</span>
              <span>Tra cứu đơn & Bảo hành</span>
            </Link>
            <span className="text-gray-600">|</span>
            <a href="tel:18006868" className="hover:text-white flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm text-gray-400">call</span>
              <span>Hotline: <strong className="text-[#D70018] font-semibold">1800 6868</strong> <span className="text-gray-400 font-normal">(Miễn phí)</span></span>
            </a>
          </div>
        </div>
      </div>

      {/* MAIN HEADER (Screen 4 Retail Standard) */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Category Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-700 hover:text-[#1D4ED8] hover:bg-gray-100 rounded-md"
              aria-label="Mở menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[#1D4ED8] rounded flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-[#1E40AF] transition-colors">
                M
              </div>
              <span className="text-xl font-bold leading-tight text-[#111827] tracking-tight group-hover:text-[#1D4ED8] transition-colors">
                MadK Store
              </span>
            </Link>

            {/* Desktop Category Dropdown Trigger */}
            <div className="hidden lg:block relative ml-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold border transition-colors ${
                  categoryDropdownOpen
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                    : 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border-[#E5E7EB]'
                }`}
              >
                <span className="material-symbols-outlined text-base text-gray-700">menu</span>
                <span>Danh mục</span>
                <span className={`material-symbols-outlined text-sm text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Flyout Mega Menu */}
              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-[#E5E7EB] rounded-lg shadow-xl p-2 z-50 divide-y divide-[#F3F4F6]">
                  <div className="pb-1.5">
                    <Link
                      to="/categories"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">apps</span>
                      <span>Tất cả sản phẩm & Danh mục</span>
                    </Link>
                  </div>
                  <div className="pt-1.5 space-y-0.5">
                    {categories.map((cat) => (
                      <div key={cat.id} className="group/item relative">
                        <Link
                          to={`/categories/${cat.slug}`}
                          onClick={() => setCategoryDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="material-symbols-outlined text-base text-gray-500 group-hover/item:text-[#1D4ED8]">
                              {cat.slug.includes('laptop') ? 'laptop_mac' : cat.slug.includes('dien-thoai') || cat.slug.includes('phone') ? 'smartphone' : cat.slug.includes('pc') ? 'desktop_windows' : cat.slug.includes('man-hinh') ? 'tv' : cat.slug.includes('linh-kien') ? 'developer_board' : 'devices'}
                            </span>
                            <span className="truncate">{cat.name}</span>
                          </div>
                          {cat.children && cat.children.length > 0 && (
                            <span className="material-symbols-outlined text-sm text-gray-400 group-hover/item:text-[#1D4ED8]">
                              chevron_right
                            </span>
                          )}
                        </Link>

                        {/* Nested Subcategories Drawer */}
                        {cat.children && cat.children.length > 0 && (
                          <div className="hidden group-hover/item:block absolute left-full top-0 ml-1.5 w-60 bg-white border border-[#E5E7EB] rounded-lg shadow-xl p-2.5 z-50">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-gray-100">
                              {cat.name}
                            </div>
                            {cat.children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/categories/${sub.slug}`}
                                onClick={() => setCategoryDropdownOpen(false)}
                                className="block px-2.5 py-1.5 rounded text-xs text-gray-600 hover:text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors"
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
          </div>

          {/* Search Box Component */}
          <div className="flex-1 max-w-xl mx-2">
            <SearchBox />
          </div>

          {/* Quick Action Items */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Hotline (Desktop) */}
            <a href="tel:18006868" className="hidden xl:flex items-center gap-1.5 text-xs text-[#111827] hover:text-[#1D4ED8] transition-colors">
              <span className="material-symbols-outlined text-lg text-gray-600">call</span>
              <div className="leading-tight text-left">
                <span className="text-[10px] text-gray-500 block">Hotline:</span>
                <span className="font-bold text-[#D70018]">1800 6868</span>
              </div>
            </a>

            {/* Tra cứu đơn hàng */}
            <Link
              to="/tracking"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#F3F4F6] rounded text-xs text-[#111827] transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-gray-600">receipt_long</span>
              <span className="font-medium">Tra cứu đơn</span>
            </Link>

            {/* So sánh sản phẩm */}
            <Link
              to="/compare"
              className="relative hidden sm:flex items-center gap-1 px-2 py-1.5 hover:bg-[#F3F4F6] rounded text-xs text-[#111827] transition-colors"
              title="So sánh chi tiết sản phẩm"
            >
              <span className="material-symbols-outlined text-xl text-gray-600">compare_arrows</span>
              <span className="font-medium hidden 2xl:inline">So sánh</span>
              {compareItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-600 text-white text-[10px] font-bold px-1 rounded-full h-4 min-w-[16px] flex items-center justify-center">
                  {compareItems.length}
                </span>
              )}
            </Link>

            {/* Yêu thích */}
            <Link
              to="/account?tab=wishlist"
              className="relative hidden md:flex items-center gap-1 px-2 py-1.5 hover:bg-[#F3F4F6] rounded text-xs text-[#111827] transition-colors"
              title="Danh sách yêu thích"
            >
              <span className="material-symbols-outlined text-xl text-gray-600">favorite_border</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold px-1 rounded-full h-4 min-w-[16px] flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Giỏ hàng */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-xs text-[#111827] transition-colors"
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-[#1D4ED8]">shopping_cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D70018] text-white text-[10px] font-bold px-1 rounded h-4 min-w-[16px] flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className="font-semibold hidden sm:inline ml-1">Giỏ hàng</span>
            </Link>

            {/* Tài khoản Dropdown / Đăng nhập */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#F3F4F6] rounded text-xs text-[#111827] transition-colors border border-transparent hover:border-[#E5E7EB]"
                >
                  <div className="w-6 h-6 rounded bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold hidden sm:inline max-w-[100px] truncate">{user.fullName}</span>
                  <span className="material-symbols-outlined text-sm text-gray-400">expand_more</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-[#F3F4F6]">
                      <p className="text-xs font-semibold text-[#111827] truncate">{user.fullName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1 divide-y divide-[#F3F4F6]">
                      {user.roles?.includes('Admin') && (
                        <div className="py-1">
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                            <span>Quản trị hệ thống (Admin)</span>
                          </Link>
                        </div>
                      )}

                      <div className="py-1 space-y-0.5">
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-[#F3F4F6] hover:text-[#1D4ED8] rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-gray-500">person</span>
                          <span>Hồ sơ & Điểm thưởng</span>
                        </Link>
                        <Link
                          to="/account?tab=orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-[#F3F4F6] hover:text-[#1D4ED8] rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-gray-500">package_2</span>
                          <span>Đơn hàng đã đặt</span>
                        </Link>
                        <Link
                          to="/account?tab=loyalty"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-[#F3F4F6] hover:text-[#1D4ED8] rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-amber-500">star</span>
                          <span>MadK Rewards</span>
                        </Link>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await logout();
                            window.location.href = '/';
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded transition-colors text-left"
                        >
                          <span className="material-symbols-outlined text-base">logout</span>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#F3F4F6] rounded text-xs text-[#111827] transition-colors"
              >
                <span className="material-symbols-outlined text-xl text-gray-600">person</span>
                <span className="font-semibold hidden sm:inline">Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>

        {/* Plain Clean Category Navigation Strip (Screen 4 Retail Standard) */}
        <div className="border-t border-[#E5E7EB] bg-white hidden sm:block">
          <div className="max-w-[1240px] mx-auto px-4 py-2 flex items-center gap-6 overflow-x-auto text-xs text-gray-700 scrollbar-none whitespace-nowrap font-medium">
            <Link to="/categories/laptop" className="text-[#1D4ED8] font-semibold hover:text-[#1D4ED8] pb-0.5">Laptop</Link>
            <Link to="/categories/dien-thoai" className="hover:text-[#1D4ED8] transition-colors">Điện thoại & Tablet</Link>
            <Link to="/categories/pc-gaming" className="hover:text-[#1D4ED8] transition-colors">Máy tính & PC</Link>
            <Link to="/categories/man-hinh" className="hover:text-[#1D4ED8] transition-colors">Màn hình</Link>
            <Link to="/categories/linh-kien-pc" className="hover:text-[#1D4ED8] transition-colors">Linh kiện PC</Link>
            <Link to="/categories/ban-phim-co" className="hover:text-[#1D4ED8] transition-colors">Phụ kiện Gaming</Link>
            <Link to="/#flash-sale" className="hover:text-[#D70018] text-[#D70018] font-semibold transition-colors flex items-center gap-1">
              <span>Khuyến mãi</span>
            </Link>
            <Link to="/pc-builder" className="hover:text-[#1D4ED8] transition-colors text-emerald-600 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">build</span>
              <span>Xây dựng PC</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER (Screen 3: 390px Mobile Spec) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#1D4ED8] rounded flex items-center justify-center text-white font-bold text-sm">
                  M
                </div>
                <span className="font-bold text-base text-[#111827]">MadK Store</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-900"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Quick Mobile Links */}
            <div className="p-3 border-b border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/pc-builder"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded bg-[#EFF6FF] text-[#1D4ED8] font-semibold border border-[#BFDBFE]"
              >
                <span className="material-symbols-outlined text-base">construction</span>
                <span>Xây PC</span>
              </Link>
              <Link
                to="/tracking"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded bg-gray-50 text-gray-700 font-semibold border border-gray-200"
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Tra cứu đơn</span>
              </Link>
            </div>

            {/* Categories List */}
            <div className="flex-1 p-3 space-y-1">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                Danh mục sản phẩm
              </div>
              <Link
                to="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF]"
              >
                <span className="material-symbols-outlined text-base">apps</span>
                <span>Tất cả sản phẩm</span>
              </Link>
              {categories.map((cat) => {
                const isExpanded = expandedMobileCats[cat.id];
                const hasChildren = cat.children && cat.children.length > 0;
                return (
                  <div key={cat.id} className="border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded">
                      <Link
                        to={`/categories/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-medium text-gray-800 hover:text-[#1D4ED8] flex-1"
                      >
                        {cat.name}
                      </Link>
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => toggleMobileCat(cat.id)}
                          className="p-1 text-gray-400"
                        >
                          <span className={`material-symbols-outlined text-base transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                      )}
                    </div>
                    {hasChildren && isExpanded && (
                      <div className="pl-4 pr-2 pb-2 space-y-1 bg-gray-50 rounded">
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/categories/${sub.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-1 text-xs text-gray-600 hover:text-[#1D4ED8]"
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

            {/* Footer auth links */}
            <div className="p-4 border-t border-[#E5E7EB] bg-gray-50">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-900">{user.fullName}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await logout();
                        window.location.href = '/';
                      }}
                      className="text-xs text-rose-600 font-semibold"
                    >
                      Đăng xuất
                    </button>
                  </div>
                  {user.roles?.includes('Admin') && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-2 bg-purple-600 text-white rounded text-xs font-bold"
                    >
                      🛡️ Trang Quản Trị Admin
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 bg-[#1D4ED8] text-white rounded text-xs font-semibold"
                >
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (Screen 3: 390px Mobile Spec) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] py-1.5 px-3 flex items-center justify-around text-xs shadow-lg">
        <Link to="/" className="flex flex-col items-center gap-0.5 text-[#1D4ED8]">
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px] font-semibold">Trang chủ</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#1D4ED8]"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
          <span className="text-[10px]">Danh mục</span>
        </button>
        <Link to="/pc-builder" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#1D4ED8]">
          <span className="material-symbols-outlined text-xl">construction</span>
          <span className="text-[10px]">Xây PC</span>
        </Link>
        <Link to="/tracking" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#1D4ED8]">
          <span className="material-symbols-outlined text-xl">receipt_long</span>
          <span className="text-[10px]">Tra cứu</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#1D4ED8] relative">
          <span className="material-symbols-outlined text-xl">shopping_cart</span>
          <span className="text-[10px]">Giỏ hàng</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 right-2 bg-[#D70018] text-white text-[9px] font-bold px-1 rounded-full h-3.5 min-w-[14px] flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </>
  );
};

export default Header;
