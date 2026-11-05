import { apiClient } from './apiClient';
import { Result, PagedResult } from '../types/catalog';
import {
  AdminReviewDto,
  AdminReviewStatusUpdateDto,
  ReviewStatus,
} from '../types/review';

export interface AdminReviewFilterParams {
  page?: number;
  pageSize?: number;
  status?: ReviewStatus;
  productId?: string;
  search?: string;
}

export const adminReviewApi = {
  /**
   * Lấy danh sách đánh giá phục vụ kiểm duyệt
   */
  async getReviews(params: AdminReviewFilterParams = {}): Promise<PagedResult<AdminReviewDto>> {
    const response = await apiClient.get<Result<PagedResult<AdminReviewDto>>>(
      '/admin/reviews',
      { params }
    );

    if (!response.data.isSuccess || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Không thể tải danh sách kiểm duyệt');
    }

    return response.data.data;
  },

  /**
   * Cập nhật trạng thái duyệt / từ chối / phản hồi đánh giá
   */
  async updateStatus(
    reviewId: string,
    data: AdminReviewStatusUpdateDto
  ): Promise<AdminReviewDto> {
    const response = await apiClient.put<Result<AdminReviewDto>>(
      `/admin/reviews/${reviewId}/status`,
      data
    );

    if (!response.data.isSuccess || !response.data.data) {
      throw new Error(response.data.error || response.data.message || 'Không thể cập nhật trạng thái');
    }

    return response.data.data;
  },

  /**
   * Xóa đánh giá (soft delete)
   */
  async deleteReview(reviewId: string): Promise<boolean> {
    const response = await apiClient.delete<Result<boolean>>(
      `/admin/reviews/${reviewId}`
    );

    if (!response.data.isSuccess) {
      throw new Error(response.data.error || response.data.message || 'Không thể xóa đánh giá');
    }

    return true;
  },
};

export default adminReviewApi;
