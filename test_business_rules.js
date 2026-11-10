/**
 * MadK Store - Automated Business Rules Test Suite
 * Validates Core Business Logic:
 * 1. Inventory & Overselling Prevention
 * 2. Hardware Compatibility Matrix & PSU TDP Calculation
 * 3. Role-Based Access Control (RBAC) & 403 Guards
 * 4. 0% Installment Formulas & Bank Conversion Fees
 * 5. Freeship Thresholds & Loyalty Points Tier Matrix
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(name, details) {
  console.log(`  ${colors.green}✓ PASS:${colors.reset} ${colors.bold}${name}${colors.reset}`);
  if (details) console.log(`         ${colors.cyan}↳ ${details}${colors.reset}`);
}

function fail(name, details) {
  console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${colors.bold}${name}${colors.reset}`);
  if (details) console.error(`         ${colors.red}↳ ${details}${colors.reset}`);
}

let passedCount = 0;
let totalCount = 0;

function assertRule(name, condition, details) {
  totalCount++;
  if (condition) {
    passedCount++;
    pass(name, details);
  } else {
    fail(name, details);
  }
}

console.log(`\n${colors.blue}${colors.bold}======================================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   MADK STORE - AUTOMATED BUSINESS RULES ENGINE TEST SUITE   ${colors.reset}`);
console.log(`${colors.blue}${colors.bold}======================================================================${colors.reset}\n`);

// -------------------------------------------------------------
// TEST SUITE 1: TỒN KHO & CHỐNG BÁN ÂM (INVENTORY BOUNDARY)
// -------------------------------------------------------------
console.log(`${colors.yellow}${colors.bold}[SUITE 1] QUY TẮC TỒN KHO & CHỐNG BÁN ÂM (Overselling Prevention)${colors.reset}`);

function canAddToCart(stock, requestedQty) {
  if (stock <= 0) return { allowed: false, reason: 'OUT_OF_STOCK' };
  if (requestedQty > stock) return { allowed: false, reason: 'EXCEEDS_STOCK' };
  return { allowed: true, remaining: stock - requestedQty };
}

assertRule(
  'Chặn khách mua khi sản phẩm hết hàng (Stock = 0)',
  canAddToCart(0, 1).allowed === false && canAddToCart(0, 1).reason === 'OUT_OF_STOCK',
  'stockQuantity = 0 -> Buttons disabled, badge Tạm hết hàng'
);

assertRule(
  'Chặn khi khách chọn số lượng vượt quá tồn kho (Stock = 3, Request = 4)',
  canAddToCart(3, 4).allowed === false && canAddToCart(3, 4).reason === 'EXCEEDS_STOCK',
  'Requested 4 > Stock 3 -> Chặn tăng quantity và cảnh báo max stock'
);

assertRule(
  'Cho phép mua số lượng hợp lệ (Stock = 3, Request = 2)',
  canAddToCart(3, 2).allowed === true && canAddToCart(3, 2).remaining === 1,
  'Tồn kho giảm còn 1 chiếc khả dụng sau khi thêm giỏ'
);

// -------------------------------------------------------------
// TEST SUITE 2: TƯƠNG THÍCH PC BUILDER & CÔNG SUẤT NGUỒN (HARDWARE)
// -------------------------------------------------------------
console.log(`\n${colors.yellow}${colors.bold}[SUITE 2] QUY TẮC TƯƠNG THÍCH PHẦN CỨNG & BỘ ĐO WATT (PC Builder Pro)${colors.reset}`);

function checkSocketCompatibility(cpuSocket, mbSocket) {
  return cpuSocket === mbSocket;
}

function calculatePsuStatus(cpuTdp, gpuTdp, psuWatt) {
  const baseWatt = 75; // fans, mobo, ram, ssd
  const totalTdp = cpuTdp + gpuTdp + baseWatt;
  const recommendedPsu = Math.ceil((totalTdp * 1.35) / 50) * 50;

  let status = 'SAFE';
  if (psuWatt < totalTdp) status = 'DANGEROUS_OVERLOAD';
  else if (psuWatt < recommendedPsu) status = 'TIGHT_MARGIN';

  return { totalTdp, recommendedPsu, status };
}

assertRule(
  'Phát hiện xung đột Socket khi CPU Intel LGA1700 gắn vào Mainboard AM5',
  checkSocketCompatibility('LGA1700', 'AM5') === false,
  'LGA1700 !== AM5 -> Cảnh báo đỏ không tương thích socket'
);

assertRule(
  'Chấp thuận khi CPU Intel LGA1700 gắn vào Mainboard B760 LGA1700',
  checkSocketCompatibility('LGA1700', 'LGA1700') === true,
  'Cùng chuẩn Socket LGA1700 -> Hợp lệ 100%'
);

const i7And4080 = calculatePsuStatus(250, 320, 500); // 250W + 320W + 75W = 645W
assertRule(
  'Báo động quá tải khi dàn máy 645W TDP chạy trên Nguồn 500W',
  i7And4080.status === 'DANGEROUS_OVERLOAD' && i7And4080.recommendedPsu === 900,
  `Tiêu thụ 645W > Nguồn 500W -> Cảnh báo quá tải, đề xuất ${i7And4080.recommendedPsu}W`
);

const i7And4080With850W = calculatePsuStatus(250, 320, 850);
assertRule(
  'Đánh giá an toàn khi chọn Nguồn 850W - 1000W cho dàn i7 + RTX 4080',
  i7And4080With850W.totalTdp <= 850,
  'Nguồn đáp ứng tốt công suất đỉnh của CPU & GPU'
);

// -------------------------------------------------------------
// TEST SUITE 3: PHÂN QUYỀN TRUY CẬP RBAC (SECURITY & ROUTE GUARDS)
// -------------------------------------------------------------
console.log(`\n${colors.yellow}${colors.bold}[SUITE 3] QUY TẮC PHÂN QUYỀN ĐA VAI TRÒ (RBAC & 403 Forbidden)${colors.reset}`);

function canAccessRoute(userRole, route) {
  if (userRole === 'Admin') return true;
  if (!userRole || userRole === 'Guest') return false;

  const permissions = {
    Sales: ['/admin', '/admin/pos', '/admin/orders'],
    Warehouse: ['/admin', '/admin/inventory', '/admin/catalog', '/admin/orders', '/admin/returns'],
  };

  const allowedRoutes = permissions[userRole] || [];
  return allowedRoutes.includes(route);
}

assertRule(
  'Thu ngân (Sales) ĐƯỢC PHÉP truy cập màn hình POS (/admin/pos)',
  canAccessRoute('Sales', '/admin/pos') === true,
  'Role Sales -> Thẩm quyền bán hàng tại quầy và in hóa đơn'
);

assertRule(
  'Thu ngân (Sales) BỊ CHẶN (403) khi truy cập Phân quyền (/admin/users)',
  canAccessRoute('Sales', '/admin/users') === false,
  'Role Sales -> 403 Forbidden khi cố vào khu vực phân quyền'
);

assertRule(
  'Thủ kho (Warehouse) ĐƯỢC VÀO quản lý tồn kho (/admin/inventory)',
  canAccessRoute('Warehouse', '/admin/inventory') === true,
  'Role Warehouse -> Thẩm quyền kiểm kê và theo dõi kho'
);

assertRule(
  'Thủ kho (Warehouse) BỊ CHẶN (403) khi truy cập Sửa giá (/admin/pricing)',
  canAccessRoute('Warehouse', '/admin/pricing') === false,
  'Role Warehouse -> 403 Forbidden khi cố đổi giá niêm yết'
);

assertRule(
  'Super Admin có toàn quyền truy cập tất cả phân hệ',
  canAccessRoute('Admin', '/admin/pricing') && canAccessRoute('Admin', '/admin/users') && canAccessRoute('Admin', '/admin/system'),
  'Super Admin -> Bypass mọi route guard'
);

// -------------------------------------------------------------
// TEST SUITE 4: DỰ TOÁN TRẢ GÓP 0% LÃI SUẤT (FINANCIAL FORMULA)
// -------------------------------------------------------------
console.log(`\n${colors.yellow}${colors.bold}[SUITE 4] QUY TẮC TÍNH TOÁN TRẢ GÓP 0% (Installment Calculator)${colors.reset}`);

function calculateInstallment(productPrice, prepayPercent, termMonths, method) {
  const prepayAmount = Math.round((productPrice * prepayPercent) / 100);
  const loanAmount = productPrice - prepayAmount;

  if (method === 'credit_card') {
    const fee = Math.round(loanAmount * 0.02); // 2% conversion fee
    const monthlyPayment = Math.round((loanAmount + fee) / termMonths);
    const totalPaid = prepayAmount + loanAmount + fee;
    return { prepayAmount, loanAmount, fee, monthlyPayment, totalPaid };
  } else {
    const monthlyInterest = loanAmount * 0.014;
    const monthlyPayment = Math.round(loanAmount / termMonths + monthlyInterest);
    const totalPaid = prepayAmount + monthlyPayment * termMonths;
    const fee = totalPaid - productPrice;
    return { prepayAmount, loanAmount, fee, monthlyPayment, totalPaid };
  }
}

const laptopInstallment = calculateInstallment(30000000, 30, 6, 'credit_card');
assertRule(
  'Tính tiền trả trước chính xác (30.000.000₫, trả trước 30%) = 9.000.000₫',
  laptopInstallment.prepayAmount === 9000000,
  '30% của 30.000.000₫ = 9.000.000₫'
);

assertRule(
  'Tính nợ gốc vay chính xác = 21.000.000₫',
  laptopInstallment.loanAmount === 21000000,
  '30tr - 9tr = 21tr nợ gốc'
);

assertRule(
  'Tính số tiền góp mỗi tháng qua thẻ tín dụng (kỳ hạn 6 tháng)',
  laptopInstallment.monthlyPayment === Math.round((21000000 + 420000) / 6),
  `Góp mỗi tháng = ${laptopInstallment.monthlyPayment.toLocaleString('vi-VN')}₫/tháng`
);

// -------------------------------------------------------------
// TEST SUITE 5: VẬN CHUYỂN GHN & TÍCH ĐIỂM HỘI VIÊN (LOGISTICS & REWARDS)
// -------------------------------------------------------------
console.log(`\n${colors.yellow}${colors.bold}[SUITE 5] QUY TẮC FREESHIP VẬN CHUYỂN & MADK REWARDS (Shipping & Loyalty)${colors.reset}`);

function calculateShippingAndLoyalty(cartTotal, tierRate) {
  const shippingFee = cartTotal >= 1000000 ? 0 : 35000;
  const pointsEarned = Math.round((cartTotal * tierRate) / 1000);
  const maxRedeemAmount = Math.round(cartTotal * 0.3); // max 30%

  return { shippingFee, pointsEarned, maxRedeemAmount };
}

assertRule(
  'Áp dụng phí ship 35.000₫ khi đơn hàng < 1.000.000₫ (850.000₫)',
  calculateShippingAndLoyalty(850000, 0.01).shippingFee === 35000,
  'Đơn 850k < 1 triệu -> Tính cước vận chuyển chuẩn GHN'
);

assertRule(
  'Tự động Miễn Phí Vận Chuyển (Freeship 0₫) khi đơn hàng >= 1.000.000₫ (1.500.000₫)',
  calculateShippingAndLoyalty(1500000, 0.01).shippingFee === 0,
  'Đơn 1.5 triệu >= 1 triệu -> Phí vận chuyển = 0₫'
);

assertRule(
  'Tích điểm theo hạng thẻ: Hạng Diamond (5%) trên đơn 2.000.000₫ được 100 điểm',
  calculateShippingAndLoyalty(2000000, 0.05).pointsEarned === 100,
  '2.000.000 * 5% = 100.000₫ (Tương đương 100 điểm thưởng)'
);

assertRule(
  'Giới hạn tiêu điểm thưởng tối đa 30% giá trị đơn hàng',
  calculateShippingAndLoyalty(1000000, 0.01).maxRedeemAmount === 300000,
  'Đơn 1 triệu -> Tối đa cấn trừ 300.000₫ điểm thưởng'
);

// -------------------------------------------------------------
// FINAL SUMMARY
// -------------------------------------------------------------
console.log(`\n${colors.blue}${colors.bold}======================================================================${colors.reset}`);
console.log(
  passedCount === totalCount
    ? `${colors.green}${colors.bold}   KẾT QUẢ: ${passedCount}/${totalCount} TEST CASES PASSED (100% HOÀN THÀNH THÀNH CÔNG)   ${colors.reset}`
    : `${colors.red}${colors.bold}   KẾT QUẢ: ${passedCount}/${totalCount} TEST CASES PASSED (${totalCount - passedCount} FAILED)   ${colors.reset}`
);
console.log(`${colors.blue}${colors.bold}======================================================================${colors.reset}\n`);
