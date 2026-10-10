import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../features/catalog/pages/HomePage';
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
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="admin" element={<AdminDashboardPage />} />
        {/* Fallback 404 */}
        <Route
          path="*"
          element={
            <div className="py-20 text-center">
              <h2 className="text-3xl font-bold text-slate-800">404 - Không tìm thấy trang</h2>
              <p className="mt-2 text-slate-500">Đường dẫn bạn yêu cầu không tồn tại.</p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
