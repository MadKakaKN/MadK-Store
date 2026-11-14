import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import { getVisibleAdminNavItems } from '../../navigation/adminNavItems';
import Badge from '../common/Badge';

export interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const getMaterialIcon = (id: string): string => {
  switch (id) {
    case 'dashboard':
      return 'dashboard';
    case 'pos':
      return 'point_of_sale';
    case 'orders':
      return 'shopping_cart';
    case 'returns':
      return 'assignment_return';
    case 'inventory':
      return 'inventory_2';
    case 'catalog':
      return 'category';
    case 'reviews':
      return 'rate_review';
    case 'pricing':
      return 'price_change';
    case 'discounts':
      return 'confirmation_number';
    case 'users':
      return 'manage_accounts';
    case 'audit-logs':
      return 'verified_user';
    case 'reports':
      return 'analytics';
    case 'system':
      return 'monitor_heart';
    default:
      return 'label';
  }
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed = false,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const visibleItems = getVisibleAdminNavItems(user);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/admin/login';
  };

  const primaryRole = user?.roles?.includes('Admin')
    ? 'Admin'
    : user?.roles?.includes('Sales')
      ? 'Sales'
      : user?.roles?.includes('Warehouse')
        ? 'Warehouse'
        : 'Staff';

  const roleBadgeVariant =
    primaryRole === 'Admin'
      ? 'purple'
      : primaryRole === 'Sales'
        ? 'info'
        : primaryRole === 'Warehouse'
          ? 'warning'
          : 'neutral';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827] text-gray-300 border-r border-gray-800 select-none text-[13px]">
      {/* 1. Brand / Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
        <Link to="/admin" className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-[15px] tracking-tight">MadK Console</span>
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
              PRO
            </span>
          </div>
          <span className="text-[11px] text-gray-400">Hệ thống Quản trị Bán lẻ</span>
        </Link>
      </div>

      {/* 2. POS Quick Launch Action */}
      <div className="p-3 shrink-0">
        <Link
          to="/admin/pos"
          onClick={onCloseMobile}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-blue-700 text-white font-medium text-[12px] hover:bg-blue-600 transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
          <span>Bán tại quầy (POS)</span>
        </Link>
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/admin'}
            onClick={onCloseMobile}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-2 rounded transition-colors text-[13px] ${
                isActive
                  ? 'bg-[#374151] text-white font-semibold'
                  : 'text-gray-300 hover:bg-[#1F2937] hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-gray-400">
                {getMaterialIcon(item.id)}
              </span>
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className="px-1.5 py-0.2 text-[11px] font-bold bg-blue-600 text-white rounded">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Divider & Storefront Link */}
        <div className="pt-2 my-2 border-t border-gray-800">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-gray-400">storefront</span>
            <span className="truncate">Về trang bán lẻ khách hàng</span>
          </Link>
        </div>
      </nav>

      {/* 4. Store Selector & User Profile Widget at Bottom */}
      <div className="p-3 border-t border-gray-800 bg-[#0F172A] shrink-0">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Kho Q.1 Flagship
          </span>
          <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.2 rounded border border-gray-700">
            v3.2 Retail
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Avatar / Initials */}
          <div className="w-8 h-8 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white truncate">
                {user?.fullName || 'Nam Nguyễn'}
              </span>
              <Badge variant={roleBadgeVariant} size="sm">
                {primaryRole}
              </Badge>
            </div>
            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 p-1.5 rounded hover:bg-gray-800 transition-colors shrink-0"
            title="Đăng xuất"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-60'
        }`}
      >
        <div
          className={`fixed top-0 bottom-0 left-0 z-30 transition-all duration-200 ${
            isCollapsed ? 'w-20' : 'w-60'
          }`}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-64 max-w-[85vw] transform transition-transform duration-200 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
