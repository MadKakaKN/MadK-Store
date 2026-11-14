import { OrderDto, OrderStatus } from '../../../types/order';
import { orderApi, getStoredOrders, normalizeOrder } from '../../../api/orderApi';

export interface TrackingTimelineStep {
  title: string;
  time: string;
  description: string;
  completed: boolean;
  current?: boolean;
}

export interface OrderTrackingItemDisplay {
  name: string;
  specs: string;
  serialNumber: string;
  warrantyPeriod: string;
  quantity: number;
  price: number;
  thumbnailUrl: string;
}

export interface OrderTrackingDisplay {
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  statusText: string;
  carrier: string;
  trackingCode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  items: OrderTrackingItemDisplay[];
  totalAmount: number;
  paymentMethod: string;
  timeline: TrackingTimelineStep[];
}

export interface ServiceCenterDto {
  city: string;
  address: string;
  hotline: string;
}

export interface WarrantyResultDto {
  serialNumber: string;
  productName: string;
  purchaseDate: string;
  warrantyMonths: number;
  expiryDate: string;
  remainingDays: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  statusText: string;
  customerName: string;
  customerPhone: string;
  distributor: string;
  serviceCenters: ServiceCenterDto[];
}

export const MADK_SERVICE_CENTERS: ServiceCenterDto[] = [
  {
    city: 'TP. Hồ Chí Minh',
    address: 'Số 285 Cách Mạng Tháng 8, Phường 12, Quận 10',
    hotline: '1900 8888 (Nhánh 1)',
  },
  {
    city: 'Hà Nội',
    address: 'Số 110 Thái Hà, Phường Trung Liệt, Đống Đa',
    hotline: '1900 8888 (Nhánh 2)',
  },
  {
    city: 'Đà Nẵng',
    address: 'Số 72 Hàm Nghi, Phường Thạc Gián, Thanh Khê',
    hotline: '1900 8888 (Nhánh 3)',
  },
];

/**
 * Seed data representing verified orders for demo/testing and direct lookup
 */
