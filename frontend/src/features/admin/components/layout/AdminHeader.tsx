import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import { ADMIN_NAV_ITEMS } from '../../navigation/adminNavItems';
import Badge from '../common/Badge';
import { IconStore, IconUsers, IconLogout, IconBell } from '../../../../components/common/Icons';
import { useNotifications } from '../../../../context/NotificationContext';

export interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/admin/login';
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
          <IconStore className="w-3.5 h-3.5 text-slate-500" />
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

        {/* Real-time Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label="Thông báo thời gian thực"
            title="Thông báo thời gian thực (SignalR)"
          >
            <IconBell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Thông báo thời gian thực</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <p className="font-medium">Chưa có thông báo mới nào</p>
                    <p className="text-[11px] text-slate-400 mt-1">Chuông sẽ báo tức thì khi có đơn hàng hoặc thanh toán mới</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-sm">
                        {n.type === 'ORDER' && '🛒'}
                        {n.type === 'PAYMENT' && '💰'}
                        {n.type === 'STOCK' && '⚠️'}
                        {n.type === 'STATUS' && '📦'}
                        {n.type === 'SYSTEM' && '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${!n.read ? 'text-blue-900' : 'text-slate-800'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        {n.linkUrl && (
                          <Link
                            to={n.linkUrl}
                            onClick={() => {
                              setIsNotifOpen(false);
                              markAsRead(n.id);
                            }}
                            className="inline-block mt-1 text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            Xem chi tiết &rarr;
                          </Link>
                        )}
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
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
                  <IconUsers className="w-3.5 h-3.5 text-slate-400" /> Thông tin tài khoản
                </Link>
                <Link
                  to="/"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <IconStore className="w-3.5 h-3.5 text-slate-500" /> Trang chủ mua sắm
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <IconLogout className="w-3.5 h-3.5 text-rose-500" /> Đăng xuất
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
