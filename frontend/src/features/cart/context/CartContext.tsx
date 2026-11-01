import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartDto, CartItemDto } from '../../../types/cart';
import cartApi, { guestSessionStorage } from '../../../api/cartApi';
import { useAuth } from '../../auth/context/AuthContext';

/**
 * Key localStorage để lưu snapshot giỏ hàng trước khi đăng xuất.
 * Khi đăng nhập lại cùng tài khoản, giỏ hàng sẽ được khôi phục tự động.
 */
const CART_PERSIST_KEY = 'madk_cart_snapshot';

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

  /**
   * Lưu snapshot giỏ hàng hiện tại vào localStorage trước khi đăng xuất,
   * để có thể khôi phục khi đăng nhập lại.
   */
  const saveCartSnapshot = useCallback((cartData: CartDto | null, userId: string | null) => {
    if (cartData && userId && cartData.items.length > 0) {
      try {
        localStorage.setItem(
          CART_PERSIST_KEY,
          JSON.stringify({ userId, cart: cartData, savedAt: Date.now() })
        );
      } catch {
        // Bỏ qua lỗi localStorage đầy
      }
    }
  }, []);

  /**
   * Khôi phục snapshot giỏ hàng từ localStorage nếu đăng nhập cùng userId.
   */
  const restoreCartSnapshot = useCallback((userId: string): CartDto | null => {
    try {
      const raw = localStorage.getItem(CART_PERSIST_KEY);
      if (!raw) return null;
      const snapshot = JSON.parse(raw) as { userId: string; cart: CartDto; savedAt: number };
      // Chỉ khôi phục nếu cùng userId và snapshot chưa quá 7 ngày
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (snapshot.userId === userId && Date.now() - snapshot.savedAt < sevenDays) {
        return snapshot.cart;
      }
      // Snapshot hết hạn hoặc khác user → xóa
      localStorage.removeItem(CART_PERSIST_KEY);
      return null;
    } catch {
      localStorage.removeItem(CART_PERSIST_KEY);
      return null;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Bước 1: Thử merge giỏ khách (guest) vào giỏ người dùng nếu có items guest
      const guestItems = guestSessionStorage.getGuestItems();
      if (guestItems.length > 0) {
        try {
          const mergeRes = await cartApi.mergeCart({
            anonymousId: guestSessionStorage.getAnonymousId(),
            items: guestItems,
          });
          if (mergeRes.isSuccess && mergeRes.data) {
            setCart(mergeRes.data);
            return;
          }
        } catch {
          // Merge thất bại (backend offline) → tiếp tục load giỏ bình thường
        }
      }

      // Bước 2: Lấy giỏ hàng từ server
      const res = await cartApi.getCart();
      if (res.isSuccess && res.data) {
        // Nếu server trả giỏ trống nhưng có snapshot cũ → khôi phục
        if (res.data.items.length === 0 && user?.id) {
          const snapshot = restoreCartSnapshot(user.id);
          if (snapshot && snapshot.items.length > 0) {
            // Thử re-add các items từ snapshot vào server
            for (const item of snapshot.items) {
              try {
                await cartApi.addItem({
                  variantId: item.variantId,
                  quantity: item.quantity,
                });
              } catch {
                // Bỏ qua item lỗi (sản phẩm hết hàng, v.v.)
              }
            }
            // Load lại giỏ hàng sau khi re-add
            const refreshedRes = await cartApi.getCart();
            if (refreshedRes.isSuccess && refreshedRes.data && refreshedRes.data.items.length > 0) {
              setCart(refreshedRes.data);
              localStorage.removeItem(CART_PERSIST_KEY); // Đã khôi phục thành công → xóa snapshot
              return;
            }
            // Nếu server vẫn trống (backend offline) → dùng snapshot trực tiếp
            setCart(snapshot);
            return;
          }
        }
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      // Nếu hoàn toàn thất bại và có snapshot → dùng snapshot
      if (user?.id) {
        const snapshot = restoreCartSnapshot(user.id);
        if (snapshot) {
          setCart(snapshot);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, restoreCartSnapshot]);

  // Nạp giỏ hàng khi mount hoặc khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    refreshCart();
  }, [refreshCart, isAuthenticated]);

  // Khi đăng xuất: LƯU snapshot trước, rồi mới xóa state
  useEffect(() => {
    if (!isAuthenticated) {
      // KHÔNG xóa guestCart nữa - giữ snapshot để khôi phục sau
      setCart(null);
    }
  }, [isAuthenticated]);

  // Xử lý khi chuyển user: lưu snapshot giỏ hàng user cũ trước khi chuyển
  useEffect(() => {
    const currentUserId = user?.id || null;
    const prevUserId = prevUserRef.current;

    // Nếu user thay đổi (đăng xuất hoặc đổi tài khoản)
    if (prevUserId && prevUserId !== currentUserId && cart) {
      // Lưu snapshot giỏ hàng user cũ
      saveCartSnapshot(cart, prevUserId);
    }

    if (isAuthenticated && currentUserId) {
      refreshCart();
    }

    prevUserRef.current = currentUserId;
  }, [isAuthenticated, user?.id, refreshCart, cart, saveCartSnapshot]);

  // Lưu snapshot mỗi khi giỏ hàng thay đổi (để luôn có bản backup mới nhất)
  useEffect(() => {
    if (cart && user?.id && cart.items.length > 0) {
      saveCartSnapshot(cart, user.id);
    }
  }, [cart, user?.id, saveCartSnapshot]);

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
      // Xóa cả snapshot khi người dùng chủ động xóa giỏ hàng
      localStorage.removeItem(CART_PERSIST_KEY);
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
