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
import AccountPage from '../features/account/pages/AccountPage';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import GuestRoute from '../features/auth/components/GuestRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
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

        {/* Protected Admin Route */}
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback 404 */}
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
    </Routes>
  );
};

export default AppRoutes;
