const fs = require('fs');
const path = require('path');

const envFile = path.resolve(__dirname, '..', '.env.stitch');
let apiKey = process.env.STITCH_API_KEY || '';
if (!apiKey && fs.existsSync(envFile)) {
  apiKey = fs.readFileSync(envFile, 'utf8').trim();
}

if (!apiKey) {
  console.error('ERROR: No Stitch API Key found in process.env or .env.stitch');
  process.exit(1);
}

const ENDPOINT = 'https://stitch.googleapis.com/mcp';
const PROJECT_ID = '15376973039181247916';

const SCREENS = [
  { id: '6ee02f7edb4941a2be1c1cf893769d77', title: 'MadK Store - Danh Mục Laptop Chuẩn Bán Lẻ (Desktop)' },
  { id: '76887b01e4234b05b7a79cc4474e05dc', title: 'MadK Store - Trang Chủ Bán Lẻ Thực Tế (Desktop)' },
  { id: '8395fd6d9a9046489f83426247e1c851', title: 'MadK Store - Trang Chủ Bán Lẻ Thực Tế (Mobile 390px)' },
  { id: 'c2f1bd16ad16438e93fb4cb2ba2d422d', title: 'MadK Store - Trang Chủ Chuẩn Bán Lẻ & Shared Components (Desktop)' },
  { id: '212cd202fbbb445c89a258749ab85224', title: 'MadK Console - Bán Tại Quầy POS & Hóa Đơn K80' },
  { id: '300fcc509b6c495891866efe2709acee', title: 'MadK Store - Đăng Nhập, Đăng Ký & Quên Mật Khẩu Chuẩn Bán Lẻ (Desktop)' },
  { id: '321a7c8b9ecb4e15a00ca81a0b135222', title: 'MadK Store - Giỏ Hàng & Thanh Toán Chuẩn Bán Lẻ (Desktop)' },
  { id: '3cadc704e65846ffacf769c6e2852b14', title: 'MadK Store - Xây Dựng Cấu Hình PC Chuẩn Bán Lẻ (Desktop)' },
  { id: '44589f86424c48c2a872437e1e5b6e46', title: 'MadK Console - Quản Lý Đơn Hàng & Side Drawer Chuẩn Bán Lẻ' },
  { id: '6e6ce29c836d4280813a696620f4e04f', title: 'MadK Store - Chi Tiết Sản Phẩm ASUS ROG Strix SCAR 16 Chuẩn Bán Lẻ (Desktop)' },
  { id: '77973996c71a411fbf54425a577e824b', title: 'MadK Store - Tra Cứu Đơn Hàng & Bảo Hành Điện Tử (Desktop)' },
  { id: '9fbf1606ae7a4738bd79ae9f3323b7d3', title: 'MadK Console - Quản Lý Tồn Kho & Sổ Biến Động Kho' },
  { id: 'ce556f5e187344428d034439463ad7f1', title: 'MadK Store - Trung Tâm Tài Khoản, Quản Lý Đơn Hàng & Điểm Thưởng (Desktop)' },
  { id: 'd6d5d52f6a904483850c01445896a31d', title: 'MadK Store - Danh Mục Laptop & Bộ Lọc Filter Sheet (Mobile 390px)' },
  { id: 'eae47be02bb84accb85be8a202667f88', title: 'MadK Console - Tổng Quan Quản Trị (Dashboard)' },
  { id: 'f6b1d3af2b894029b84e1b08d31704f2', title: 'MadK Store - So Sánh Chi Tiết Sản Phẩm Chuẩn Bán Lẻ (Desktop)' }
];

