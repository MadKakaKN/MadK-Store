import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  OrderDto,
  OrderStatus,
  CancelOrderRequestDto,
} from '../types/order';

export const orderApi = {
  /**
   * Lấy danh sách đơn hàng của người dùng hiện tại (hỗ trợ lọc theo trạng thái).
   */
  async getMyOrders(status?: OrderStatus): Promise<ApiEnvelope<OrderDto[]>> {
    try {
      const params = status ? { status } : {};
      const res = await apiClient.get<ApiEnvelope<OrderDto[]>>('/orders/my-orders', { params });
      return res.data;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Không thể tải danh sách đơn hàng.');
      return { isSuccess: false, error: msg };
    }
  },

  /**
   * Xem chi tiết đơn hàng theo mã đơn (MK-YYYYMMDD-XXXXXX).
   * Server có kiểm tra IDOR: chỉ chủ sở hữu hoặc Staff/Admin mới xem được.
   */
  async getOrderByNumber(orderNumber: string): Promise<ApiEnvelope<OrderDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<OrderDto>>(`/orders/${encodeURIComponent(orderNumber)}`);
      return res.data;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Không thể tải chi tiết đơn hàng.');
      return { isSuccess: false, error: msg };
    }
  },

  /**
   * Khách hàng tự hủy đơn hàng khi còn ở Pending / Confirmed / PendingPayment.
   * Server hoàn kho (giải phóng tồn giữ) và lưu vết lịch sử hủy đơn.
   */
  async cancelOrder(orderNumber: string, reason: string): Promise<ApiEnvelope<OrderDto>> {
    try {
      const payload: CancelOrderRequestDto = { reason: reason.trim() };
      const res = await apiClient.post<ApiEnvelope<OrderDto>>(
        `/orders/${encodeURIComponent(orderNumber)}/cancel`,
        payload
      );
      return res.data;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Lỗi khi hủy đơn hàng.');
      return { isSuccess: false, error: msg };
    }
  },
};

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  if (err && typeof err === 'object') {
    const anyErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
    if (anyErr.response?.data?.error) return anyErr.response.data.error;
    if (anyErr.response?.data?.message) return anyErr.response.data.message;
    if (anyErr.message) return anyErr.message;
  }
  return defaultMsg;
}

export default orderApi;
