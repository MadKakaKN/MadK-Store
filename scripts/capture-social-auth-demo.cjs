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

  // 2. Capture AuthRequiredModal on Product Page with Quick Social Login
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

  // 3. Click Google quick login in modal
  console.log('Clicking Quick Google login in modal...');
  const googleBtn = modal.getByRole('button', { name: /Google/i });
  await googleBtn.click();
  await page.waitForTimeout(1000);

  const postSocialLoginPath = path.join(ARTIFACT_DIR, 'social_login_success_preview.png');
  await page.screenshot({ path: postSocialLoginPath });
  console.log('Captured Post-Login state:', postSocialLoginPath);

  await browser.close();
  console.log('Social auth screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error capturing social auth:', err);
  process.exit(1);
});
