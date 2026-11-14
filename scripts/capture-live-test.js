// scripts/capture-live-test.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../frontend/node_modules/playwright');

const PORT = 4188;
const DIST_DIR = path.resolve(__dirname, '../frontend/dist');
const PUBLIC_DIR = path.resolve(__dirname, '../frontend/public');
const ARTIFACT_DIR = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/87b4e3f3-0938-4084-834d-21579daa4483');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

// 1. Static SPA Server
const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    // Check in public dir (e.g. /images/...)
    const publicPath = path.join(PUBLIC_DIR, reqPath);
    if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    } else {
      // SPA Fallback
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading ' + reqPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

async function runLiveTest() {
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`🚀 Máy chủ kiểm thử chạy tại: http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('\n=============================================================');
  console.log('🧪 BẮT ĐẦU TEST TRỰC TIẾP TRÊN GIAO DIỆN MADK STORE');
  console.log('=============================================================');

  // STEP 1: Tra cứu đơn hàng #MK-20261114-BF7A52
  console.log('\n[BƯỚC 1] Điều hướng đến trang Tra cứu đơn hàng và tìm kiếm #MK-20261114-BF7A52...');
  await page.goto(`http://127.0.0.1:${PORT}/tracking?tab=order`, { waitUntil: 'networkidle' });

  // Nhập mã đơn hàng
  const trackingForm = page.locator('form').filter({ hasText: 'Tra cứu' });
  const orderInput = trackingForm.locator('input[type="text"]');
  await orderInput.fill('#MK-20261114-BF7A52');

  // Bấm nút Tra cứu đơn hàng
  const searchOrderBtn = trackingForm.locator('button[type="submit"]');
  await searchOrderBtn.click();

  // Đợi bảng kết quả xuất hiện
  await page.waitForSelector('text=Lenovo ThinkPad X1 Carbon Gen 12', { timeout: 10000 });
  await page.waitForTimeout(600); // Đợi hiệu ứng render

  // Trích xuất dữ liệu DOM để xác thực
  const orderNumberText = await page.locator('text=Mã đơn #MK-20261114-BF7A52').textContent();
  const productNameText = await page.locator('text=Lenovo ThinkPad X1 Carbon Gen 12').first().textContent();
  const productSpecsText = await page.locator('text=ThinkPad X1 Carbon Gen 12 i7/32GB/1TB Đen').first().textContent();
  const totalAmountText = await page.locator('text=56.990.000').first().textContent();
  const itemCountText = await page.locator('text=1 sản phẩm').textContent();
  const statusBadgeText = await page.locator('text=Chờ xác nhận đơn hàng').textContent();

  console.log('-------------------------------------------------------------');
  console.log('📋 KẾT QUẢ XÁC THỰC TRA CỨU ĐƠN HÀNG:');
  console.log(` ✓ Mã đơn hàng: ${orderNumberText?.trim()}`);
  console.log(` ✓ Tên sản phẩm: ${productNameText?.trim()}`);
  console.log(` ✓ Cấu hình: ${productSpecsText?.trim()}`);
  console.log(` ✓ Số lượng: ${itemCountText?.trim()} (CHÍNH XÁC 1 MÓN, không còn bị 2 món ASUS + Chuột)`);
  console.log(` ✓ Tổng tiền: 56.990.000 ₫ (CHÍNH XÁC, không còn bị 90.880.000₫)`);
  console.log(` ✓ Trạng thái: ${statusBadgeText?.trim()}`);
  console.log('-------------------------------------------------------------');

  // Chụp ảnh giao diện kết quả tra cứu đơn hàng
  const orderScreenshotPath = path.join(ARTIFACT_DIR, 'live_test_order_tracking.png');
  await page.screenshot({ path: orderScreenshotPath, fullPage: true });
  console.log(`📸 Đã chụp ảnh màn hình kết quả Đơn hàng: ${orderScreenshotPath}`);

  // STEP 2: Tra cứu bảo hành cho #MK-20261114-BF7A52
  console.log('\n[BƯỚC 2] Chuyển sang Tab "Bảo hành thiết bị / IMEI" và tra cứu #MK-20261114-BF7A52...');
  const warrantyTabBtn = page.locator('button:has-text("Bảo hành thiết bị / IMEI")');
  await warrantyTabBtn.click();
  await page.waitForTimeout(300);

  const warrantyInput = trackingForm.locator('input[type="text"]');
  await warrantyInput.fill('#MK-20261114-BF7A52');

  const searchWarrantyBtn = trackingForm.locator('button[type="submit"]');
  await searchWarrantyBtn.click();

  // Đợi thẻ kết quả bảo hành hiển thị
  await page.waitForSelector('text=Lenovo ThinkPad X1 Carbon Gen 12', { timeout: 10000 });
  await page.waitForTimeout(600);

  const warrantyProductText = await page.locator('h2:has-text("Lenovo ThinkPad X1 Carbon Gen 12")').textContent();
  const warrantyStatusText = await page.locator('text=Còn hạn bảo hành chính hãng').first().textContent();
  const warrantyMonthsText = await page.locator('text=36 Tháng').first().textContent();
  const distributorText = await page.locator('text=MadK Store & Lenovo Vietnam Authorized Partner').first().textContent();
  const expiryDateText = await page.locator('text=14/11/2029').first().textContent();

  console.log('-------------------------------------------------------------');
  console.log('🛡️ KẾT QUẢ XÁC THỰC TRA CỨU BẢO HÀNH E-WARRANTY:');
  console.log(` ✓ Thiết bị bảo hành: ${warrantyProductText?.trim()} (CHÍNH XÁC ThinkPad X1, không còn là màn hình ASUS TUF)`);
  console.log(` ✓ Trạng thái: ${warrantyStatusText?.trim()}`);
  console.log(` ✓ Thời hạn bảo hành: ${warrantyMonthsText?.trim()} chính hãng`);
  console.log(` ✓ Ngày hết hạn: ${expiryDateText?.trim()}`);
  console.log(` ✓ Đơn vị ủy quyền: ${distributorText?.trim()}`);
  console.log('-------------------------------------------------------------');

  const warrantyScreenshotPath = path.join(ARTIFACT_DIR, 'live_test_warranty_tracking.png');
  await page.screenshot({ path: warrantyScreenshotPath, fullPage: true });
  console.log(`📸 Đã chụp ảnh màn hình kết quả Bảo hành: ${warrantyScreenshotPath}`);

  // STEP 3: Tra cứu mã không tồn tại
  console.log('\n[BƯỚC 3] Kiểm tra khi tra cứu mã không tồn tại "MK-NONEXIST-999"...');
  await warrantyInput.click();
  await warrantyInput.fill('');
  await warrantyInput.pressSequentially('MK-NONEXIST-999', { delay: 20 });
  await page.waitForTimeout(300);

  await trackingForm.locator('button[type="submit"]').click();
  await page.waitForSelector('text=Không tìm thấy thông tin bảo hành', { timeout: 10000 });

  const notFoundText = await page.locator('text=Không tìm thấy thông tin bảo hành cho mã').textContent();
  console.log(` ✓ Phản hồi hệ thống: ${notFoundText?.trim()} (Không gán nhầm sang sản phẩm khác)`);

  const notFoundScreenshotPath = path.join(ARTIFACT_DIR, 'live_test_not_found.png');
  await page.screenshot({ path: notFoundScreenshotPath, fullPage: false });
  console.log(`📸 Đã chụp ảnh màn hình kết quả Không tìm thấy: ${notFoundScreenshotPath}`);

  await browser.close();
  server.close();

  console.log('\n=============================================================');
  console.log('🎉 TẤT CẢ CÁC BƯỚC TEST TRỰC TIẾP TRÊN TRÌNH DUYỆT ĐÃ HOÀN TẤT!');
  console.log('=============================================================');
}

runLiveTest().catch((err) => {
  console.error('❌ Lỗi khi test trực tiếp:', err);
  server.close();
  process.exit(1);
});
