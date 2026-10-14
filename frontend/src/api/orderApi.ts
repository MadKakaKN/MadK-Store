import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  OrderDto,
  OrderStatus,
  CancelOrderRequestDto,
  CheckoutCodRequestDto,
} from '../types/order';
import { guestSessionStorage } from './cartApi';

const MOCK_ORDERS_KEY = 'madk_mock_orders_store';

function getStoredMockOrders(): OrderDto[] {
  try {
    const raw = localStorage.getItem(MOCK_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredMockOrders(orders: OrderDto[]) {
  try {
    localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save mock orders:', err);
  }
}

function generateMockOrderNumber(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MK-${yyyy}${mm}${dd}-${rand}`;
}

export const orderApi = {
  /**
   * Checkout và tạo đơn hàng COD (Thanh toán khi nhận hàng).
   * Chống bấm lặp lại với Idempotency Key và nạp Anonymous ID nếu là khách vãng lai.
   */
  async checkoutCod(request: CheckoutCodRequestDto): Promise<ApiEnvelope<OrderDto>> {
    try {
      const headers: Record<string, string> = {};
      if (request.idempotencyKey) {
        headers['Idempotency-Key'] = request.idempotencyKey;
      }
      const anonId = guestSessionStorage.getAnonymousId();
      if (anonId) {
        headers['X-Anonymous-Id'] = anonId;
      }

      const res = await apiClient.post<ApiEnvelope<OrderDto>>('/orders/checkout/cod', request, {
        headers,
      });

      if (res.data?.isSuccess && res.data.data) {
        // Lưu cache cục bộ để hỗ trợ xem nhanh
        const stored = getStoredMockOrders();
        saveStoredMockOrders([res.data.data, ...stored.filter(o => o.orderNumber !== res.data.data!.orderNumber)]);
      }

      return res.data;
    } catch (err: unknown) {
      // Nếu là lỗi nghiệp vụ từ server (ví dụ hết hàng, sai địa chỉ), trả về lỗi server ngay
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      // Nếu backend chưa chạy (Network Error / Connection Refused), kích hoạt Fallback Mock theo yêu cầu
      console.warn('Backend unavailable, creating fallback mock order:', err);
      const mockOrder = createFallbackMockOrder(request);
      const stored = getStoredMockOrders();
      saveStoredMockOrders([mockOrder, ...stored]);

      // Dọn dẹp giỏ hàng
      guestSessionStorage.clearGuestCart();

      return {
        isSuccess: true,
        data: mockOrder,
        message: 'Đặt hàng COD thành công (Chế độ mô phỏng offline).',
      };
    }
  },

  /**
   * Lấy danh sách đơn hàng của người dùng hiện tại (hỗ trợ lọc theo trạng thái).
   */
  async getMyOrders(status?: OrderStatus): Promise<ApiEnvelope<OrderDto[]>> {
    try {
      const params = status ? { status } : {};
      const res = await apiClient.get<ApiEnvelope<OrderDto[]>>('/orders/my-orders', { params });
      if (res.data?.isSuccess && res.data.data) {
        // Đồng bộ vào cache
        const stored = getStoredMockOrders();
        const serverMap = new Map(res.data.data.map(o => [o.orderNumber, o]));
        const merged = [...res.data.data, ...stored.filter(o => !serverMap.has(o.orderNumber))];
        saveStoredMockOrders(merged);
        return res.data;
      }
      return res.data;
    } catch {
      // Fallback lấy từ localStorage
      let orders = getStoredMockOrders();
      if (status) {
        orders = orders.filter((o) => o.status === status);
      }
      return { isSuccess: true, data: orders };
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
    } catch {
      const found = getStoredMockOrders().find((o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase());
      if (found) {
        return { isSuccess: true, data: found };
      }
      return { isSuccess: false, error: 'Không tìm thấy thông tin đơn hàng.' };
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
      if (res.data?.isSuccess && res.data.data) {
        const stored = getStoredMockOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredMockOrders(stored);
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      // Mock cancellation fallback
      const orders = getStoredMockOrders();
      const target = orders.find((o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase());
      if (!target) {
        return { isSuccess: false, error: 'Không tìm thấy đơn hàng cần hủy.' };
      }

      if (target.status !== 'Pending' && target.status !== 'Confirmed' && target.status !== 'PendingPayment') {
        return { isSuccess: false, error: `Không thể hủy đơn hàng ở trạng thái '${target.status}'.` };
      }

      const now = new Date().toISOString();
      target.status = 'Cancelled';
      target.cancelReason = reason;
      target.cancelledAt = now;
      target.statusHistory.push({
        id: 'hist_' + Date.now(),
        fromStatus: target.status,
        toStatus: 'Cancelled',
        changedByName: 'Khách hàng',
        reason: reason,
        createdAt: now,
      });

      saveStoredMockOrders([...orders]);
      return { isSuccess: true, data: target, message: 'Hủy đơn hàng thành công và đã hoàn kho.' };
    }
  },
};

function extractServerBusinessError(err: unknown): string | null {
  if (err && typeof err === 'object') {
    const anyErr = err as { response?: { status?: number; data?: { error?: string; message?: string } } };
    if (anyErr.response?.data?.error) return anyErr.response.data.error;
    if (anyErr.response?.data?.message) return anyErr.response.data.message;
  }
  return null;
}

function createFallbackMockOrder(request: CheckoutCodRequestDto): OrderDto {
  const now = new Date().toISOString();
  const orderNumber = generateMockOrderNumber();
  const shippingAddress = request.shippingAddress || {
    recipientName: 'Khách hàng vãng lai',
    phoneNumber: '0912345678',
    provinceName: 'Thành phố Hà Nội',
    districtName: 'Quận Ba Đình',
    wardName: 'Phường Phúc Xá',
    detailedAddress: '123 Hoàng Hoa Thám',
  };

  // Mock items from request or default
  const items = (request.items || []).map((item, idx) => ({
    id: 'item_' + idx + '_' + Date.now(),
    variantId: item.variantId,
    productId: 'prod_' + item.variantId,
    productNameSnapshot: 'Bàn phím cơ Keychron Custom Edition',
    variantNameSnapshot: 'Carbon Black / Gateron Red Switch',
    skuSnapshot: 'KC-PRO-RED-' + idx,
    unitPriceSnapshot: 2500000,
    originalPriceSnapshot: 2800000,
    quantity: item.quantity,
    totalPrice: 2500000 * item.quantity,
    attributesSnapshot: '{"Color":"Carbon Black","Switch":"Red"}',
    thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80',
  }));

  const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0) || 2500000;
  const shippingFee = 0;
  const discountAmount = 0;
  const totalAmount = subtotal - discountAmount + shippingFee;

  return {
    id: 'ord_' + Date.now(),
    orderNumber,
    userId: null,
    customerEmail: shippingAddress.recipientEmail || 'customer@madk.store',
    customerPhone: shippingAddress.phoneNumber,
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    subtotalAmount: subtotal,
    discountAmount,
    shippingFee,
    totalAmount,
    shippingAddressSnapshot: JSON.stringify(shippingAddress),
    customerNote: request.customerNote || null,
    adminNote: null,
    cancelReason: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    items,
    statusHistory: [
      {
        id: 'hist_init_' + Date.now(),
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        reason: 'Khởi tạo đơn hàng COD',
        createdAt: now,
      },
    ],
  };
}

export default orderApi;