let rpcId = 1;
async function callMcpTool(toolName, args) {
  const payload = {
    jsonrpc: '2.0',
    id: rpcId++,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`RPC Error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

const outDir = path.resolve(__dirname, '..', 'docs', 'stitch_screens');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function fetchHostedUrl(url) {
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  return await res.text();
}

async function run() {
  console.log(`Starting reliable download for all ${SCREENS.length} Stitch screens...`);
  const indexList = [];

  for (let i = 0; i < SCREENS.length; i++) {
    const screen = SCREENS[i];
    const indexNum = String(i + 1).padStart(2, '0');
    console.log(`\n[${indexNum}/${SCREENS.length}] Processing: ${screen.title} (${screen.id})...`);

    const folderName = `${indexNum}_${screen.id}`;
    const targetDir = path.join(outDir, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Get or read screen metadata
    let metadata = null;
    const metaFile = path.join(targetDir, 'metadata.json');
    if (fs.existsSync(metaFile)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      } catch {}
    }
    if (!metadata || !metadata.htmlCode) {
      try {
        const screenRes = await callMcpTool('get_screen', {
          name: `projects/${PROJECT_ID}/screens/${screen.id}`
        });
        if (screenRes && screenRes.content && screenRes.content[0]) {
          metadata = JSON.parse(screenRes.content[0].text);
        } else {
          metadata = screenRes;
        }
        fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2), 'utf8');
        console.log(`  ✓ Saved metadata.json`);
      } catch (err) {
        console.warn(`  ⚠ get_screen failed: ${err.message}`);
      }
    }

    // 2. Download HTML
    const htmlFile = path.join(targetDir, 'screen.html');
    let currentHtmlSize = 0;
    if (fs.existsSync(htmlFile)) {
      currentHtmlSize = fs.statSync(htmlFile).size;
    }

    if (currentHtmlSize <= 100) {
      try {
        let htmlStr = '';
        if (metadata && metadata.htmlCode && metadata.htmlCode.downloadUrl) {
          const resp = await fetchHostedUrl(metadata.htmlCode.downloadUrl);
          if (resp && resp.dataString) {
            htmlStr = resp.dataString;
          } else if (typeof resp === 'string') {
            htmlStr = resp;
          }
        } else {
          const htmlRes = await callMcpTool('download_file', {
            name: `projects/${PROJECT_ID}/screens/${screen.id}/fileEntries/html`
          });
          if (htmlRes && htmlRes.content && htmlRes.content[0]) {
            htmlStr = htmlRes.content[0].text || '';
          }
        }

        if (htmlStr) {
          fs.writeFileSync(htmlFile, htmlStr, 'utf8');
          console.log(`  ✓ Saved screen.html (${Math.round(htmlStr.length / 1024)} KB)`);
        } else {
          console.error(`  ✗ Empty HTML received`);
        }
      } catch (err) {
        console.error(`  ✗ Failed to download HTML: ${err.message}`);
      }
    } else {
      console.log(`  ✓ screen.html already present (${Math.round(currentHtmlSize / 1024)} KB)`);
    }

    // 3. Download Screenshot
    const shotFile = path.join(targetDir, 'screenshot.png');
    let currentShotSize = 0;
    if (fs.existsSync(shotFile)) {
      currentShotSize = fs.statSync(shotFile).size;
    }

    if (currentShotSize <= 100) {
      try {
        let shotBuffer = null;
        if (metadata && metadata.screenshot && metadata.screenshot.downloadUrl) {
          const resp = await fetchHostedUrl(metadata.screenshot.downloadUrl);
          if (resp && resp.dataString) {
            shotBuffer = Buffer.from(resp.dataString, 'base64');
          } else if (resp && resp.image) {
            shotBuffer = Buffer.from(resp.image, 'base64');
          }
        } else {
          const shotRes = await callMcpTool('download_file', {
            name: `projects/${PROJECT_ID}/screens/${screen.id}/fileEntries/screenshot`
          });
          if (shotRes && shotRes.content && shotRes.content[0]) {
            const data = JSON.parse(shotRes.content[0].text);
            if (data.image) {
              shotBuffer = Buffer.from(data.image, 'base64');
            }
          }
        }

        if (shotBuffer) {
          fs.writeFileSync(shotFile, shotBuffer);
          console.log(`  ✓ Saved screenshot.png (${Math.round(shotBuffer.length / 1024)} KB)`);
        } else {
          console.warn(`  ⚠ No screenshot data retrieved`);
        }
      } catch (err) {
        console.error(`  ✗ Failed to download screenshot: ${err.message}`);
      }
    } else {
      console.log(`  ✓ screenshot.png already present (${Math.round(currentShotSize / 1024)} KB)`);
    }

    indexList.push({
      index: i + 1,
      id: screen.id,
      title: screen.title,
      deviceType: metadata ? metadata.deviceType : 'UNKNOWN',
      width: metadata ? metadata.width : null,
      height: metadata ? metadata.height : null,
      folder: folderName,
      htmlPath: `docs/stitch_screens/${folderName}/screen.html`,
      screenshotPath: `docs/stitch_screens/${folderName}/screenshot.png`,
      metadataPath: `docs/stitch_screens/${folderName}/metadata.json`
    });
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(indexList, null, 2), 'utf8');
  console.log(`\n🎉 ALL 16 SCREENS FULLY DOWNLOADED AND VERIFIED! Index written to docs/stitch_screens/index.json`);
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
