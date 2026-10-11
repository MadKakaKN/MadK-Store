import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Đang kiểm tra trạng thái đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (requiredRole && !user?.roles?.includes(requiredRole)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mb-4">
          🛡️
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Không có quyền truy cập</h2>
        <p className="text-slate-500 text-sm mt-2">
          Bạn cần vai trò <strong>{requiredRole}</strong> để truy cập khu vực này.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
