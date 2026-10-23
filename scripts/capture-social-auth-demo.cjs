const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/@playwright/test'));

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\87b4e3f3-0938-4084-834d-21579daa4483';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Capture LoginPage with Social Login
  console.log('Navigating to /auth/login...');
  await page.goto('http://localhost:5173/auth/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const loginSocialPath = path.join(ARTIFACT_DIR, 'social_login_page_preview.png');
  await page.screenshot({ path: loginSocialPath });
  console.log('Captured LoginPage with Social Login:', loginSocialPath);

  // 2. Open Google OAuth Consent / Account Selection Dialog
  console.log('Opening Google OAuth verification dialog...');
  const googleLoginBtn = page.getByRole('button', { name: /Đăng nhập với Google/i });
  await googleLoginBtn.click();
  await page.waitForSelector('text=Chọn tài khoản Google để xác minh', { timeout: 5000 });
  await page.waitForTimeout(500);

  const googleConsentPath = path.join(ARTIFACT_DIR, 'google_oauth_consent_dialog.png');
  await page.screenshot({ path: googleConsentPath });
  console.log('Captured Google OAuth Verification Dialog:', googleConsentPath);

  // Close Google dialog
  await page.getByLabel('Đóng').click();
  await page.waitForTimeout(400);

  // 3. Open Facebook OAuth Consent Dialog
  console.log('Opening Facebook OAuth verification dialog...');
  const facebookLoginBtn = page.getByRole('button', { name: /Đăng nhập với Facebook/i });
  await facebookLoginBtn.click();
  await page.waitForSelector('text=Đăng nhập bằng Facebook', { timeout: 5000 });
  await page.waitForTimeout(500);

  const fbConsentPath = path.join(ARTIFACT_DIR, 'facebook_oauth_consent_dialog.png');
  await page.screenshot({ path: fbConsentPath });
  console.log('Captured Facebook OAuth Verification Dialog:', fbConsentPath);

  // Close Facebook dialog
  await page.getByRole('button', { name: /Hủy bỏ/i }).click();
  await page.waitForTimeout(400);

  // 4. Capture AuthRequiredModal on Product Page with Quick Social Login
  console.log('Navigating to product page...');
  await page.goto('http://localhost:5173/products/laptop-asus-rog-strix-scar-16', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const addToCartBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
  await addToCartBtn.click();
  const modal = page.locator('[role="dialog"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(600);

  const modalSocialPath = path.join(ARTIFACT_DIR, 'social_modal_popup_preview.png');
  await page.screenshot({ path: modalSocialPath });
  console.log('Captured AuthRequiredModal with Social Login:', modalSocialPath);

  // 5. Click Quick Google login in modal and authenticate
  console.log('Clicking Quick Google login in modal and verifying account...');
  const quickGoogleBtn = modal.getByRole('button', { name: /Google/i });
  await quickGoogleBtn.click();
  await page.waitForSelector('text=Chọn tài khoản Google để xác minh', { timeout: 5000 });
  await page.waitForTimeout(400);

  // Click verify account
  const accountBtn = page.getByRole('button', { name: /Nguyễn Văn Minh/i });
  await accountBtn.click();
  await page.waitForTimeout(1500);

  const postSocialLoginPath = path.join(ARTIFACT_DIR, 'social_login_success_preview.png');
  await page.screenshot({ path: postSocialLoginPath });
  console.log('Captured Post-Login state:', postSocialLoginPath);

  await browser.close();
  console.log('All OAuth consent and verification screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error capturing social auth:', err);
  process.exit(1);
});
