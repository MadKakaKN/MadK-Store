const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/@playwright/test'));

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\87b4e3f3-0938-4084-834d-21579daa4483';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 2, // High resolution screenshot
  });
  const page = await context.newPage();

  console.log('Navigating to product page...');
  await page.goto('http://localhost:5173/products/laptop-asus-rog-strix-scar-16', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Clicking "Thêm vào giỏ" to trigger popup modal...');
  const addToCartBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
  await addToCartBtn.click();

  console.log('Waiting for AuthRequiredModal...');
  const modal = page.locator('[role="dialog"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(600);

  const step1Path = path.join(ARTIFACT_DIR, 'signup_demo_step1_modal.png');
  await page.screenshot({ path: step1Path });
  console.log('Captured Step 1:', step1Path);

  console.log('Clicking "Tạo tài khoản mới (Sign Up)" button in modal...');
  const signUpBtn = modal.getByRole('link', { name: /Tạo tài khoản mới|Sign Up/i });
  await signUpBtn.click();

  console.log('Waiting for Register Page navigation...');
  await page.waitForURL((url) => url.pathname.includes('/auth/register'), { timeout: 10000 });
  await page.waitForTimeout(500);

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', resp => {
    if (resp.url().includes('/auth/register')) {
      console.log('REGISTER API STATUS:', resp.status());
      resp.text().then(t => console.log('REGISTER API BODY:', t)).catch(() => {});
    }
  });

  const uniqueEmail = `minh.nguyen.${Date.now()}@example.com`;
  console.log('Filling registration form with email:', uniqueEmail);
  await page.locator('#fullName').fill('Nguyễn Văn Minh');
  await page.locator('#email').fill(uniqueEmail);
  await page.locator('#phoneNumber').fill('0987654321');
  await page.locator('#password').fill('Minh@123456');
  await page.locator('#confirmPassword').fill('Minh@123456');

  await page.waitForTimeout(500);

  const step2Path = path.join(ARTIFACT_DIR, 'signup_demo_step2_filled_form.png');
  await page.screenshot({ path: step2Path });
  console.log('Captured Step 2:', step2Path);

  console.log('Submitting registration form...');
  const submitBtn = page.getByRole('button', { name: 'Đăng ký tài khoản' });
  await submitBtn.click();

  console.log('Waiting for response or redirect back to product page...');
  await page.waitForTimeout(3000);

  const step3Path = path.join(ARTIFACT_DIR, 'signup_demo_step3_success.png');
  await page.screenshot({ path: step3Path });
  console.log('Captured Step 3 (redirected & logged in):', step3Path);

  console.log('Step 4: Now adding product to cart as authenticated user...');
  const addCartBtnNow = page.getByRole('button', { name: /Thêm vào giỏ hàng/i });
  await addCartBtnNow.click();
  await page.waitForTimeout(1500);

  const step4Path = path.join(ARTIFACT_DIR, 'signup_demo_step4_added_to_cart.png');
  await page.screenshot({ path: step4Path });
  console.log('Captured Step 4 (product successfully added):', step4Path);

  await browser.close();
  console.log('All 4 steps completed successfully!');
}

run().catch((err) => {
  console.error('Error running signup demo:', err);
  process.exit(1);
});
