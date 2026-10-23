import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartDto, CartItemDto } from '../../../types/cart';
import cartApi, { guestSessionStorage } from '../../../api/cartApi';
import { useAuth } from '../../auth/context/AuthContext';

interface CartContextType {
  cart: CartDto | null;
  items: CartItemDto[];
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  addToCart: (
    variantId: string,
    quantity?: number,
    clientPrice?: number
  ) => Promise<{ success: boolean; message?: string; error?: string; requireLogin?: boolean }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<{ success: boolean; error?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const prevUserRef = useRef<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await cartApi.getCart();
      if (res.isSuccess && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Nạp giỏ hàng khi mount hoặc khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    refreshCart();
  }, [refreshCart, isAuthenticated]);

  // Khi đăng xuất, xóa sạch thông tin giỏ hàng
  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null);
      guestSessionStorage.clearGuestCart();
    }
  }, [isAuthenticated]);

  // Xử lý tự động nạp giỏ hàng khi người dùng vừa đăng nhập
  useEffect(() => {
    const currentUserId = user?.id || null;
    if (isAuthenticated && currentUserId) {
      refreshCart();
    }
    prevUserRef.current = currentUserId;
  }, [isAuthenticated, user?.id, refreshCart]);

  const addToCart = async (
    variantId: string,
    quantity: number = 1,
    clientPrice?: number
  ): Promise<{ success: boolean; message?: string; error?: string; requireLogin?: boolean }> => {
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
        requireLogin: true,
      };
    }

    try {
      setIsLoading(true);
      const res = await cartApi.addItem({
        variantId,
        quantity,
        clientPrice,
      });

      if (res.isSuccess && res.data) {
        setCart(res.data);
        return {
          success: true,
          message: res.message || 'Đã thêm sản phẩm vào giỏ hàng thành công.',
        };
      }
      return {
        success: false,
        error: res.error || 'Không thể thêm vào giỏ hàng.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi thêm vào giỏ.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (
    itemId: string,
    quantity: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await cartApi.updateItem(itemId, { quantity });
      if (res.isSuccess && res.data) {
        setCart(res.data);
        return { success: true };
      }
      return {
        success: false,
        error: res.error || 'Không thể cập nhật số lượng.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi cập nhật giỏ hàng.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await cartApi.removeItem(itemId);
      if (res.isSuccess && res.data) {
        setCart(res.data);
        return { success: true };
      }
      return {
        success: false,
        error: res.error || 'Không thể xóa sản phẩm khỏi giỏ.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi xóa món hàng.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await cartApi.clearCart();
      if (res.isSuccess && res.data) {
        setCart(res.data);
        return { success: true };
      }
      return {
        success: false,
        error: res.error || 'Không thể làm rỗng giỏ hàng.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi làm rỗng giỏ.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const items = cart?.items || [];
  const itemCount = cart?.totalQuantity ?? items.reduce((acc, i) => acc + i.quantity, 0);
  const totalAmount = cart?.totalAmount ?? items.reduce((acc, i) => acc + i.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        totalAmount,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
