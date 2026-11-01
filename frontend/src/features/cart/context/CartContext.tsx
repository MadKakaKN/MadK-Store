import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartDto, CartItemDto } from '../../../types/cart';
import cartApi, { guestSessionStorage } from '../../../api/cartApi';
import { useAuth } from '../../auth/context/AuthContext';

/**
 * Key localStorage để lưu snapshot giỏ hàng kèm userId.
 * Snapshot được lưu mỗi khi giỏ thay đổi VÀ ngay khi addItem thành công,
 * để đảm bảo không mất dữ liệu khi hard-navigate (window.location.href).
 */
const CART_PERSIST_KEY = 'madk_cart_snapshot';
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

// ===== Helper functions (ngoài component, không phụ thuộc React lifecycle) =====

function saveCartSnapshotToStorage(cartData: CartDto, userId: string): void {
  if (!cartData || !userId || cartData.items.length === 0) return;
  try {
    localStorage.setItem(
      CART_PERSIST_KEY,
      JSON.stringify({ userId, cart: cartData, savedAt: Date.now() })
    );
  } catch {
    // localStorage đầy → bỏ qua
  }
}

function loadCartSnapshotFromStorage(userId: string): CartDto | null {
  try {
    const raw = localStorage.getItem(CART_PERSIST_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as { userId: string; cart: CartDto; savedAt: number };
    if (snapshot.userId === userId && Date.now() - snapshot.savedAt < SNAPSHOT_MAX_AGE_MS) {
      return snapshot.cart;
    }
    // Hết hạn hoặc khác user → xóa
    localStorage.removeItem(CART_PERSIST_KEY);
    return null;
  } catch {
    localStorage.removeItem(CART_PERSIST_KEY);
    return null;
  }
}

function clearCartSnapshot(): void {
  localStorage.removeItem(CART_PERSIST_KEY);
}

// ===========================================================================

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
  const [cart, setCart] = useState<CartDto | null>(() => {
    // Khởi tạo ngay từ snapshot nếu đã đăng nhập (tránh flash trống sau hard-navigate)
    const userId = (() => {
      try {
        const u = localStorage.getItem('auth_user');
        return u ? JSON.parse(u)?.id : null;
      } catch {
        return null;
      }
    })();
    if (userId) {
      return loadCartSnapshotFromStorage(userId);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const prevUserRef = useRef<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Bước 1: Thử merge giỏ khách (guest) vào giỏ người dùng nếu có
      const guestItems = guestSessionStorage.getGuestItems();
      if (guestItems.length > 0) {
        try {
          const mergeRes = await cartApi.mergeCart({
            anonymousId: guestSessionStorage.getAnonymousId(),
            items: guestItems,
          });
          if (mergeRes.isSuccess && mergeRes.data && mergeRes.data.items.length > 0) {
            setCart(mergeRes.data);
            saveCartSnapshotToStorage(mergeRes.data, user.id);
            return;
          }
        } catch {
          // Merge thất bại (backend offline) → tiếp tục
        }
      }

      // Bước 2: Lấy giỏ hàng từ server
      const res = await cartApi.getCart();
      if (res.isSuccess && res.data) {
        if (res.data.items.length > 0) {
          // Server trả giỏ có items → dùng luôn và cập nhật snapshot
          setCart(res.data);
          saveCartSnapshotToStorage(res.data, user.id);
        } else {
          // Server trả giỏ trống → thử khôi phục từ snapshot
          const snapshot = loadCartSnapshotFromStorage(user.id);
          if (snapshot && snapshot.items.length > 0) {
            // Dùng snapshot làm giỏ hàng hiện tại (hiển thị ngay)
            setCart(snapshot);
            // Đồng thời thử re-add các items lên server ở background
            (async () => {
              for (const item of snapshot.items) {
                try {
                  await cartApi.addItem({
                    variantId: item.variantId,
                    quantity: item.quantity,
                  });
                } catch {
                  // Sản phẩm hết hàng hoặc backend lỗi → bỏ qua
                }
              }
            })();
          } else {
            // Không có snapshot → giỏ thực sự trống
            setCart(res.data);
          }
        }
      } else {
        // API thất bại hoàn toàn → dùng snapshot nếu có
        const snapshot = loadCartSnapshotFromStorage(user.id);
        if (snapshot) {
          setCart(snapshot);
        }
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      // Lỗi mạng → dùng snapshot
      if (user?.id) {
        const snapshot = loadCartSnapshotFromStorage(user.id);
        if (snapshot) {
          setCart(snapshot);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Nạp giỏ hàng khi mount hoặc khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Khi đăng xuất: KHÔNG xóa snapshot, chỉ xóa state hiển thị
  useEffect(() => {
    if (!isAuthenticated) {
      // Lưu snapshot trước khi xóa state (nếu chưa lưu)
      const prevId = prevUserRef.current;
      if (prevId && cart && cart.items.length > 0) {
        saveCartSnapshotToStorage(cart, prevId);
      }
      setCart(null);
      // KHÔNG gọi clearGuestCart() ở đây → giữ snapshot
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track user changes
  useEffect(() => {
    const currentUserId = user?.id || null;
    prevUserRef.current = currentUserId;
  }, [user?.id]);

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
        // LƯU SNAPSHOT NGAY khi thêm thành công (đề phòng hard-navigate)
        if (user?.id) {
          saveCartSnapshotToStorage(res.data, user.id);
        }
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
        if (user?.id) saveCartSnapshotToStorage(res.data, user.id);
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
        if (user?.id) {
          if (res.data.items.length > 0) {
            saveCartSnapshotToStorage(res.data, user.id);
          } else {
            clearCartSnapshot(); // Giỏ trống → xóa snapshot
          }
        }
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
      clearCartSnapshot(); // Xóa snapshot khi người dùng CHỦ ĐỘNG xóa giỏ
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