export const SEED_TRACKING_ORDERS: OrderDto[] = [
  normalizeOrder({
    id: 'ord-seed-bf7a52',
    orderNumber: 'MK-20261114-BF7A52',
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'COD',
    subtotalAmount: 56990000,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 56990000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Khách hàng MadK',
      phoneNumber: '0912345678',
      detailedAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ',
      wardName: 'Phường 22',
      districtName: 'Quận Bình Thạnh',
      provinceName: 'TP. Hồ Chí Minh',
    }),
    carrierName: 'Giao Hàng Nhanh (GHN Express)',
    trackingCode: 'GHN882194VN',
    createdAt: '2026-11-14T14:30:00Z',
    items: [
      {
        id: 'item-thinkpad-x1c12-01',
        productId: 'laptop-lenovo-thinkpad-x1-carbon-gen-12',
        productName: 'Lenovo ThinkPad X1 Carbon Gen 12',
        productNameSnapshot: 'Lenovo ThinkPad X1 Carbon Gen 12',
        variantName: 'ThinkPad X1 Carbon Gen 12 i7/32GB/1TB Đen',
        variantNameSnapshot: 'ThinkPad X1 Carbon Gen 12 i7/32GB/1TB Đen',
        sku: 'LAPTOP-LENOVO-THINKPAD-X1-CARBON-GEN-12-STD',
        skuSnapshot: 'LAPTOP-LENOVO-THINKPAD-X1-CARBON-GEN-12-STD',
        unitPrice: 56990000,
        unitPriceSnapshot: 56990000,
        originalPrice: 59990000,
        originalPriceSnapshot: 59990000,
        quantity: 1,
        totalPrice: 56990000,
        attributesSnapshot: '{}',
        thumbnailUrl: '/images/products/laptop-lenovo-thinkpad-x1-carbon-gen-12.png',
        thumbnailUrlSnapshot: '/images/products/laptop-lenovo-thinkpad-x1-carbon-gen-12.png',
      },
    ],
    statusHistory: [
      {
        id: 'hist-bf7a52-1',
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        createdAt: '2026-11-14T14:30:00Z',
        note: 'Đơn hàng mới được tạo thành công trên hệ thống',
      },
    ],
  }),
  normalizeOrder({
    id: 'ord-seed-89412',
    orderNumber: 'MADK-2025-89412',
    status: 'Shipping',
    paymentStatus: 'Paid',
    paymentMethod: 'VNPay',
    subtotalAmount: 90880000,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 90880000,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Nguyễn Hữu Nam',
      phoneNumber: '0912345678',
      detailedAddress: 'Tòa nhà Bitexco, 2 Hải Triều',
      wardName: 'Phường Bến Nghé',
      districtName: 'Quận 1',
      provinceName: 'TP. Hồ Chí Minh',
    }),
    carrierName: 'Giao Hàng Nhanh (GHN Express)',
    trackingCode: 'GHN889234VN',
    createdAt: '2025-10-24T14:15:00Z',
    items: [
      {
        id: 'item-rog-01',
        productName: 'ASUS ROG Strix SCAR 16 (2024)',
        productNameSnapshot: 'ASUS ROG Strix SCAR 16 (2024)',
        variantName: 'i9-14900HX • RTX 4090 • 32GB • 1TB • Đen Titanium',
        variantNameSnapshot: 'i9-14900HX • RTX 4090 • 32GB • 1TB • Đen Titanium',
        sku: 'SN-ASUS-99281-VN',
        skuSnapshot: 'SN-ASUS-99281-VN',
        unitPrice: 89990000,
        unitPriceSnapshot: 89990000,
        originalPrice: 89990000,
        originalPriceSnapshot: 89990000,
        quantity: 1,
        totalPrice: 89990000,
        attributesSnapshot: '{}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300',
      },
      {
        id: 'item-logi-01',
        productName: 'Chuột Không Dây Logitech G304 Lightspeed (White)',
        productNameSnapshot: 'Chuột Không Dây Logitech G304 Lightspeed (White)',
        variantName: 'Cảm biến HERO 12K DPI • Trắng',
        variantNameSnapshot: 'Cảm biến HERO 12K DPI • Trắng',
        sku: 'SN-LOGI-88210',
        skuSnapshot: 'SN-LOGI-88210',
        unitPrice: 890000,
        unitPriceSnapshot: 890000,
        originalPrice: 890000,
        originalPriceSnapshot: 890000,
        quantity: 1,
        totalPrice: 890000,
        attributesSnapshot: '{}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300',
        thumbnailUrlSnapshot: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300',
      },
    ],
    statusHistory: [
      {
        id: 'hist-89412-1',
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        createdAt: '2025-10-24T14:15:00Z',
        note: 'Đặt hàng thành công',
      },
      {
        id: 'hist-89412-2',
        toStatus: 'Confirmed',
        changedByName: 'Hệ thống thanh toán',
        createdAt: '2025-10-24T14:20:00Z',
        note: 'Xác nhận thanh toán qua VNPay-QR thành công',
      },
      {
        id: 'hist-89412-3',
        toStatus: 'Shipping',
        changedByName: 'Kho vận MadK Q1',
        createdAt: '2025-10-24T15:10:00Z',
        note: 'Bàn giao cho GHN Express đang trên đường giao',
      },
    ],
  }),
];

/**
 * Clean and standardize order / serial / IMEI codes for search
 */
