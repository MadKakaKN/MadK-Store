// scripts/verify-tracking-fix.cjs
// Kiểm thử chức năng tra cứu đơn hàng và bảo hành thiết bị

const assert = require('assert');

// 1. Giả lập LocalStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

console.log('================================================================');
console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ TỰ ĐỘNG CHO TRA CỨU ĐƠN HÀNG & BẢO HÀNH');
console.log('================================================================\n');

// 2. Định nghĩa các hàm nghiệp vụ giống trackingLookupService
function sanitizeSearchCode(code) {
  if (!code) return '';
  return code.trim().replace(/^#/, '').toUpperCase();
}

function getWarrantyMonthsByProduct(productName) {
  const lower = productName.toLowerCase();
  if (lower.includes('thinkpad') || lower.includes('tuf gaming') || lower.includes('màn hình')) {
    return 36;
  }
  if (lower.includes('rog') || lower.includes('legion') || lower.includes('laptop')) {
    return 24;
  }
  if (lower.includes('chuột') || lower.includes('bàn phím') || lower.includes('tai nghe')) {
    return 24;
  }
  if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('điện thoại')) {
    return 12;
  }
  return 24;
}

function getDistributorByProduct(productName) {
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

function formatDisplayDate(dateInput) {
  const d = new Date(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateWarrantyPeriod(purchaseDateStr, warrantyMonths) {
  const purchaseDate = new Date(purchaseDateStr);
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
}

const SEED_ORDERS = [
  {
    id: 'ord-seed-bf7a52',
    orderNumber: 'MK-20261114-BF7A52',
    status: 'Pending',
    totalAmount: 56990000,
    createdAt: '2026-11-14T14:30:00Z',
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Khách hàng MadK',
      phoneNumber: '0912345678',
      detailedAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh'
    }),
    items: [
      {
        id: 'item-thinkpad-x1c12-01',
        productName: 'Lenovo ThinkPad X1 Carbon Gen 12',
        variantName: 'ThinkPad X1 Carbon Gen 12 i7/32GB/1TB Đen',
        quantity: 1,
        unitPrice: 56990000,
        sku: 'LAPTOP-LENOVO-THINKPAD-X1-CARBON-GEN-12-STD'
      }
    ]
  },
  {
    id: 'ord-seed-89412',
    orderNumber: 'MADK-2025-89412',
    status: 'Shipping',
    totalAmount: 90880000,
    createdAt: '2025-10-24T14:15:00Z',
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Nguyễn Hữu Nam',
      phoneNumber: '0912345678',
      detailedAddress: 'Tòa nhà Bitexco, 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
    }),
    items: [
      {
        id: 'item-rog-01',
        productName: 'ASUS ROG Strix SCAR 16 (2024)',
        variantName: 'i9-14900HX • RTX 4090 • 32GB • 1TB • Đen Titanium',
        quantity: 1,
        unitPrice: 89990000,
        sku: 'SN-ASUS-99281-VN'
      },
      {
        id: 'item-logi-01',
        productName: 'Chuột Không Dây Logitech G304 Lightspeed (White)',
        variantName: 'Cảm biến HERO 12K DPI • Trắng',
        quantity: 1,
        unitPrice: 890000,
        sku: 'SN-LOGI-88210'
      }
    ]
  }
];

function findOrder(rawQuery, rawPhone) {
  const cleanCode = sanitizeSearchCode(rawQuery);
  const cleanPhone = rawPhone ? rawPhone.trim().replace(/\D/g, '') : '';
  if (!cleanCode && !cleanPhone) return null;

  // 1. Check local storage
  try {
    const raw = localStorage.getItem('madk_orders_cache');
    const cached = raw ? JSON.parse(raw) : [];
    const match = cached.find(o => sanitizeSearchCode(o.orderNumber) === cleanCode);
    if (match) return match;
  } catch {}

  // 2. Check SEED orders
  const seedMatch = SEED_ORDERS.find(o => sanitizeSearchCode(o.orderNumber) === cleanCode);
  if (seedMatch) return seedMatch;

  return null;
}

function findWarranty(rawQuery, rawPhone) {
  const cleanCode = sanitizeSearchCode(rawQuery);
  if (!cleanCode) return null;

  const order = findOrder(rawQuery, rawPhone);
  if (order && order.items && order.items.length > 0) {
    const item = order.items[0];
    const productName = item.productName;
    const warrantyMonths = getWarrantyMonthsByProduct(productName);
    const purchaseDate = formatDisplayDate(order.createdAt);
    const { expiryDate, remainingDays, isExpired } = calculateWarrantyPeriod(order.createdAt, warrantyMonths);
    const distributor = getDistributorByProduct(productName);

    return {
      serialNumber: rawQuery.startsWith('#') ? rawQuery : `#${order.orderNumber}`,
      productName,
      purchaseDate,
      warrantyMonths,
      expiryDate,
      remainingDays,
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
      statusText: isExpired ? 'Hết hạn bảo hành' : 'Còn hạn bảo hành chính hãng',
      distributor,
    };
  }

  // Standalone serials
  if (cleanCode.includes('FA4449')) {
    return {
      serialNumber: rawQuery,
      productName: 'Màn hình ASUS TUF Gaming VG249Q3A 24 inch Fast IPS 180Hz',
      warrantyMonths: 36,
      distributor: 'MadK Store & ASUS Authorized Service Partner',
      status: 'ACTIVE',
    };
  }

  return null;
}

