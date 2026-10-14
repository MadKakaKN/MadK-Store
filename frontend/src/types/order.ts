export type OrderStatus =
  | 'PendingPayment'
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipping'
  | 'Completed'
  | 'Cancelled'
  | 'ReturnRequested'
  | 'Returned';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type PaymentMethod = 'COD' | 'VNPay' | 'MoMo' | 'BankTransfer';

export interface OrderStatusHistoryDto {
  id: string;
  fromStatus?: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId?: string | null;
  changedByName: string;
  reason?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface OrderItemDto {
  id: string;
  variantId?: string | null;
  productId?: string | null;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  originalPriceSnapshot: number;
  quantity: number;
  totalPrice: number;
  attributesSnapshot?: string | null;
  specificationsSnapshot?: string | null;
  thumbnailUrlSnapshot?: string | null;
}

export interface ShippingAddressSnapshotDto {
  recipientName: string;
  phoneNumber: string;
  provinceCode?: string;
  provinceName: string;
  districtCode?: string;
  districtName: string;
  wardCode?: string;
  wardName: string;
  detailedAddress: string;
  isDefault?: boolean;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddressSnapshot: string; // JSON string representation
  customerNote?: string | null;
  adminNote?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  items: OrderItemDto[];
  statusHistory: OrderStatusHistoryDto[];
}

export interface ShippingAddressInputDto {
  recipientName: string;
  phoneNumber: string;
  recipientEmail?: string | null;
  provinceCode?: string | null;
  provinceName: string;
  districtCode?: string | null;
  districtName: string;
  wardCode?: string | null;
  wardName: string;
  detailedAddress: string;
}

export interface CheckoutItemInputDto {
  variantId: string;
  quantity: number;
}

export interface CheckoutCodRequestDto {
  addressId?: string | null;
  shippingAddress?: ShippingAddressInputDto | null;
  items?: CheckoutItemInputDto[] | null;
  customerNote?: string | null;
  idempotencyKey?: string | null;
}

export interface CancelOrderRequestDto {
  reason: string;
}

export interface UpdateOrderStatusRequestDto {
  newStatus: OrderStatus;
  reason?: string;
  note?: string;
}

export interface OrderStatusMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: string;
  description: string;
  cancellableByCustomer: boolean;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusMeta> = {
  PendingPayment: {
    label: 'Chờ thanh toán',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    icon: '💳',
    description: 'Chờ khách hàng hoàn tất thanh toán trực tuyến',
    cancellableByCustomer: true,
  },
  Pending: {
    label: 'Chờ xác nhận',
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-800',
    badgeBorder: 'border-yellow-200',
    icon: '⏳',
    description: 'Đơn hàng mới tạo, đang chờ nhân viên liên hệ xác nhận',
    cancellableByCustomer: true,
  },
  Confirmed: {
    label: 'Đã xác nhận',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    icon: '✓',
    description: 'Đơn hàng đã được xác nhận thông tin, chuẩn bị xuất kho',
    cancellableByCustomer: true,
  },
  Processing: {
    label: 'Đang chuẩn bị hàng',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    icon: '📦',
    description: 'Kho đang in phiếu xuất và đóng gói sản phẩm',
    cancellableByCustomer: false,
  },
  Shipping: {
    label: 'Đang giao hàng',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    icon: '🚚',
    description: 'Đã bàn giao cho đơn vị vận chuyển (GHN/GHTK)',
    cancellableByCustomer: false,
  },
  Completed: {
    label: 'Giao thành công',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    icon: '🎉',
    description: 'Khách hàng đã nhận kiện hàng và thanh toán COD',
    cancellableByCustomer: false,
  },
  Cancelled: {
    label: 'Đã hủy',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    icon: '✕',
    description: 'Đơn hàng đã bị hủy và tồn kho đã được giải phóng',
    cancellableByCustomer: false,
  },
  ReturnRequested: {
    label: 'Yêu cầu đổi trả',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    icon: '🔄',
    description: 'Khách hàng gửi yêu cầu bảo hành/đổi trả',
    cancellableByCustomer: false,
  },
  Returned: {
    label: 'Đã trả hàng/Hoàn tiền',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    icon: '↩️',
    description: 'Kho đã nhận lại hàng và hoàn tiền cho khách',
    cancellableByCustomer: false,
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  Pending: { label: 'Chưa thanh toán (COD)', color: 'text-amber-600 bg-amber-50' },
  Paid: { label: 'Đã thanh toán', color: 'text-emerald-600 bg-emerald-50' },
  Failed: { label: 'Thanh toán thất bại', color: 'text-rose-600 bg-rose-50' },
  Refunded: { label: 'Đã hoàn tiền', color: 'text-slate-600 bg-slate-100' },
};
