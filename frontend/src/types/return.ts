export type ReturnRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

export type RefundStatus =
  | 'Pending'
  | 'Refunded'
  | 'Failed'
  | 'NotApplicable';

export interface ReturnRequestItemDto {
  id: string;
  orderItemId?: string | null;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason?: string | null;
  condition?: string | null;
}

export interface ReturnRequestDto {
  id: string;
  orderId: string;
  orderNumber: string;
  userId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: ReturnRequestStatus;
  reason: string;
  customerNote?: string | null;
  refundAmount: number;
  refundStatus: RefundStatus;
  refundTransactionNo?: string | null;
  refundedAt?: string | null;
  salesNote?: string | null;
  rejectionReason?: string | null;
  processedByUserId?: string | null;
  processedByName?: string | null;
  processedAt?: string | null;
  isRestocked: boolean;
  restockedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  items: ReturnRequestItemDto[];
}

export interface CreateReturnItemDto {
  variantId: string;
  quantity: number;
  reason?: string;
  condition?: string;
}

export interface CreateReturnRequestDto {
  reason: string;
  customerNote?: string;
  items: CreateReturnItemDto[];
}

export interface ApproveReturnRequestDto {
  salesNote?: string;
}

export interface RejectReturnRequestDto {
  rejectionReason: string;
}

/** Khớp với backend `ProcessReturnRefundDto(RefundAmount, RestockInventory, Note, IdempotencyKey)` */
export interface ProcessReturnRefundDto {
  refundAmount?: number;
  restockInventory: boolean;
  note?: string;
  idempotencyKey?: string;
}

export interface ReturnFilterDto {
  status?: ReturnRequestStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ──────────────────────────────────────────────────────────────
// Display configuration
// ──────────────────────────────────────────────────────────────

export const RETURN_STATUS_CONFIG: Record<
  ReturnRequestStatus,
  { label: string; icon: string; color: string; description: string }
> = {
  Pending: {
    label: 'Chờ duyệt',
    icon: '⏳',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    description: 'Yêu cầu đã được gửi, đang chờ nhân viên Sales xem xét.',
  },
  Approved: {
    label: 'Đã duyệt',
    icon: '✓',
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    description: 'Yêu cầu đã được chấp nhận. Vui lòng gửi hàng về kho MadK Store.',
  },
  Rejected: {
    label: 'Bị từ chối',
    icon: '✕',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    description: 'Yêu cầu không đủ điều kiện đổi trả.',
  },
  Completed: {
    label: 'Đã hoàn tiền',
    icon: '💸',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    description: 'Đã nhận lại hàng, nhập kho và hoàn tiền thành công.',
  },
  Cancelled: {
    label: 'Đã hủy',
    icon: '⊘',
    color: 'text-slate-600 bg-slate-100 border-slate-200',
    description: 'Yêu cầu đổi trả đã bị hủy.',
  },
};

export const REFUND_STATUS_CONFIG: Record<RefundStatus, { label: string; color: string }> = {
  Pending: { label: 'Chờ hoàn tiền', color: 'text-amber-700 bg-amber-50' },
  Refunded: { label: 'Đã hoàn tiền', color: 'text-emerald-700 bg-emerald-50' },
  Failed: { label: 'Hoàn tiền lỗi', color: 'text-rose-700 bg-rose-50' },
  NotApplicable: { label: 'Không áp dụng', color: 'text-slate-600 bg-slate-100' },
};

/** Lý do đổi trả gợi ý cho khách hàng */
export const RETURN_REASON_PRESETS: { value: string; icon: string }[] = [
  { value: 'Sản phẩm lỗi kỹ thuật (switch chết, LED hỏng, double-click...)', icon: '⚠️' },
  { value: 'Giao sai mẫu / sai phân loại (switch, layout, màu sắc)', icon: '🔀' },
  { value: 'Sản phẩm bị móp, trầy xước khi vận chuyển', icon: '📦' },
  { value: 'Thiếu phụ kiện (keycap puller, cáp, dongle...)', icon: '🧩' },
  { value: 'Sản phẩm không đúng mô tả trên website', icon: '📝' },
];

/** Tình trạng hàng hóa khi trả về */
export const RETURN_CONDITION_OPTIONS = [
  'Còn nguyên seal',
  'Đã mở hộp',
  'Đã sử dụng',
  'Lỗi kỹ thuật',
] as const;

// ──────────────────────────────────────────────────────────────
// Normalizers — backend serializes C# enums as numbers
// ──────────────────────────────────────────────────────────────

const RETURN_STATUS_BY_NUMBER: Record<number, ReturnRequestStatus> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
  4: 'Completed',
  5: 'Cancelled',
};

const REFUND_STATUS_BY_NUMBER: Record<number, RefundStatus> = {
  1: 'Pending',
  2: 'Refunded',
  3: 'Failed',
  4: 'NotApplicable',
};

export function toReturnStatus(value: unknown): ReturnRequestStatus {
  if (typeof value === 'number') return RETURN_STATUS_BY_NUMBER[value] ?? 'Pending';
  if (typeof value === 'string' && value in RETURN_STATUS_CONFIG) return value as ReturnRequestStatus;
  return 'Pending';
}

export function toRefundStatus(value: unknown): RefundStatus {
  if (typeof value === 'number') return REFUND_STATUS_BY_NUMBER[value] ?? 'Pending';
  if (typeof value === 'string' && value in REFUND_STATUS_CONFIG) return value as RefundStatus;
  return 'Pending';
}

export function normalizeReturnRequest(raw: ReturnRequestDto): ReturnRequestDto {
  return {
    ...raw,
    status: toReturnStatus(raw.status as unknown),
    refundStatus: toRefundStatus(raw.refundStatus as unknown),
    items: raw.items ?? [],
  };
}

/** Trạng thái đang hoạt động — khách không thể tạo yêu cầu mới khi còn yêu cầu này */
export function isActiveReturn(r: ReturnRequestDto): boolean {
  return r.status === 'Pending' || r.status === 'Approved';
}