export function sanitizeSearchCode(code: string): string {
  if (!code) return '';
  return code.trim().replace(/^#/, '').toUpperCase();
}

/**
 * Format date in Vietnamese format: DD/MM/YYYY
 */
export function formatDisplayDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format datetime in Vietnamese format: DD/MM/YYYY (HH:mm)
 */
export function formatDisplayDateTime(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} (${hours}:${minutes})`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Determine standard warranty duration in months based on device category & brand
 */
export function getWarrantyMonthsByProduct(productName: string): number {
  const lower = productName.toLowerCase();
  // ThinkPad, Workstation, Monitors: 36 months
  if (lower.includes('thinkpad') || lower.includes('tuf gaming') || lower.includes('màn hình')) {
    return 36;
  }
  // Gaming laptops & High-end: 24 months
  if (lower.includes('rog') || lower.includes('legion') || lower.includes('laptop')) {
    return 24;
  }
  // Phones & Accessories: 12 - 24 months
  if (lower.includes('chuột') || lower.includes('bàn phím') || lower.includes('tai nghe')) {
    return 24;
  }
  if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('điện thoại')) {
    return 12;
  }
  return 24;
}

/**
 * Determine authorized distributor name by product brand
 */
export function getDistributorByProduct(productName: string): string {
  const lower = productName.toLowerCase();
  if (lower.includes('lenovo') || lower.includes('thinkpad') || lower.includes('legion')) {
    return 'MadK Store & Lenovo Vietnam Authorized Partner';
  }
  if (lower.includes('asus') || lower.includes('rog') || lower.includes('tuf')) {
    return 'MadK Store & ASUS Authorized Service Partner';
  }
  if (lower.includes('apple') || lower.includes('iphone') || lower.includes('macbook') || lower.includes('ipad')) {
    return 'MadK Store & Apple Authorized Service Provider (AASP)';
  }
  if (lower.includes('samsung') || lower.includes('galaxy')) {
    return 'MadK Store & Samsung Electronics Authorized Service';
  }
  if (lower.includes('logitech')) {
    return 'MadK Store & Logitech Vietnam Authorized Partner';
  }
  if (lower.includes('keychron')) {
    return 'MadK Store & Keychron Authorized Partner';
  }
  return 'MadK Store & Trung tâm bảo hành ủy quyền chính hãng';
}

/**
 * Calculate expiry date and remaining warranty days
 */
export function calculateWarrantyPeriod(
  purchaseDateStr: string,
  warrantyMonths: number
): { expiryDate: string; remainingDays: number; isExpired: boolean } {
  try {
    const purchaseDate = new Date(purchaseDateStr);
    if (isNaN(purchaseDate.getTime())) {
      return { expiryDate: '14/11/2029', remainingDays: 1095, isExpired: false };
    }
    const expiry = new Date(purchaseDate);
    expiry.setMonth(expiry.getMonth() + warrantyMonths);

    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = remainingDays <= 0;

    return {
      expiryDate: formatDisplayDate(expiry),
      remainingDays,
      isExpired,
    };
  } catch {
    return { expiryDate: '14/11/2029', remainingDays: 1095, isExpired: false };
  }
}

/**
 * Query real orders from localStorage cache, server API, or fallback seed data
 */
export async function findOrderForTracking(
  rawQuery: string,
  rawPhone?: string
): Promise<OrderDto | null> {
  const cleanCode = sanitizeSearchCode(rawQuery);
  const cleanPhone = rawPhone ? rawPhone.trim().replace(/\D/g, '') : '';

  if (!cleanCode && !cleanPhone) return null;

  // 1. Check local storage cache (orders placed by customer in browser)
  const cachedOrders = getStoredOrders();
  if (cachedOrders && cachedOrders.length > 0) {
    const match = cachedOrders.find((o) => {
      const orderMatch = cleanCode && sanitizeSearchCode(o.orderNumber) === cleanCode;
      const serialMatch = cleanCode && o.items?.some((item) => {
        const skuMatch = item.sku && sanitizeSearchCode(item.sku) === cleanCode;
        const nameMatch = (item.productName || item.productNameSnapshot || '').toUpperCase().includes(cleanCode);
        return skuMatch || nameMatch;
      });

      let phoneMatch = false;
      if (cleanPhone) {
        if (o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(cleanPhone)) {
          phoneMatch = true;
        }
        if (o.shippingAddressSnapshot) {
          try {
            const snap = JSON.parse(o.shippingAddressSnapshot);
            if (snap.phoneNumber && snap.phoneNumber.replace(/\D/g, '').includes(cleanPhone)) {
              phoneMatch = true;
            }
          } catch {
            // ignore
          }
        }
      }

      if (cleanCode && cleanPhone) {
        return (orderMatch || serialMatch) && phoneMatch;
      }
      return orderMatch || serialMatch || (cleanPhone && phoneMatch);
    });

    if (match) return match;
  }

  // 2. Call backend order API
  if (cleanCode) {
    try {
      const res = await orderApi.getOrderByNumber(cleanCode);
      if (res && res.isSuccess && res.data) {
        return res.data;
      }
    } catch {
      // Continue to seed fallback
    }
  }

  // 3. Check SEED orders (supports #MK-20261114-BF7A52 and MADK-2025-89412)
  const seedMatch = SEED_TRACKING_ORDERS.find((o) => {
    const orderMatch = cleanCode && sanitizeSearchCode(o.orderNumber) === cleanCode;
    const serialMatch = cleanCode && o.items?.some((item) => {
      const skuMatch = item.sku && sanitizeSearchCode(item.sku).includes(cleanCode);
      return skuMatch;
    });

    let phoneMatch = false;
    if (cleanPhone && o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(cleanPhone)) {
      phoneMatch = true;
    }

    if (cleanCode && cleanPhone) {
      return (orderMatch || serialMatch) && phoneMatch;
    }
    return orderMatch || serialMatch || (cleanPhone && phoneMatch);
  });

  return seedMatch || null;
}

/**
 * Format OrderDto into displayable structure for tracking page
 */
export function buildOrderTrackingDisplay(order: OrderDto): OrderTrackingDisplay {
  const statusTextMap: Record<OrderStatus, string> = {
    Pending: 'Chờ xác nhận đơn hàng',
    Confirmed: 'Đã xác nhận đơn hàng',
    Processing: 'Đang chuẩn bị & niêm phong hàng',
    Shipping: 'Đang giao hàng (GHN Hỏa tốc)',
    Completed: 'Giao hàng thành công',
    Cancelled: 'Đã hủy đơn hàng',
    PendingPayment: 'Chờ thanh toán',
    ReturnRequested: 'Yêu cầu đổi trả hàng',
    Returned: 'Đã hoàn trả',
  };

  const paymentMethodMap: Record<string, string> = {
    COD: 'Thanh toán khi nhận hàng (COD)',
    VNPay: 'Đã thanh toán (VNPay-QR)',
    MoMo: 'Đã thanh toán (Ví MoMo)',
    BankTransfer: 'Chuyển khoản ngân hàng',
  };

  let recipientName = 'Khách hàng';
  let recipientPhone = order.customerPhone || '';
  let recipientAddress = 'Giao hàng tận nơi toàn quốc';

  if (order.shippingAddressSnapshot) {
    try {
      const snap = JSON.parse(order.shippingAddressSnapshot);
      if (snap.recipientName) recipientName = snap.recipientName;
      if (snap.phoneNumber) recipientPhone = snap.phoneNumber;
      const parts = [snap.detailedAddress, snap.wardName, snap.districtName, snap.provinceName].filter(Boolean);
      if (parts.length > 0) recipientAddress = parts.join(', ');
    } catch {
      // ignore
    }
  }

  const items: OrderTrackingItemDisplay[] = (order.items || []).map((item) => {
    const name = item.productName || item.productNameSnapshot || 'Sản phẩm công nghệ chính hãng';
    const specs = item.variantName || item.variantNameSnapshot || 'Phiên bản tiêu chuẩn';
    const cleanNum = order.orderNumber.replace(/[^A-Za-z0-9]/g, '').slice(-6);
    const skuCode = (item.sku || item.skuSnapshot || 'MADK').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase();
    const serialNumber = `SN-${skuCode}-${cleanNum}`;
    const warrantyMonths = getWarrantyMonthsByProduct(name);
    const { expiryDate } = calculateWarrantyPeriod(order.createdAt, warrantyMonths);

    return {
      name,
      specs,
      serialNumber,
      warrantyPeriod: `${formatDisplayDate(order.createdAt)} - ${expiryDate}`,
      quantity: item.quantity,
      price: item.unitPriceSnapshot || item.unitPrice || 0,
      thumbnailUrl: item.thumbnailUrlSnapshot || item.thumbnailUrl || '/images/products/laptop-lenovo-thinkpad-x1-carbon-gen-12.png',
    };
  });

  const timeline = buildOrderTimeline(order);

  return {
    orderNumber: order.orderNumber,
    orderDate: formatDisplayDateTime(order.createdAt),
    status: order.status,
    statusText: statusTextMap[order.status] || 'Đang xử lý',
    carrier: order.carrierName || 'Giao Hàng Nhanh (GHN Express)',
    trackingCode: order.trackingCode || `GHN${order.orderNumber.replace(/[^0-9A-Z]/gi, '').slice(-8)}VN`,
    recipientName,
    recipientPhone,
    recipientAddress,
    items,
    totalAmount: order.totalAmount,
    paymentMethod: paymentMethodMap[order.paymentMethod] || 'Thanh toán trực tuyến',
    timeline,
  };
}

/**
 * Build dynamic 5-step timeline matching actual order status
 */
function buildOrderTimeline(order: OrderDto): TrackingTimelineStep[] {
  const orderTime = formatDisplayDateTime(order.createdAt);
  const isPending = order.status === 'Pending';
  const isConfirmed = order.status === 'Confirmed';
  const isProcessing = order.status === 'Processing';
  const isShipping = order.status === 'Shipping';
  const isCompleted = order.status === 'Completed';

  return [
    {
      title: 'Đặt hàng thành công',
      time: orderTime,
      description: `Đơn hàng #${order.orderNumber} đã ghi nhận thành công trên hệ thống MadK Store.`,
      completed: true,
      current: isPending,
    },
    {
      title: 'Đã xác nhận đơn hàng',
      time: isPending ? 'Chờ xác nhận' : `${orderTime.split(' ')[0]} (Đã duyệt)`,
      description: isPending
        ? 'Bộ phận CSKH MadK Store đang liên hệ xác thực thông tin đơn hàng.'
        : 'Đơn hàng đã được xác nhận thanh toán/COD và tạo phiếu xuất kho.',
      completed: !isPending,
      current: isConfirmed,
    },
    {
      title: 'Đang xuất kho & Niêm phong',
      time: isShipping || isCompleted ? `${orderTime.split(' ')[0]} (Đã niêm phong)` : 'Dự kiến sau khi duyệt',
      description: 'Đóng gói bọc khí chống sốc 3 lớp, dán tem vỡ bảo hành e-Warranty chính hãng.',
      completed: isShipping || isCompleted,
      current: isProcessing,
    },
    {
      title: 'Đang giao hàng hỏa tốc',
      time: isCompleted ? 'Đã giao' : isShipping ? 'Đang trên đường giao' : 'Dự kiến 24-48 giờ',
      description: isShipping
        ? `Bưu tá GHN Express (${order.trackingCode || 'Mã vận đơn điện tử'}) đang chuyển phát nhanh đến khách hàng.`
        : 'Bàn giao cho bưu cục GHN vận chuyển hỏa tốc toàn quốc.',
      completed: isCompleted,
      current: isShipping,
    },
    {
      title: 'Đã giao hàng & Đồng kiểm',
      time: isCompleted ? 'Giao thành công' : 'Đồng kiểm khi nhận',
      description: 'Khách hàng kiểm tra ngoại quan máy, phụ kiện nguyên seal và ký nhận bưu phẩm.',
      completed: isCompleted,
      current: false,
    },
  ];
}

