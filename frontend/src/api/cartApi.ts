import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  CartDto,
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

export const cartApi = {
  /**
   * Lấy thông tin giỏ hàng hiện tại (DB nếu đã đăng nhập, hoặc Redis/DB theo Anonymous-Id)
   */
  async getCart(): Promise<ApiEnvelope<CartDto>> {
    const res = await apiClient.get<ApiEnvelope<CartDto>>('/cart', {
      headers: getHeaders(),
    });
    return res.data;
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

    const res = await apiClient.post<ApiEnvelope<CartDto>>('/cart/items', request, {
      headers: getHeaders(),
    });
    return res.data;
  },

  /**
   * Cập nhật số lượng món hàng trong giỏ
   */
  async updateItem(itemId: string, request: UpdateCartItemRequestDto): Promise<ApiEnvelope<CartDto>> {
    const res = await apiClient.put<ApiEnvelope<CartDto>>(`/cart/items/${itemId}`, request, {
      headers: getHeaders(),
    });
    return res.data;
  },

  /**
   * Xóa 1 món hàng khỏi giỏ
   */
  async removeItem(itemId: string): Promise<ApiEnvelope<CartDto>> {
    const res = await apiClient.delete<ApiEnvelope<CartDto>>(`/cart/items/${itemId}`, {
      headers: getHeaders(),
    });
    return res.data;
  },

  /**
   * Làm rỗng toàn bộ giỏ hàng
   */
  async clearCart(): Promise<ApiEnvelope<CartDto>> {
    guestSessionStorage.clearGuestCart();
    const res = await apiClient.delete<ApiEnvelope<CartDto>>('/cart/clear', {
      headers: getHeaders(),
    });
    return res.data;
  },

  /**
   * Gộp giỏ hàng khách vào giỏ người dùng (chỉ gọi sau khi đăng nhập thành công)
   */
  async mergeCart(request: MergeCartRequestDto): Promise<ApiEnvelope<CartDto>> {
    const res = await apiClient.post<ApiEnvelope<CartDto>>('/cart/merge', request, {
      headers: getHeaders(),
    });
    // Sau khi merge thành công, dọn dẹp giỏ khách trong localStorage
    guestSessionStorage.clearGuestCart();
    return res.data;
  },
};

export default cartApi;
