import { apiClient } from './apiClient';
import { Result } from '../types/catalog';
import {
  ProductReviewsPagedResultDto,
  CreateProductReviewDto,
  ProductReviewDto,
  CanReviewProductResultDto,
} from '../types/review';

export const reviewApi = {
  /**
   * Lấy danh sách đánh giá công khai của sản phẩm kèm tóm tắt điểm và phân bổ sao
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    pageSize: number = 10,
    rating?: number
  ): Promise<ProductReviewsPagedResultDto> {
    const params: Record<string, any> = { page, pageSize };
    if (rating && rating >= 1 && rating <= 5) {
      params.rating = rating;
    }

    const response = await apiClient.get<Result<ProductReviewsPagedResultDto>>(
      `/products/${productId}/reviews`,
      { params }
    );

    if (!response.data.isSuccess || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Không thể tải danh sách đánh giá');
    }

    return response.data.data;
  },

  /**
   * Kiểm tra xem user hiện tại có thể đánh giá sản phẩm hay không
   */
  async canReviewProduct(productId: string): Promise<CanReviewProductResultDto> {
    const response = await apiClient.get<Result<CanReviewProductResultDto>>(
      `/products/${productId}/reviews/can-review`
    );

    if (!response.data.isSuccess || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Không thể kiểm tra điều kiện đánh giá');
    }

    return response.data.data;
  },

  /**
   * Gửi đánh giá mới cho sản phẩm
   */
  async createReview(
    productId: string,
    data: CreateProductReviewDto
  ): Promise<ProductReviewDto> {
    const response = await apiClient.post<Result<ProductReviewDto>>(
      `/products/${productId}/reviews`,
      data
    );

    if (!response.data.isSuccess || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Không thể gửi đánh giá');
    }

    return response.data.data;
  },

  /**
   * Vote đánh giá hữu ích
   */
  async voteHelpful(reviewId: string): Promise<number> {
    const response = await apiClient.post<Result<number>>(
      `/products/reviews/${reviewId}/helpful`
    );

    if (!response.data.isSuccess || response.data.data === undefined || response.data.data === null) {
      throw new Error(response.data.error || response.data.message || 'Không thể bình chọn hữu ích');
    }

    return response.data.data;
  },
};

export default reviewApi;
