import axios from 'axios';
import { apiClient } from './apiClient';
import {
  ReturnRequestDto,
  CreateReturnRequestDto,
  normalizeReturnRequest,
} from '../types/return';

export interface ApiEnvelope<T> {
  isSuccess: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Backend trả về HTTP 400/404 kèm Result envelope `{ isSuccess:false, error }`.
 * Axios ném lỗi cho các status này nên cần bóc tách thông báo nghiệp vụ.
 */
export function extractApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string; title?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (data?.title) return data.title;
    if (err.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (err.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (!err.response) return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export const returnApi = {
  /**
   * Khách hàng tạo yêu cầu đổi trả cho một đơn hàng đã hoàn tất (Completed)
   */
  async createReturnRequest(orderNumber: string, data: CreateReturnRequestDto): Promise<ReturnRequestDto> {
    try {
      const res = await apiClient.post<ApiEnvelope<ReturnRequestDto>>(
        `/orders/${encodeURIComponent(orderNumber)}/returns`,
        data
      );
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.error || 'Không thể tạo yêu cầu đổi trả');
      }
      return normalizeReturnRequest(res.data.data);
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể tạo yêu cầu đổi trả'));
    }
  },

  /**
   * Khách hàng xem danh sách yêu cầu đổi trả của đơn hàng
   */
  async getReturnRequestsByOrder(orderNumber: string): Promise<ReturnRequestDto[]> {
    try {
      const res = await apiClient.get<ApiEnvelope<ReturnRequestDto[]>>(
        `/orders/${encodeURIComponent(orderNumber)}/returns`
      );
      if (!res.data.isSuccess) {
        throw new Error(res.data.error || 'Không thể tải danh sách yêu cầu đổi trả');
      }
      return (res.data.data || []).map(normalizeReturnRequest);
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể tải danh sách yêu cầu đổi trả'));
    }
  },

  /**
   * Xem chi tiết một yêu cầu đổi trả cụ thể
   */
  async getReturnRequestById(id: string): Promise<ReturnRequestDto> {
    try {
      const res = await apiClient.get<ApiEnvelope<ReturnRequestDto>>(`/returns/${id}`);
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.error || 'Không tìm thấy yêu cầu đổi trả');
      }
      return normalizeReturnRequest(res.data.data);
    } catch (err) {
      throw new Error(extractApiError(err, 'Không tìm thấy yêu cầu đổi trả'));
    }
  },
};

export default returnApi;
