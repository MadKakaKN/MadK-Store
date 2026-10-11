import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../features/catalog/pages/HomePage';
import CategoryPage from '../features/catalog/pages/CategoryPage';
import ProductDetailPage from '../features/catalog/pages/ProductDetailPage';
import LoginPage from '../features/auth/pages/LoginPage';
import CartPage from '../features/cart/pages/CartPage';
import CheckoutPage from '../features/checkout/pages/CheckoutPage';
import AccountPage from '../features/account/pages/AccountPage';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';

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

        {/* Auth & Account */}
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="account" element={<AccountPage />} />

        {/* Admin */}
        <Route path="admin" element={<AdminDashboardPage />} />

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
