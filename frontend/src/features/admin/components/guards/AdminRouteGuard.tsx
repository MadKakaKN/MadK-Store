import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';

export interface AdminRouteGuardProps {
  children?: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

const STAFF_ROLES = ['Admin', 'Sales', 'Warehouse'];

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  children,
  requiredRole,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-600">Đang xác thực quyền truy cập quản trị...</p>
      </div>
    );
  }

  // 1. Chưa đăng nhập -> Chuyển hướng sang trang đăng nhập
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  const userRoles = user.roles || [];
  const userPerms = user.permissions || [];
  const isAdmin = userRoles.includes('Admin');
  const isStaff = userRoles.some((r) => STAFF_ROLES.includes(r));

  // 2. Không thuộc nhóm nhân viên/quản trị (ví dụ Customer thông thường)
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mb-4">
            🛡️
          </div>
          <h2 className="text-xl font-bold text-slate-900">Khu vực dành riêng cho Nhân viên</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Tài khoản <strong>{user.email}</strong> không có quyền truy cập vào cổng quản trị MadK Store.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-lg transition-colors"
            >
              Về trang mua hàng
            </Link>
            <Link
              to="/auth/login"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors"
            >
              Đăng nhập tài khoản khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Yêu cầu role cụ thể nếu có
  if (requiredRole && !isAdmin && !userRoles.includes(requiredRole)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-xs text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-3">
          🚫
        </div>
        <h3 className="text-lg font-bold text-slate-900">Không đủ vai trò truy cập</h3>
        <p className="text-sm text-slate-600 mt-1">
          Khu vực này yêu cầu vai trò <strong>{requiredRole}</strong>. Vai trò hiện tại của bạn:{' '}
          <span className="font-semibold">{userRoles.join(', ')}</span>.
        </p>
        <div className="mt-5">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ← Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 4. Yêu cầu permission cụ thể nếu có (Admin tự động bypass)
  if (requiredPermission && !isAdmin && !userPerms.includes(requiredPermission)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-xs text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-3">
          🔒
        </div>
        <h3 className="text-lg font-bold text-slate-900">Truy cập bị từ chối (403 Forbidden)</h3>
        <p className="text-sm text-slate-600 mt-1">
          Tài khoản của bạn không có quyền thao tác: <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-600 font-mono text-xs">{requiredPermission}</code>.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Vui lòng liên hệ Quản trị viên hệ thống (Admin) nếu bạn cần cấp thêm quyền này.
        </p>
        <div className="mt-5">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ← Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : null;
};

export default AdminRouteGuard;
