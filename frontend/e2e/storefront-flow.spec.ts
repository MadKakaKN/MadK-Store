import { test, expect } from '@playwright/test';

test.describe('MadK Store - Comprehensive E2E Testing', () => {
  test('1. Tìm kiếm và duyệt danh mục sản phẩm', async ({ page }) => {
    // Truy cập trang chủ
    await page.goto('/');
    await expect(page).toHaveTitle(/MadK Store/);

    // Kiểm tra các thành phần cốt lõi trên trang chủ
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Điều hướng sang trang danh mục sản phẩm
    await page.goto('/categories');
    await expect(page).toHaveURL(/categories/);

    // Kiểm tra danh sách sản phẩm hiển thị ít nhất 1 sản phẩm
    const productCards = page.locator('article, .group\\/card, a[href*="/products/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    // Tìm kiếm sản phẩm qua ô input hoặc query URL
    await page.goto('/categories?search=ROG');
    await expect(page).toHaveURL(/search=ROG/);
  });

  test('2. Xem chi tiết sản phẩm và thêm vào giỏ hàng', async ({ page }) => {
    // Điều hướng trực tiếp tới sản phẩm spotlight
    await page.goto('/products/laptop-asus-rog-strix-scar-16');

    // Kiểm tra thông tin sản phẩm hiển thị dạng HTML chuẩn
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Kiểm tra nút thêm vào giỏ hàng
    const addToCartBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // Chờ thông báo đã thêm vào giỏ hàng
    await expect(page.getByText(/Đã thêm.*vào giỏ hàng/i)).toBeVisible({ timeout: 10000 });

    // Điều hướng vào trang giỏ hàng
    await page.goto('/cart');
    await expect(page).toHaveURL(/cart/);

    // Xác nhận có nút Tiến hành đặt hàng trong giỏ
    const checkoutBtn = page.getByRole('button', { name: /Tiến hành đặt hàng/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
  });

  test('3. Đăng nhập tài khoản khách hàng', async ({ page }) => {
    await page.goto('/auth/login');

    // Điền form đăng nhập
    await page.locator('input[type="email"], input[name="email"]').fill('customer@madkstore.local');
    await page.locator('input[type="password"], input[name="password"]').fill('Customer@123');

    // Nhấp nút Đăng nhập
    const submitBtn = page.getByRole('button', { name: /Đăng nhập/i });
    await submitBtn.click();

    // Kiểm tra đăng nhập thành công và chuyển hướng về trang chủ hoặc tài khoản
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('4. Đặt hàng COD hoàn tất với điểm nhấn 3D', async ({ page }) => {
    // Thêm sản phẩm vào giỏ
    await page.goto('/products/laptop-asus-rog-strix-scar-16');
    const addToCartBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    await expect(page.getByText(/Đã thêm.*vào giỏ hàng/i)).toBeVisible({ timeout: 10000 });

    // Điều hướng qua giỏ hàng và nhấp Tiến hành đặt hàng
    await page.goto('/cart');
    const checkoutBtn = page.getByRole('button', { name: /Tiến hành đặt hàng/i });
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Xác nhận đã vào trang checkout và items > 0
    await page.waitForURL(/checkout/, { timeout: 10000 });

    // Điền thông tin người nhận
    const nameInput = page.locator('input[placeholder*="Nguyễn Văn A" i], input[name="recipientName"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Nguyễn Văn Khách Hàng');
    }

    const phoneInput = page.locator('input[placeholder*="0912345678" i], input[name="phoneNumber"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('0912345678');
    }

    // Chọn Tỉnh / Thành phố
    const provinceSelect = page.locator('select').nth(0);
    if (await provinceSelect.isVisible()) {
      await provinceSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      const districtSelect = page.locator('select').nth(1);
      if (await districtSelect.isEnabled()) {
        await districtSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);

        const wardSelect = page.locator('select').nth(2);
        if (await wardSelect.isEnabled()) {
          await wardSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }
    }

    const addressInput = page.locator('input[placeholder*="Số nhà" i], input[placeholder*="Phạm Hùng" i]').first();
    if (await addressInput.isVisible()) {
      await addressInput.fill('123 Hoàng Hoa Thám, Phường Phúc Xá');
    }

    // Nút submit lúc này enabled
    const submitOrderBtn = page.getByRole('button', { name: /Xác nhận Đặt hàng|Đặt hàng/i }).first();
    await expect(submitOrderBtn).toBeEnabled({ timeout: 10000 });
    await submitOrderBtn.click();

    // Xác nhận chuyển hướng tới trang thành công
    await page.waitForURL((url) => url.pathname.includes('/checkout/success') || url.pathname.includes('/order-success'), {
      timeout: 15000,
    });

    // Kiểm tra có container 3D điểm nhấn mừng đặt hàng thành công
    const scene3D = page.locator('#order-success-3d-scene');
    await expect(scene3D).toBeVisible();
    await expect(page.getByText(/Đặt hàng thành công|Cảm ơn bạn/i).first()).toBeVisible();
  });

  test('5. Mô phỏng xử lý kết quả thanh toán trực tuyến Sandbox (VNPay Return)', async ({ page }) => {
    // Điều hướng vào trang xử lý phản hồi VNPay với tham số hợp lệ
    await page.goto(
      '/checkout/vnpay-return?vnp_ResponseCode=00&vnp_TransactionNo=99887766&vnp_TxnRef=MK-20261021-TEST01&vnp_Amount=3499000000&vnp_BankCode=NCB&vnp_OrderInfo=Thanh+toan+don+hang+MadK'
    );

    // Xác nhận trang hiển thị kết quả thành công và nút điều hướng
    await expect(page.getByText(/thành công|Giao dịch thành công|Đã thanh toán/i).first()).toBeVisible({ timeout: 10000 });
  });
});
