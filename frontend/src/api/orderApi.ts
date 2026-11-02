import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  OrderDto,
  OrderStatus,
  CancelOrderRequestDto,
  CheckoutCodRequestDto,
} from '../types/order';
import { guestSessionStorage } from './cartApi';
import { MOCK_PRODUCTS } from './mockData';

const MOCK_ORDERS_KEY = 'madk_mock_orders_store';

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

function getStoredMockOrders(): OrderDto[] {
  try {
    const raw = localStorage.getItem(MOCK_ORDERS_KEY);
    const parsed: OrderDto[] = raw ? JSON.parse(raw) : [];
    const orders: OrderDto[] = parsed.map(normalizeOrder);
    // Tự động dọn dẹp đơn hàng mẫu cũ (Keychron)
    const cleaned = orders.filter(
      (o) => !o.items?.some((i) => i.productNameSnapshot?.includes('Keychron Custom Edition'))
    );
    if (cleaned.length !== orders.length) {
      saveStoredMockOrders(cleaned);
    }
    return cleaned;
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
        res.data.data = normalizeOrder(res.data.data);
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
        const normalized = res.data.data.map(normalizeOrder);
        res.data.data = normalized;
        // Đồng bộ vào cache
        const stored = getStoredMockOrders();
        const serverMap = new Map(normalized.map(o => [o.orderNumber, o]));
        const merged = [...normalized, ...stored.filter(o => !serverMap.has(o.orderNumber))];
        saveStoredMockOrders(merged);
        return { isSuccess: true, data: merged };
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
      if (res.data?.isSuccess && res.data.data) {
        res.data.data = normalizeOrder(res.data.data);
      }
      return res.data;
    } catch {
      const found = getStoredMockOrders().find((o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase());
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
    if (anyErr.response?.status && anyErr.response.status >= 400 && anyErr.response.status < 500) {
      if (anyErr.response.status === 401) {
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      }
      return `Lỗi hệ thống (${anyErr.response.status}): Vui lòng kiểm tra lại thông tin đơn hàng.`;
    }
  }
  return null;
}

function createFallbackMockOrder(request: CheckoutCodRequestDto): OrderDto {
  const now = new Date().toISOString();
  const orderNumber = generateMockOrderNumber();
  const shippingAddress = request.shippingAddress || {
    recipientName: 'Khách hàng',
    phoneNumber: '0987654321',
    provinceName: 'Thành phố Hồ Chí Minh',
    districtName: 'Quận 1',
    wardName: 'Phường Bến Nghé',
    detailedAddress: 'Số 123 Lê Duẩn',
  };

  // Mock items from request with actual matched product/variant details
  const items = (request.items || []).map((item, idx) => {
    // Tìm trong danh mục sản phẩm mẫu
    let matchedProd = null;
    let matchedVar = null;
    for (const p of MOCK_PRODUCTS) {
      const v = p.variants?.find((pv) => pv.id === item.variantId);
      if (v) {
        matchedProd = p;
        matchedVar = v;
        break;
      }
      if (p.id === item.variantId) {
        matchedProd = p;
        break;
      }
    }

    const price = matchedVar?.salePrice || matchedProd?.basePrice || 1000000;
    return {
      id: 'item_' + idx + '_' + Date.now(),
      variantId: item.variantId,
      productId: matchedProd?.id || 'prod_' + item.variantId,
      productNameSnapshot: matchedProd?.name || 'Sản phẩm công nghệ chính hãng',
      variantNameSnapshot: matchedVar?.name || 'Tiêu chuẩn',
      skuSnapshot: matchedVar?.sku || `SKU-${idx}`,
      unitPriceSnapshot: price,
      originalPriceSnapshot: matchedVar?.originalPrice || price,
      quantity: item.quantity,
      totalPrice: price * item.quantity,
      attributesSnapshot: JSON.stringify(matchedVar?.attributes || {}),
      thumbnailUrlSnapshot: matchedProd?.thumbnailUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    };
  });

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
