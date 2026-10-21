import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../features/catalog/pages/HomePage';
import CategoryPage from '../features/catalog/pages/CategoryPage';
import ProductDetailPage from '../features/catalog/pages/ProductDetailPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import CartPage from '../features/cart/pages/CartPage';
import CheckoutPage from '../features/checkout/pages/CheckoutPage';
import OrderSuccessPage from '../features/checkout/pages/OrderSuccessPage';
import VnpayReturnPage from '../features/checkout/pages/VnpayReturnPage';
import AccountPage from '../features/account/pages/AccountPage';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import GuestRoute from '../features/auth/components/GuestRoute';

// Admin feature components
import AdminLayout from '../features/admin/components/layout/AdminLayout';
import AdminRouteGuard from '../features/admin/components/guards/AdminRouteGuard';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import AdminOrdersPage from '../features/admin/pages/AdminOrdersPage';
import AdminReturnsPage from '../features/admin/pages/AdminReturnsPage';
import AdminInventoryPage from '../features/admin/pages/AdminInventoryPage';
import AdminCatalogPage from '../features/admin/pages/AdminCatalogPage';
import { AdminPricingPage } from '../features/admin/pricing/AdminPricingPage';
import AdminDiscountsPage from '../features/admin/pages/AdminDiscountsPage';
import AdminUsersPage from '../features/admin/pages/AdminUsersPage';
import AdminAuditLogsPage from '../features/admin/pages/AdminAuditLogsPage';
import AdminReportsPage from '../features/admin/pages/AdminReportsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ──── Storefront Customer Routes (MainLayout) ──── */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        {/* Catalog Storefront routes */}
        <Route path="categories" element={<CategoryPage />} />
        <Route path="categories/:slug" element={<CategoryPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />

        {/* Cart & Checkout */}
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<OrderSuccessPage />} />
        <Route path="checkout/vnpay-return" element={<VnpayReturnPage />} />
        <Route path="order-success/:orderNumber" element={<OrderSuccessPage />} />


        {/* Auth Routes (Guest Only) */}
        <Route
          path="auth/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="auth/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="auth/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="auth/reset-password"
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />
        <Route path="auth/verify-email" element={<VerifyEmailPage />} />

        {/* Protected Customer Routes */}
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback 404 for Storefront */}
        <Route
          path="*"
          element={
            <div className="py-24 text-center px-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mb-4">
                🧭
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">404 - Không tìm thấy trang</h2>
              <p className="mt-2 text-slate-500 max-w-sm mx-auto">
                Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới.
              </p>
            </div>
          }
        />
      </Route>

      {/* ──── Dedicated Admin Feature Area with Layout & Route Guards ──── */}
      <Route
        path="/admin"
        element={
          <AdminRouteGuard>
            <AdminLayout />
          </AdminRouteGuard>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route
          path="orders"
          element={
            <AdminRouteGuard requiredPermission="order.view">
              <AdminOrdersPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="returns"
          element={
            <AdminRouteGuard requiredPermission="order.view">
              <AdminReturnsPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="inventory"
          element={
            <AdminRouteGuard requiredPermission="inventory.view">
              <AdminInventoryPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="catalog"
          element={
            <AdminRouteGuard requiredPermission="catalog.manage">
              <AdminCatalogPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="pricing"
          element={
            <AdminRouteGuard requiredPermission="catalog.manage">
              <AdminPricingPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="discounts"
          element={
            <AdminRouteGuard requiredPermission="discount.manage">
              <AdminDiscountsPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="users"
          element={
            <AdminRouteGuard requiredPermission="user.view">
              <AdminUsersPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="audit-logs"
          element={
            <AdminRouteGuard requiredPermission="audit.view">
              <AdminAuditLogsPage />
            </AdminRouteGuard>
          }
        />
        <Route
          path="reports"
          element={
            <AdminRouteGuard>
              <AdminReportsPage />
            </AdminRouteGuard>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
