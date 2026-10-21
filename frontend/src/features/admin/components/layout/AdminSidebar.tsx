import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import { getVisibleAdminNavItems } from '../../navigation/adminNavItems';
import Badge from '../common/Badge';

export interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = getVisibleAdminNavItems(user);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
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
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* 1. Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
        <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
            M
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">MadK</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-900 text-white rounded-md tracking-wider">
                ADMIN
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 items-center justify-center text-xs transition-colors"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden text-slate-400 hover:text-slate-600 p-1 text-lg"
          aria-label="Đóng menu"
        >
          ✕
        </button>
      </div>

      {/* 2. Navigation Items List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/admin'}
            onClick={onCloseMobile}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold border-r-4 border-brand-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <span className="text-base shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <span className="truncate flex-1">{item.label}</span>
            )}
            {!isCollapsed && item.badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-100 text-brand-700 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Divider & Storefront Link */}
        <div className="pt-3 my-2 border-t border-slate-100">
          <Link
            to="/"
            title={isCollapsed ? 'Về cửa hàng' : undefined}
            className={`flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <span className="text-sm shrink-0">🏪</span>
            {!isCollapsed && <span className="truncate">Về trang bán hàng</span>}
          </Link>
        </div>
      </div>

      {/* 3. User Profile Widget at Bottom */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          {/* Avatar / Initials */}
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {user?.fullName || 'Nhân viên'}
                </span>
                <Badge variant={roleBadgeVariant} size="sm">
                  {primaryRole}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
              title="Đăng xuất"
            >
              🚪
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`fixed top-0 bottom-0 left-0 z-30 transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