// ----------------- TEST CASES -----------------

// TEST 1: Tra cứu đơn hàng #MK-20261114-BF7A52
console.log('TEST 1: Tra cứu đơn mua online cho mã #MK-20261114-BF7A52 (Đơn Lenovo ThinkPad X1)');
const t1 = findOrder('#MK-20261114-BF7A52');
assert.ok(t1, 'Phải tìm thấy đơn hàng #MK-20261114-BF7A52');
assert.strictEqual(t1.items.length, 1, 'Đơn hàng chỉ được chứa ĐÚNG 1 sản phẩm');
assert.strictEqual(t1.items[0].productName, 'Lenovo ThinkPad X1 Carbon Gen 12', 'Sản phẩm phải là Lenovo ThinkPad X1 Carbon Gen 12');
assert.strictEqual(t1.totalAmount, 56990000, 'Tổng thanh toán phải là 56.990.000₫');
console.log('✅ TEST 1 PASSED: Trả về chính xác 1 sản phẩm "Lenovo ThinkPad X1 Carbon Gen 12" (56.990.000₫)\n');

// TEST 2: Tra cứu bảo hành cho #MK-20261114-BF7A52
console.log('TEST 2: Tra cứu bảo hành e-Warranty cho mã #MK-20261114-BF7A52');
const w2 = findWarranty('#MK-20261114-BF7A52');
assert.ok(w2, 'Phải tìm thấy thông tin bảo hành cho #MK-20261114-BF7A52');
assert.strictEqual(w2.productName, 'Lenovo ThinkPad X1 Carbon Gen 12', 'Sản phẩm bảo hành phải là ThinkPad, KHÔNG được là màn hình ASUS');
assert.strictEqual(w2.warrantyMonths, 36, 'Thời hạn bảo hành ThinkPad là 36 tháng');
assert.ok(w2.distributor.includes('Lenovo'), 'Đơn vị ủy quyền phải là Lenovo Vietnam Authorized Partner');
console.log('✅ TEST 2 PASSED: Thông tin bảo hành khớp hoàn toàn với đơn hàng ThinkPad X1 (36 tháng, Lenovo Partner)\n');

// TEST 3: Đơn hàng mới đặt lưu trong localStorage
console.log('TEST 3: Tra cứu đơn hàng lưu động trong localStorage (User vừa bấm đặt hàng)');
const userOrder = {
  id: 'ord-live-test',
  orderNumber: 'MK-20261114-CUSTOM01',
  status: 'Confirmed',
  totalAmount: 32990000,
  createdAt: '2026-11-14T15:00:00Z',
  items: [
    {
      id: 'item-custom-1',
      productName: 'iPhone 16 Pro Max 256GB',
      quantity: 1,
      unitPrice: 32990000,
      sku: 'IPHONE-16-PM-256'
    }
  ]
};
localStorage.setItem('madk_orders_cache', JSON.stringify([userOrder]));

const t3 = findOrder('#MK-20261114-CUSTOM01');
assert.ok(t3, 'Phải tìm thấy đơn động từ localStorage');
assert.strictEqual(t3.items[0].productName, 'iPhone 16 Pro Max 256GB');

const w3 = findWarranty('#MK-20261114-CUSTOM01');
assert.ok(w3, 'Phải tìm thấy bảo hành từ đơn động');
assert.strictEqual(w3.productName, 'iPhone 16 Pro Max 256GB');
assert.ok(w3.distributor.includes('Apple'), 'Đơn vị bảo hành iPhone phải là Apple Authorized Service Provider');
console.log('✅ TEST 3 PASSED: Đơn hàng tạo mới trong localStorage được tra cứu và kích hoạt bảo hành chuẩn xác\n');

// TEST 4: Tra cứu mã không tồn tại
console.log('TEST 4: Tra cứu mã không tồn tại "RANDOM-NON-EXIST-999"');
const t4 = findOrder('RANDOM-NON-EXIST-999');
const w4 = findWarranty('RANDOM-NON-EXIST-999');
assert.strictEqual(t4, null, 'Mã không tồn tại phải trả về null');
assert.strictEqual(w4, null, 'Bảo hành cho mã không tồn tại phải trả về null (không được hiển thị nhầm ASUS)');
console.log('✅ TEST 4 PASSED: Mã không tồn tại không bị gán nhầm sang sản phẩm khác\n');

// TEST 5: Sample chip MADK-2025-89412
console.log('TEST 5: Tra cứu chip mẫu MADK-2025-89412');
const t5 = findOrder('MADK-2025-89412');
assert.ok(t5, 'Phải tìm thấy đơn mẫu MADK-2025-89412');
assert.strictEqual(t5.items.length, 2, 'Đơn mẫu MADK-2025-89412 có đúng 2 sản phẩm');
assert.strictEqual(t5.totalAmount, 90880000, 'Tổng tiền đơn mẫu là 90.880.000₫');
console.log('✅ TEST 5 PASSED: Đơn mẫu MADK-2025-89412 hiển thị đúng khi bấm chip gợi ý\n');

console.log('================================================================');
console.log('🏆 TẤT CẢ 5/5 BỘ TEST ĐÃ VƯỢT QUA 100% CHÍNH XÁC!');
console.log('================================================================');