/**
 * Standalone warranty lookup definitions for demo chips
 */
const STANDALONE_WARRANTY_DEVICES: Record<string, Partial<WarrantyResultDto>> = {
  'MK-20261102-FA4449': {
    productName: 'Màn hình ASUS TUF Gaming VG249Q3A 24 inch Fast IPS 180Hz',
    purchaseDate: '15/05/2025',
    warrantyMonths: 36,
    customerName: 'Nguyễn Hoàng Khang',
    customerPhone: '0912.345.678',
    distributor: 'MadK Store & ASUS Authorized Service Partner',
  },
  'FA4449': {
    productName: 'Màn hình ASUS TUF Gaming VG249Q3A 24 inch Fast IPS 180Hz',
    purchaseDate: '15/05/2025',
    warrantyMonths: 36,
    customerName: 'Nguyễn Hoàng Khang',
    customerPhone: '0912.345.678',
    distributor: 'MadK Store & ASUS Authorized Service Partner',
  },
  'SN-ASUS-99281-VN': {
    productName: 'ASUS ROG Strix SCAR 16 (2024)',
    purchaseDate: '24/10/2024',
    warrantyMonths: 24,
    customerName: 'Nguyễn Hữu Nam',
    customerPhone: '0912.345.678',
    distributor: 'MadK Store & ASUS ROG Vietnam Authorized Partner',
  },
  'SN-LOGI-88210': {
    productName: 'Chuột Không Dây Logitech G304 Lightspeed (White)',
    purchaseDate: '24/10/2024',
    warrantyMonths: 24,
    customerName: 'Nguyễn Hữu Nam',
    customerPhone: '0912.345.678',
    distributor: 'MadK Store & Logitech Vietnam Authorized Partner',
  },
};

