import { apiClient } from './apiClient';
import { extractApiError, ApiEnvelope } from './returnApi';
import {
  ReturnRequestDto,
  ApproveReturnRequestDto,
  RejectReturnRequestDto,
  ProcessReturnRefundDto,
  ReturnFilterDto,
  normalizeReturnRequest,
} from '../types/return';

/** Khớp với backend `MadK.Application.Common.PagedResult<T>` */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

async function postAction(
  url: string,
  body: unknown,
  fallback: string
): Promise<ReturnRequestDto> {
  try {
    const res = await apiClient.post<ApiEnvelope<ReturnRequestDto>>(url, body);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || fallback);
    }
    return normalizeReturnRequest(res.data.data);
  } catch (err) {
    throw new Error(extractApiError(err, fallback));
  }
}

export const adminReturnApi = {
  /**
   * Lấy danh sách toàn bộ yêu cầu đổi trả (Sales / Admin)
   */
  async getAllReturnRequests(filter?: ReturnFilterDto): Promise<PagedResult<ReturnRequestDto>> {
    const params: Record<string, string | number> = {};
    if (filter?.page) params.page = filter.page;
    if (filter?.pageSize) params.pageSize = filter.pageSize;
    if (filter?.status) params.status = filter.status;
    if (filter?.search?.trim()) params.search = filter.search.trim();

    try {
      const res = await apiClient.get<ApiEnvelope<PagedResult<ReturnRequestDto>>>('/admin/returns', {
        params,
      });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.error || 'Không thể tải danh sách đổi trả');
      }
      const data = res.data.data;
      return { ...data, items: (data.items || []).map(normalizeReturnRequest) };
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể tải danh sách đổi trả'));
    }
  },

  /**
   * Xem chi tiết yêu cầu đổi trả
   */
  async getReturnRequestById(id: string): Promise<ReturnRequestDto> {
    try {
      const res = await apiClient.get<ApiEnvelope<ReturnRequestDto>>(`/admin/returns/${id}`);
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.error || 'Không tìm thấy yêu cầu đổi trả');
      }
      return normalizeReturnRequest(res.data.data);
    } catch (err) {
      throw new Error(extractApiError(err, 'Không tìm thấy yêu cầu đổi trả'));
    }
  },

  /**
   * Sales duyệt yêu cầu đổi trả
   */
  approveReturnRequest(id: string, data: ApproveReturnRequestDto): Promise<ReturnRequestDto> {
    return postAction(`/admin/returns/${id}/approve`, data, 'Duyệt yêu cầu đổi trả thất bại');
  },

  /**
   * Sales từ chối yêu cầu đổi trả (bắt buộc ghi lý do)
   */
  rejectReturnRequest(id: string, data: RejectReturnRequestDto): Promise<ReturnRequestDto> {
    return postAction(`/admin/returns/${id}/reject`, data, 'Từ chối yêu cầu đổi trả thất bại');
  },

  /**
   * Xác nhận nhận hàng về kho & thực hiện hoàn tiền (idempotent theo idempotencyKey)
   */
  completeReturnAndRefund(id: string, data: ProcessReturnRefundDto): Promise<ReturnRequestDto> {
    return postAction(`/admin/returns/${id}/complete`, data, 'Xử lý hoàn tiền & nhập kho thất bại');
  },
};

export default adminReturnApi;
