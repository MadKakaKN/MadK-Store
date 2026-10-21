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

const SEED_ADMIN_ORDERS: OrderDto[] = [
  {
    id: 'ord-seed-001',
    orderNumber: 'MK-20261015-8801',
    userId: 'user-001',
    customerEmail: 'nam.nguyen@gmail.com',
    customerPhone: '0901234567',
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    subtotalAmount: 2490000,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 2490000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Nguyễn Văn Nam',
      phoneNumber: '0901234567',
      provinceName: 'Thành phố Hà Nội',
      districtName: 'Quận Cầu Giấy',
      wardName: 'Phường Dịch Vọng Hậu',
      detailedAddress: 'Tòa nhà FPT, Phố Duy Tân',
      fullAddress: 'Tòa nhà FPT, Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Thành phố Hà Nội',
    }),
    customerNote: 'Giao hàng trong giờ hành chính',
    adminNote: 'Đơn mới, sales cần gọi xác nhận số lượng switch',
    cancelReason: null,
    cancelledAt: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item-001',
        variantId: 'var-001',
        productId: 'prod-001',
        productNameSnapshot: 'Bàn phím cơ không dây Keychron Q1 Pro',
        variantNameSnapshot: 'Carbon Black / Gateron Jupiter Red',
        skuSnapshot: 'KC-Q1P-RED',
        unitPriceSnapshot: 2490000,
        originalPriceSnapshot: 2890000,
        quantity: 1,
        totalPrice: 2490000,
        attributesSnapshot: '{"Color":"Carbon Black","Switch":"Red"}',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80',
      },
    ],
    statusHistory: [
      {
        id: 'hist-001',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Nguyễn Văn Nam (Khách hàng)',
        reason: 'Khởi tạo đơn hàng COD trực tuyến',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'ord-seed-002',
    orderNumber: 'MK-20261015-8802',
    userId: 'user-002',
    customerEmail: 'mai.le@outlook.com',
    customerPhone: '0912345678',
    status: 'Confirmed',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    subtotalAmount: 4980000,
    discountAmount: 200000,
    shippingFee: 0,
    totalAmount: 4780000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Lê Thị Mai',
      phoneNumber: '0912345678',
      provinceName: 'Thành phố Hồ Chí Minh',
      districtName: 'Quận 1',
      wardName: 'Phường Bến Nghé',
      detailedAddress: '123 Lê Lợi',
      fullAddress: '123 Lê Lợi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
    }),
    customerNote: 'Gọi trước khi giao 15 phút',
    adminNote: 'Đã gọi xác nhận, khách đồng ý nhận vào sáng thứ Bảy',
    cancelReason: null,
    cancelledAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item-002',
        variantId: 'var-002',
        productId: 'prod-002',
        productNameSnapshot: 'Chuột Logitech MX Master 3S Wireless',
        variantNameSnapshot: 'Pale Grey Edition',
        skuSnapshot: 'MX-3S-GRY',
        unitPriceSnapshot: 2490000,
        originalPriceSnapshot: 2990000,
        quantity: 2,
        totalPrice: 4980000,
        attributesSnapshot: '{"Color":"Pale Grey"}',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80',
      },
    ],
    statusHistory: [
      {
        id: 'hist-002-1',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Lê Thị Mai (Khách hàng)',
        reason: 'Khởi tạo đơn hàng',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'hist-002-2',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Trần Sales',
        reason: 'Đã gọi điện xác nhận đơn hàng thành công',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'ord-seed-003',
    orderNumber: 'MK-20261015-8803',
    userId: 'user-003',
    customerEmail: 'tuan.tran@yahoo.com',
    customerPhone: '0987654321',
    status: 'Processing',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    subtotalAmount: 18990000,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 18990000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Trần Minh Tuấn',
      phoneNumber: '0987654321',
      provinceName: 'Thành phố Đà Nẵng',
      districtName: 'Quận Hải Châu',
      wardName: 'Phường Thạch Thang',
      detailedAddress: '45 Quang Trung',
      fullAddress: '45 Quang Trung, Phường Thạch Thang, Quận Hải Châu, Thành phố Đà Nẵng',
    }),
    customerNote: 'Kiểm tra kỹ tem bảo hành giúp mình',
    adminNote: 'Kho đang kiểm tra hàng và dán tem bảo hành',
    cancelReason: null,
    cancelledAt: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item-003',
        variantId: 'var-003',
        productId: 'prod-003',
        productNameSnapshot: 'Màn hình ASUS ROG Swift OLED PG27AQDM',
        variantNameSnapshot: '27 inch 240Hz 0.03ms',
        skuSnapshot: 'ASUS-PG27AQDM',
        unitPriceSnapshot: 18990000,
        originalPriceSnapshot: 21990000,
        quantity: 1,
        totalPrice: 18990000,
        attributesSnapshot: '{"Screen":"27 inch OLED"}',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80',
      },
    ],
    statusHistory: [
      {
        id: 'hist-003-1',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Trần Minh Tuấn',
        reason: 'Đặt hàng trực tuyến',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'hist-003-2',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Trần Sales',
        reason: 'Xác nhận thông tin khách',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'hist-003-3',
        fromStatus: 'Confirmed',
        toStatus: 'Processing',
        changedByName: 'Vũ Kho (Warehouse)',
        reason: 'In phiếu xuất và chuẩn bị đóng gói',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'ord-seed-004',
    orderNumber: 'MK-20261014-8790',
    userId: 'user-004',
    customerEmail: 'lananh.hoang@gmail.com',
    customerPhone: '0933221144',
    status: 'Shipping',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    subtotalAmount: 1250000,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 1250000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Hoàng Lan Anh',
      phoneNumber: '0933221144',
      provinceName: 'Tỉnh Bình Dương',
      districtName: 'Thành phố Thủ Dầu Một',
      wardName: 'Phường Phú Cường',
      detailedAddress: '88 Bạch Đằng',
      fullAddress: '88 Bạch Đằng, Phường Phú Cường, Thành phố Thủ Dầu Một, Tỉnh Bình Dương',
    }),
    customerNote: null,
    adminNote: 'Mã vận đơn GHTK: S210984210',
    cancelReason: null,
    cancelledAt: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item-004',
        variantId: 'var-004',
        productId: 'prod-004',
        productNameSnapshot: 'Tai nghe gaming SteelSeries Arctis Nova 7',
        variantNameSnapshot: 'Wireless White Edition',
        skuSnapshot: 'SS-NOVA7-WHT',
        unitPriceSnapshot: 1250000,
        originalPriceSnapshot: 1590000,
        quantity: 1,
        totalPrice: 1250000,
        attributesSnapshot: '{"Color":"White"}',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      },
    ],
    statusHistory: [
      {
        id: 'hist-004-1',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        reason: 'Khởi tạo đơn hàng',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'hist-004-2',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Admin',
        reason: 'Duyệt đơn tự động',
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'hist-004-3',
        fromStatus: 'Confirmed',
        toStatus: 'Processing',
        changedByName: 'Kho',
        reason: 'Đóng gói kiện hàng',
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'hist-004-4',
        fromStatus: 'Processing',
        toStatus: 'Shipping',
        changedByName: 'Sales / Kho',
        reason: 'Bàn giao cho đơn vị vận chuyển GHTK',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'ord-seed-005',
    orderNumber: 'MK-20261013-8750',
    userId: 'user-005',
    customerEmail: 'bao.vu@fpt.com',
    customerPhone: '0944556677',
    status: 'Completed',
    paymentStatus: 'Paid',
    paymentMethod: 'COD',
    subtotalAmount: 34500000,
    discountAmount: 500000,
    shippingFee: 0,
    totalAmount: 34000000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Vũ Quốc Bảo',
      phoneNumber: '0944556677',
      provinceName: 'Thành phố Hà Nội',
      districtName: 'Quận Ba Đình',
      wardName: 'Phường Điện Biên',
      detailedAddress: '15 Hoàng Diệu',
      fullAddress: '15 Hoàng Diệu, Phường Điện Biên, Quận Ba Đình, Thành phố Hà Nội',
    }),
    customerNote: 'Giao giờ hành chính',
    adminNote: 'Khách thanh toán đủ tiền mặt, đã kiểm tra máy hoạt động tốt',
    cancelReason: null,
    cancelledAt: null,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item-005',
        variantId: 'var-005',
        productId: 'prod-005',
        productNameSnapshot: 'Laptop Gaming ASUS ROG Zephyrus G16 (2026)',
        variantNameSnapshot: 'Core Ultra 9 / RTX 4080 / 32GB RAM / 1TB SSD',
        skuSnapshot: 'ROG-G16-2026',
        unitPriceSnapshot: 34500000,
        originalPriceSnapshot: 37990000,
        quantity: 1,
        totalPrice: 34500000,
        attributesSnapshot: '{"RAM":"32GB","SSD":"1TB"}',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80',
      },
    ],
    statusHistory: [
      {
        id: 'hist-005-1',
        fromStatus: 'Shipping',
        toStatus: 'Completed',
        changedByName: 'GHTK Shipper / Hệ thống',
        reason: 'Khách hàng nhận hàng và thanh toán COD thành công',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'ord-seed-006',
    orderNumber: 'MK-20261012-8700',
    userId: 'user-006',
    customerEmail: 'vy.dang@gmail.com',
    customerPhone: '0977889900',
    status: 'Cancelled',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    subtotalAmount: 1450000,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 1450000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Đặng Thảo Vy',
      phoneNumber: '0977889900',
      provinceName: 'Thành phố Cần Thơ',
      districtName: 'Quận Ninh Kiều',
      wardName: 'Phường An Cư',
      detailedAddress: '78 Nguyễn Trãi',
      fullAddress: '78 Nguyễn Trãi, Phường An Cư, Quận Ninh Kiều, Thành phố Cần Thơ',
    }),
    customerNote: null,
    adminNote: 'Khách đổi ý muốn mua bản màu trắng',
    cancelReason: 'Khách hàng đổi ý muốn đổi sang sản phẩm khác',
    cancelledAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 74 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item-006',
        variantId: 'var-006',
        productId: 'prod-006',
        productNameSnapshot: 'Chuột không dây Razer Viper V2 Pro',
        variantNameSnapshot: 'Black Edition',
        skuSnapshot: 'RZ-VIPER2-BLK',
        unitPriceSnapshot: 1450000,
        originalPriceSnapshot: 1890000,
        quantity: 1,
        totalPrice: 1450000,
        attributesSnapshot: '{"Color":"Black"}',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80',
      },
    ],
    statusHistory: [
      {
        id: 'hist-006-1',
        fromStatus: 'Pending',
        toStatus: 'Cancelled',
        changedByName: 'Sales / Khách hàng',
        reason: 'Khách hàng đổi ý muốn đổi sang sản phẩm khác',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

function getStoredOrders(): OrderDto[] {
  try {
    const raw = localStorage.getItem(ADMIN_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(SEED_ADMIN_ORDERS));
      return SEED_ADMIN_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ADMIN_ORDERS;
  } catch {
    return SEED_ADMIN_ORDERS;
  }
}

function saveStoredOrders(orders: OrderDto[]) {
  try {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save admin orders to localStorage:', err);
  }
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
        // Sync to cache
        const local = getStoredOrders();
        const serverMap = new Map(res.data.data.items.map((o) => [o.orderNumber, o]));
        const merged = [
          ...res.data.data.items,
          ...local.filter((o) => !serverMap.has(o.orderNumber)),
        ];
        saveStoredOrders(merged);
        return res.data;
      }
      return res.data;
    } catch {
      // Fallback mock filtering
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
      const totalPages = Math.ceil(totalCount / pageSize);
      const items = orders.slice((page - 1) * pageSize, page * pageSize);

      return {
        isSuccess: true,
        data: {
          items,
          totalCount,
          pageNumber: page,
          pageSize,
          totalPages,
          hasPreviousPage: page > 1,
          hasNextPage: page < totalPages,
        },
      };
    }
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
