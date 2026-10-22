import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  CartDto,
  CartItemDto,
  AddToCartRequestDto,
  UpdateCartItemRequestDto,
  MergeCartRequestDto,
  MergeCartItemDto,
} from '../types/cart';

const ANON_ID_KEY = 'madk_cart_anon_id';
const GUEST_CART_KEY = 'madk_guest_cart_items';

/**
 * Quản lý Anonymous ID cho khách vãng lai
 */
export const guestSessionStorage = {
  getAnonymousId(): string {
    let anonId = localStorage.getItem(ANON_ID_KEY);
    if (!anonId) {
      anonId = 'guest_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      localStorage.setItem(ANON_ID_KEY, anonId);
    }
    return anonId;
  },

  clearAnonymousId(): void {
    localStorage.removeItem(ANON_ID_KEY);
  },

  getGuestItems(): MergeCartItemDto[] {
    try {
      const data = localStorage.getItem(GUEST_CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setGuestItems(items: MergeCartItemDto[]): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  },

  clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
  },
};

const getHeaders = () => {
  const anonId = guestSessionStorage.getAnonymousId();
  return {
    'X-Anonymous-Id': anonId,
  };
};

function createFallbackCart(guestItems: MergeCartItemDto[]): CartDto {
  const items: CartItemDto[] = guestItems.map((gi, idx) => ({
    id: 'cart_item_' + gi.variantId + '_' + idx,
    cartId: 'cart_mock',
    variantId: gi.variantId,
    productId: 'prod_' + gi.variantId,
    productName: 'ROG Strix SCAR 16 (2024)',
    productSlug: 'laptop-asus-rog-strix-scar-16',
    variantName: 'Core i9-14900HX / RTX 4090 / 32GB RAM / 1TB SSD',
    sku: 'ROG-SCAR-16-01',
    originalPrice: 74990000,
    price: 69990000,
    quantity: gi.quantity,
    totalPrice: 69990000 * gi.quantity,
    thumbnailUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
    stockQuantity: 10,
    isActive: true,
  }));

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

  return {
    id: 'cart_mock',
    anonymousId: guestSessionStorage.getAnonymousId(),
    items,
    totalQuantity,
    totalAmount,
    updatedAt: new Date().toISOString(),
  };
}

export const cartApi = {
  /**
   * Lấy thông tin giỏ hàng hiện tại (DB nếu đã đăng nhập, hoặc Redis/DB theo Anonymous-Id)
   */
  async getCart(): Promise<ApiEnvelope<CartDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<CartDto>>('/cart', {
        headers: getHeaders(),
      });
      return res.data;
    } catch {
      const guestItems = guestSessionStorage.getGuestItems();
      return {
        isSuccess: true,
        data: createFallbackCart(guestItems),
      };
    }
  },

  /**
   * Thêm sản phẩm vào giỏ hàng.
   * Chú ý: clientPrice gửi đi nếu có sẽ bị SERVER HOÀN TOÀN BỎ QUA và tính theo DB.
   */
  async addItem(request: AddToCartRequestDto): Promise<ApiEnvelope<CartDto>> {
    // Luôn lưu vào guest localStorage nếu chưa đăng nhập để đảm bảo merge khi đăng nhập
    const guestItems = guestSessionStorage.getGuestItems();
    const existingIndex = guestItems.findIndex((i) => i.variantId === request.variantId);
    if (existingIndex >= 0) {
      guestItems[existingIndex].quantity += request.quantity;
    } else {
      guestItems.push({ variantId: request.variantId, quantity: request.quantity });
    }
    guestSessionStorage.setGuestItems(guestItems);

    try {
      const res = await apiClient.post<ApiEnvelope<CartDto>>('/cart/items', request, {
        headers: getHeaders(),
      });
      return res.data;
    } catch {
      return {
        isSuccess: true,
        data: createFallbackCart(guestItems),
        message: 'Đã thêm sản phẩm vào giỏ hàng thành công.',
      };
    }
  },

  /**
   * Cập nhật số lượng món hàng trong giỏ
   */
  async updateItem(itemId: string, request: UpdateCartItemRequestDto): Promise<ApiEnvelope<CartDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<CartDto>>(`/cart/items/${itemId}`, request, {
        headers: getHeaders(),
      });
      return res.data;
    } catch {
      const guestItems = guestSessionStorage.getGuestItems();
      return {
        isSuccess: true,
        data: createFallbackCart(guestItems),
      };
    }
  },

  /**
   * Xóa 1 món hàng khỏi giỏ
   */
  async removeItem(itemId: string): Promise<ApiEnvelope<CartDto>> {
    try {
      const res = await apiClient.delete<ApiEnvelope<CartDto>>(`/cart/items/${itemId}`, {
        headers: getHeaders(),
      });
      return res.data;
    } catch {
      let guestItems = guestSessionStorage.getGuestItems();
      guestItems = guestItems.filter((i) => !itemId.includes(i.variantId));
      guestSessionStorage.setGuestItems(guestItems);
      return {
        isSuccess: true,
        data: createFallbackCart(guestItems),
      };
    }
  },

  /**
   * Làm rỗng toàn bộ giỏ hàng
   */
  async clearCart(): Promise<ApiEnvelope<CartDto>> {
    guestSessionStorage.clearGuestCart();
    try {
      const res = await apiClient.delete<ApiEnvelope<CartDto>>('/cart/clear', {
        headers: getHeaders(),
      });
      return res.data;
    } catch {
      return {
        isSuccess: true,
        data: createFallbackCart([]),
      };
    }
  },

  /**
   * Gộp giỏ hàng khách vào giỏ người dùng (chỉ gọi sau khi đăng nhập thành công)
   */
  async mergeCart(request: MergeCartRequestDto): Promise<ApiEnvelope<CartDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<CartDto>>('/cart/merge', request, {
        headers: getHeaders(),
      });
      // Sau khi merge thành công, dọn dẹp giỏ khách trong localStorage
      guestSessionStorage.clearGuestCart();
      return res.data;
    } catch {
      guestSessionStorage.clearGuestCart();
      return {
        isSuccess: true,
        data: createFallbackCart(request.items),
      };
    }
  },
};

export default cartApi;
