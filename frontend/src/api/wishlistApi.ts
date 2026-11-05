import { apiClient } from './apiClient';
import { Result } from '../types/catalog';
import { WishlistItemDto } from '../types/wishlist';

export const wishlistApi = {
  /**
   * Lấy danh sách sản phẩm yêu thích của người dùng
   */
  async getWishlist(): Promise<WishlistItemDto[]> {
    const response = await apiClient.get<Result<WishlistItemDto[]>>('/wishlist');
    if (!response.data.isSuccess || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Không thể tải danh sách yêu thích');
    }
    return response.data.data;
  },

  /**
   * Lấy danh sách ID các sản phẩm đã thích (dùng cho icon trái tim trên toàn site)
   */
  async getWishlistProductIds(): Promise<string[]> {
    const response = await apiClient.get<Result<string[]>>('/wishlist/ids');
    if (!response.data.isSuccess || !response.data.data) {
      return [];
    }
    return response.data.data;
  },

  /**
   * Thêm sản phẩm vào danh sách yêu thích
   */
  async addToWishlist(productId: string): Promise<WishlistItemDto> {
    const response = await apiClient.post<Result<WishlistItemDto>>(`/wishlist/${productId}`);
    if (!response.data.isSuccess || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Không thể thêm vào yêu thích');
    }
    return response.data.data;
  },

  /**
   * Xóa sản phẩm khỏi danh sách yêu thích
   */
  async removeFromWishlist(productId: string): Promise<boolean> {
    const response = await apiClient.delete<Result<boolean>>(`/wishlist/${productId}`);
    return response.data.isSuccess;
  },

  /**
   * Đồng bộ danh sách yêu thích từ LocalStorage vào tài khoản
   */
  async syncWishlist(productIds: string[]): Promise<WishlistItemDto[]> {
    const response = await apiClient.post<Result<WishlistItemDto[]>>('/wishlist/sync', {
      productIds,
    });
    if (!response.data.isSuccess || !response.data.data) {
      return [];
    }
    return response.data.data;
  },

  /**
   * Kiểm tra sản phẩm đã được thích chưa
   */
  async checkIsInWishlist(productId: string): Promise<boolean> {
    const response = await apiClient.get<Result<boolean>>(`/wishlist/${productId}/check`);
    return !!response.data.data;
  },
};

export default wishlistApi;
