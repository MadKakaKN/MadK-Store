import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './features/auth/context/AuthContext';
import { CartProvider } from './features/cart/context/CartContext';
import { ToastProvider } from './features/admin/components/common/ToastContext';
import { GoogleOAuthCallback } from './features/auth/components/GoogleOAuthCallback';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GoogleOAuthCallback />
        <CartProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

