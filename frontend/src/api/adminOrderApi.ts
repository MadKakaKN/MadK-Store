import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  OrderDto,
  OrderStatus,
  UpdateOrderStatusRequestDto,
  CancelOrderRequestDto,
} from '../types/order';

export interface OrderAdminFilter {
  page?: number;
  pageSize?: number;
  status?: OrderStatus | 'ALL';
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface PagedOrderResult {
  items: OrderDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const ADMIN_ORDERS_KEY = 'madk_admin_orders_store';

function getStoredOrders(): OrderDto[] {
  try {
    const raw = localStorage.getItem(ADMIN_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    const cleaned = parsed.filter(
      (o: OrderDto) => o && o.id && !o.id.startsWith('ord-demo') && !o.id.startsWith('ord-seed')
    );
    if (cleaned.length !== parsed.length) {
      saveStoredOrders(cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

function saveStoredOrders(orders: OrderDto[]) {
  try {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save admin orders to localStorage:', err);
  }
}

function getFilteredOrders(filter: OrderAdminFilter = {}): PagedOrderResult {
  let orders = getStoredOrders();

  if (filter.status && filter.status !== 'ALL') {
    orders = orders.filter((o) => o.status === filter.status);
  }

  if (filter.fromDate) {
    const from = new Date(filter.fromDate).getTime();
    orders = orders.filter((o) => new Date(o.createdAt).getTime() >= from);
  }

  if (filter.toDate) {
    const to = new Date(filter.toDate).getTime();
    orders = orders.filter((o) => new Date(o.createdAt).getTime() <= to);
  }

  if (filter.search && filter.search.trim()) {
    const s = filter.search.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(s) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(s)) ||
        (o.customerPhone && o.customerPhone.includes(s)) ||
        (o.shippingAddressSnapshot && o.shippingAddressSnapshot.toLowerCase().includes(s))
    );
  }

  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;
  const totalCount = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const items = orders.slice((page - 1) * pageSize, page * pageSize);

  return {
    items,
    totalCount,
    pageNumber: page,
    pageSize,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

export const adminOrderApi = {
  /**
   * Lấy danh sách toàn bộ đơn hàng (hỗ trợ lọc status, date range, search keyword).
   */
  async getAllOrders(filter: OrderAdminFilter = {}): Promise<ApiEnvelope<PagedOrderResult>> {
    try {
      const params: Record<string, string | number> = {
        page: filter.page || 1,
        pageSize: filter.pageSize || 20,
      };

      if (filter.status && filter.status !== 'ALL') {
        params.status = filter.status;
      }
      if (filter.fromDate) {
        params.fromDate = filter.fromDate;
      }
      if (filter.toDate) {
        params.toDate = filter.toDate;
      }
      if (filter.search && filter.search.trim()) {
        params.search = filter.search.trim();
      }

      const res = await apiClient.get<ApiEnvelope<PagedOrderResult>>('/admin/orders', { params });
      if (res.data?.isSuccess && res.data.data) {
        saveStoredOrders(res.data.data.items);
        return res.data;
      }
      return {
        isSuccess: true,
        data: getFilteredOrders(filter),
      };
    } catch {
      return {
        isSuccess: true,
        data: getFilteredOrders(filter),
      };
    }
  },

  /**
   * Xuất danh sách đơn hàng ra file Excel / CSV.
   */
  async exportOrdersCsv(filter: OrderAdminFilter = {}): Promise<Blob> {
    const params: Record<string, string | number> = {};
    if (filter.status && filter.status !== 'ALL') params.status = filter.status;
    if (filter.fromDate) params.fromDate = filter.fromDate;
    if (filter.toDate) params.toDate = filter.toDate;
    if (filter.search && filter.search.trim()) params.search = filter.search.trim();

    const res = await apiClient.get('/admin/orders/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  /**
   * Lấy chi tiết đơn hàng theo mã đơn.
   */
  async getOrderDetail(orderNumber: string): Promise<ApiEnvelope<OrderDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}`
      );
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
      const orders = getStoredOrders();
      const found = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (found) {
        return { isSuccess: true, data: found };
      }
      return res.data;
    } catch {
      const orders = getStoredOrders();
      const found = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (found) {
        return { isSuccess: true, data: found };
      }
      return { isSuccess: false, error: 'Không tìm thấy đơn hàng trong hệ thống.' };
    }
  },

  /**
   * Xóa toàn bộ đơn hàng trong hệ thống quản trị
   */
  clearAllOrders(): void {
    try {
      localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify([]));
      localStorage.setItem('madk_orders_cache', JSON.stringify([]));
    } catch (err) {
      console.error('Failed to clear admin orders storage:', err);
    }
  },

  /**
   * Cập nhật trạng thái đơn hàng theo state machine.
   */
  async updateOrderStatus(
    orderNumber: string,
    request: UpdateOrderStatusRequestDto,
    actorName: string = 'Nhân viên Quản trị'
  ): Promise<ApiEnvelope<OrderDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/status`,
        request
      );
      if (res.data?.isSuccess && res.data.data) {
        const orders = getStoredOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredOrders(orders);
        return res.data;
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      // Offline fallback state machine
      const orders = getStoredOrders();
      const target = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (!target) {
        return { isSuccess: false, error: 'Không tìm thấy đơn hàng cần cập nhật.' };
      }

      const oldStatus = target.status;
      const targetStatus = request.newStatus;

      // Validate transitions
      const valid = isValidTransition(oldStatus, targetStatus);
      if (!valid) {
        return {
          isSuccess: false,
          error: `Chuyển trạng thái từ '${oldStatus}' sang '${targetStatus}' không hợp lệ theo quy tắc vòng đời đơn hàng.`,
        };
      }

      const now = new Date().toISOString();
      target.status = targetStatus;
      if (request.note) {
        target.adminNote = request.note;
      }
      if (targetStatus === 'Completed' && target.paymentMethod === 'COD') {
        target.paymentStatus = 'Paid';
      }
      if (targetStatus === 'Cancelled') {
        target.cancelReason = request.reason || 'Nhân viên hủy đơn';
        target.cancelledAt = now;
      }

      target.statusHistory.push({
        id: 'hist_' + Date.now(),
        fromStatus: oldStatus,
        toStatus: targetStatus,
        changedByName: actorName,
        reason: request.reason || `Chuyển trạng thái sang ${targetStatus}`,
        note: request.note || null,
        createdAt: now,
      });

      saveStoredOrders([...orders]);

      return {
        isSuccess: true,
        data: target,
        message: `Chuyển trạng thái đơn ${orderNumber} sang "${targetStatus}" thành công.`,
      };
    }
  },

  /**
   * Cập nhật ghi chú nội bộ cho đơn hàng.
   */
  async updateOrderNote(
    orderNumber: string,
    adminNote: string,
    actorName: string = 'Nhân viên'
  ): Promise<ApiEnvelope<OrderDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/note`,
        { adminNote }
      );
      if (res.data?.isSuccess && res.data.data) {
        const orders = getStoredOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredOrders(orders);
        return res.data;
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      const orders = getStoredOrders();
      const target = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (!target) {
        return { isSuccess: false, error: 'Không tìm thấy đơn hàng cần ghi chú.' };
      }

      const now = new Date().toISOString();
      target.adminNote = adminNote.trim();

      target.statusHistory.push({
        id: 'hist_note_' + Date.now(),
        fromStatus: target.status,
        toStatus: target.status,
        changedByName: actorName,
        reason: 'Cập nhật ghi chú nội bộ',
        note: adminNote.trim(),
        createdAt: now,
      });

      saveStoredOrders([...orders]);

      return {
        isSuccess: true,
        data: target,
        message: 'Cập nhật ghi chú nội bộ thành công.',
      };
    }
  },

  /**
   * Hủy đơn hàng và hoàn kho.
   */
  async cancelOrder(
    orderNumber: string,
    reason: string,
    actorName: string = 'Nhân viên Sales/Admin'
  ): Promise<ApiEnvelope<OrderDto>> {
    try {
      const payload: CancelOrderRequestDto = { reason: reason.trim() };
      const res = await apiClient.post<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/cancel`,
        payload
      );
      if (res.data?.isSuccess && res.data.data) {
        const orders = getStoredOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredOrders(orders);
        return res.data;
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      return this.updateOrderStatus(
        orderNumber,
        {
          newStatus: 'Cancelled',
          reason: reason.trim(),
        },
        actorName
      );
    }
  },
};

function isValidTransition(current: OrderStatus, target: OrderStatus): boolean {
  if (current === 'PendingPayment') {
    return target === 'Pending' || target === 'Cancelled';
  }
  if (current === 'Pending') {
    return target === 'Confirmed' || target === 'Cancelled';
  }
  if (current === 'Confirmed') {
    return target === 'Processing' || target === 'Cancelled';
  }
  if (current === 'Processing') {
    return target === 'Shipping' || target === 'Cancelled';
  }
  if (current === 'Shipping') {
    return target === 'Completed' || target === 'Cancelled';
  }
  if (current === 'Completed') {
    return target === 'ReturnRequested';
  }
  if (current === 'ReturnRequested') {
    return target === 'Returned' || target === 'Completed';
  }
  return false;
}

function extractServerBusinessError(err: unknown): string | null {
  if (err && typeof err === 'object') {
    const anyErr = err as {
      response?: { status?: number; data?: { error?: string; message?: string } };
    };
    if (anyErr.response?.data?.error) return anyErr.response.data.error;
    if (anyErr.response?.data?.message) return anyErr.response.data.message;
  }
  return null;
}

export default adminOrderApi;