/**
 * Look up warranty info by Order Number, Serial, or IMEI
 */
export async function findWarrantyForTracking(
  rawQuery: string,
  rawPhone?: string
): Promise<WarrantyResultDto | null> {
  const cleanCode = sanitizeSearchCode(rawQuery);
  const cleanPhone = rawPhone ? rawPhone.trim().replace(/\D/g, '') : '';

  if (!cleanCode && !cleanPhone) return null;

  // 1. Check if the query matches an Order Number or Serial within orders
  const matchedOrder = await findOrderForTracking(rawQuery, rawPhone);
  if (matchedOrder && matchedOrder.items && matchedOrder.items.length > 0) {
    // Pick the item matching the query or default to primary item
    const item =
      matchedOrder.items.find((i) => {
        const skuMatch = i.sku && sanitizeSearchCode(i.sku).includes(cleanCode);
        const nameMatch = (i.productName || i.productNameSnapshot || '').toUpperCase().includes(cleanCode);
        return skuMatch || nameMatch;
      }) || matchedOrder.items[0];

    const productName = item.productName || item.productNameSnapshot || 'Sản phẩm công nghệ chính hãng';
    const warrantyMonths = getWarrantyMonthsByProduct(productName);
    const purchaseDate = formatDisplayDate(matchedOrder.createdAt);
    const { expiryDate, remainingDays, isExpired } = calculateWarrantyPeriod(matchedOrder.createdAt, warrantyMonths);

    let customerName = 'Khách hàng';
    let customerPhone = matchedOrder.customerPhone || rawPhone || '0912.345.678';
    if (matchedOrder.shippingAddressSnapshot) {
      try {
        const snap = JSON.parse(matchedOrder.shippingAddressSnapshot);
        if (snap.recipientName) customerName = snap.recipientName;
        if (snap.phoneNumber) customerPhone = snap.phoneNumber;
      } catch {
        // ignore
      }
    }

    const serialNumber = rawQuery.trim().startsWith('#')
      ? rawQuery.trim()
      : `#${matchedOrder.orderNumber}`;

    return {
      serialNumber,
      productName,
      purchaseDate,
      warrantyMonths,
      expiryDate,
      remainingDays,
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
      statusText: isExpired ? 'Hết hạn bảo hành' : 'Còn hạn bảo hành chính hãng',
      customerName,
      customerPhone,
      distributor: getDistributorByProduct(productName),
      serviceCenters: MADK_SERVICE_CENTERS,
    };
  }

  // 2. Check standalone known serials (e.g. sample chips)
  for (const [key, dev] of Object.entries(STANDALONE_WARRANTY_DEVICES)) {
    if (cleanCode.includes(key.toUpperCase())) {
      const productName = dev.productName || 'Thiết bị công nghệ chính hãng';
      const purchaseDate = dev.purchaseDate || '15/05/2025';
      const warrantyMonths = dev.warrantyMonths || 36;
      const { expiryDate, remainingDays, isExpired } = calculateWarrantyPeriod(purchaseDate, warrantyMonths);

      const serialFormatted = rawQuery.trim().startsWith('#')
        ? rawQuery.trim()
        : `#${key}`;

      return {
        serialNumber: serialFormatted,
        productName,
        purchaseDate,
        warrantyMonths,
        expiryDate,
        remainingDays,
        status: isExpired ? 'EXPIRED' : 'ACTIVE',
        statusText: isExpired ? 'Hết hạn bảo hành' : 'Còn hạn bảo hành chính hãng',
        customerName: dev.customerName || 'Khách hàng MadK',
        customerPhone: dev.customerPhone || '0912.345.678',
        distributor: dev.distributor || getDistributorByProduct(productName),
        serviceCenters: MADK_SERVICE_CENTERS,
      };
    }
  }

  // Not found
  return null;
}
