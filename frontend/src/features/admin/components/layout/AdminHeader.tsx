import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import { ADMIN_NAV_ITEMS } from '../../navigation/adminNavItems';
import Badge from '../common/Badge';

export interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // Determine current page title from current route
  const currentNavItem = ADMIN_NAV_ITEMS.find((item) =>
    item.path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNavItem ? currentNavItem.label : 'Quản trị';

  const primaryRole = user?.roles?.includes('Admin')
    ? 'Admin'
    : user?.roles?.includes('Sales')
      ? 'Sales'
      : user?.roles?.includes('Warehouse')
        ? 'Warehouse'
        : 'Staff';

  const roleNameMap: Record<string, string> = {
    Admin: 'Quản trị viên',
    Sales: 'Nhân viên bán hàng',
    Warehouse: 'Quản lý kho',
    Staff: 'Nhân viên',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Mở menu điều hướng"
        >
          <span className="text-xl">☰</span>
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            to="/admin"
            className="text-slate-500 hover:text-slate-900 font-medium transition-colors"
          >
            Admin
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">{pageTitle}</span>
        </nav>
      </div>

      {/* Right: Quick actions & User menu */}
      <div className="flex items-center gap-3">
        {/* Storefront quick link */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="Mở website bán hàng trong tab mới"
        >
          <span>🏪</span>
          <span>Xem website</span>
          <span className="text-[10px] text-slate-400">↗</span>
        </Link>

        {/* Role Indicator Pill */}
        <div className="hidden md:flex items-center gap-1.5">
          <Badge
            variant={
              primaryRole === 'Admin'
                ? 'purple'
                : primaryRole === 'Sales'
                  ? 'info'
                  : primaryRole === 'Warehouse'
                    ? 'warning'
                    : 'neutral'
            }
            dot
            size="md"
          >
            {roleNameMap[primaryRole] || primaryRole}
          </Badge>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[120px] truncate">
              {user?.fullName || user?.email}
            </span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-1.5">
                  <Badge variant="purple" size="sm">
                    {user?.roles?.join(', ')}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/account"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>👤</span> Thông tin tài khoản
                </Link>
                <Link
                  to="/"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>🏪</span> Trang chủ mua sắm
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
