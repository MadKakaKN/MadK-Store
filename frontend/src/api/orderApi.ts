import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  OrderDto,
  OrderStatus,
  CancelOrderRequestDto,
  CheckoutCodRequestDto,
} from '../types/order';
import { guestSessionStorage } from './cartApi';

const ORDERS_CACHE_KEY = 'madk_orders_cache';

export function normalizeOrder(order: OrderDto): OrderDto {
  if (!order) return order;
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      productName: item.productName || item.productNameSnapshot || 'Sản phẩm công nghệ chính hãng',
      productNameSnapshot: item.productNameSnapshot || item.productName || 'Sản phẩm công nghệ chính hãng',
      variantName: item.variantName || item.variantNameSnapshot || 'Tiêu chuẩn',
      variantNameSnapshot: item.variantNameSnapshot || item.variantName || 'Tiêu chuẩn',
      sku: item.sku || item.skuSnapshot || '',
      skuSnapshot: item.skuSnapshot || item.sku || '',
      unitPrice: item.unitPrice ?? item.unitPriceSnapshot ?? 0,
      unitPriceSnapshot: item.unitPriceSnapshot ?? item.unitPrice ?? 0,
      originalPrice: item.originalPrice ?? item.originalPriceSnapshot ?? item.unitPrice ?? 0,
      originalPriceSnapshot: item.originalPriceSnapshot ?? item.originalPrice ?? item.unitPriceSnapshot ?? 0,
      attributes: item.attributes || item.attributesSnapshot || '{}',
      attributesSnapshot: item.attributesSnapshot || item.attributes || '{}',
      specifications: item.specifications ?? item.specificationsSnapshot ?? null,
      specificationsSnapshot: item.specificationsSnapshot ?? item.specifications ?? null,
      thumbnailUrl: item.thumbnailUrl || item.thumbnailUrlSnapshot || null,
      thumbnailUrlSnapshot: item.thumbnailUrlSnapshot || item.thumbnailUrl || null,
    })),
  };
}

function getStoredOrders(): OrderDto[] {
  try {
    const raw = localStorage.getItem(ORDERS_CACHE_KEY);
    const parsed: OrderDto[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Tự động dọn dẹp các đơn mock cũ nếu còn lưu trong localStorage
    const cleaned = parsed
      .map(normalizeOrder)
      .filter(
        (o) =>
          o &&
          o.id &&
          !o.id.startsWith('ord_') &&
          !o.id.startsWith('ord-seed') &&
          !o.items?.some((i) => i.productNameSnapshot?.includes('Keychron Custom Edition'))
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
    localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders cache:', err);
  }
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

      const paymentMethodMap: Record<string, number> = {
        COD: 1,
        VNPay: 2,
        BankTransfer: 3,
        MoMo: 4,
      };

      const numericPaymentMethod =
        request.paymentMethod && typeof request.paymentMethod === 'string'
          ? (paymentMethodMap[request.paymentMethod] ?? 1)
          : request.paymentMethod ?? 1;

      const payload = {
        ...request,
        paymentMethod: numericPaymentMethod,
      };

      const res = await apiClient.post<ApiEnvelope<OrderDto>>('/orders/checkout/cod', payload, {
        headers,
      });

      if (res.data?.isSuccess && res.data.data) {
        res.data.data = normalizeOrder(res.data.data);
        // Lưu cache cục bộ để hỗ trợ xem nhanh
        const stored = getStoredOrders();
        saveStoredOrders([res.data.data, ...stored.filter((o) => o.orderNumber !== res.data.data!.orderNumber)]);
        guestSessionStorage.clearGuestCart();
      }

      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      return {
        isSuccess: false,
        error:
          serverError ||
          'Không thể kết nối đến máy chủ để hoàn tất đặt hàng. Vui lòng kiểm tra lại kết nối mạng.',
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
      if (res.data?.isSuccess && Array.isArray(res.data.data)) {
        const normalized = res.data.data.map(normalizeOrder);
        res.data.data = normalized;
        saveStoredOrders(normalized);
        return { isSuccess: true, data: normalized };
      }
      return res.data;
    } catch {
      // Fallback cache từ localStorage khi mất kết nối
      let orders = getStoredOrders();
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
      if (res.data?.isSuccess && res.data.data) {
        res.data.data = normalizeOrder(res.data.data);
      }
      return res.data;
    } catch {
      const found = getStoredOrders().find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (found) {
        return { isSuccess: true, data: normalizeOrder(found) };
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
        const stored = getStoredOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredOrders(stored);
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      return {
        isSuccess: false,
        error: serverError || 'Không thể hủy đơn hàng vào lúc này. Vui lòng thử lại sau.',
      };
    }
  },
};

function extractServerBusinessError(err: unknown): string | null {
  if (err && typeof err === 'object') {
    const anyErr = err as {
      response?: {
        status?: number;
        data?: {
          error?: string;
          message?: string;
          title?: string;
          errors?: Record<string, string[]>;
        };
      };
    };
    if (anyErr.response?.data?.error) return anyErr.response.data.error;
    if (anyErr.response?.data?.message) return anyErr.response.data.message;

    // Trích xuất lỗi chi tiết từ Model Validation của ASP.NET Core
    if (anyErr.response?.data?.errors && typeof anyErr.response.data.errors === 'object') {
      const errorKeys = Object.keys(anyErr.response.data.errors);
      for (const key of errorKeys) {
        const msgs = anyErr.response.data.errors[key];
        if (Array.isArray(msgs) && msgs.length > 0) {
          return msgs[0];
        }
      }
    }

    if (anyErr.response?.data?.title && anyErr.response.data.title !== 'One or more validation errors occurred.') {
      return anyErr.response.data.title;
    }

    if (anyErr.response?.status && anyErr.response.status >= 400 && anyErr.response.status < 500) {
      if (anyErr.response.status === 401) {
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      }
      return `Lỗi máy chủ (${anyErr.response.status}): Vui lòng kiểm tra lại thông tin.`;
    }
  }
  return null;
}

export default orderApi;
