/**
 * MadK Store - Automated Performance & Load Testing Suite (autocannon)
 * Chạy trực tiếp: npx autocannon or node tests/load/run-benchmarks.js
 */

import autocannon from 'autocannon';

async function runBenchmark(name, opts) {
  console.log(`\n======================================================`);
  console.log(`🚀 BẮT ĐẦU LOAD TEST: ${name}`);
  console.log(`URL: ${opts.url} | Connections: ${opts.connections || 10} | Duration: ${opts.duration || 10}s`);
  console.log(`======================================================\n`);

  return new Promise((resolve) => {
    const instance = autocannon(opts, (err, result) => {
      if (err) {
        console.error(`Lỗi khi chạy benchmark ${name}:`, err);
        resolve(null);
        return;
      }

      console.log(`\n📊 KẾT QUẢ HIỆU NĂNG - ${name}:`);
      console.log(`------------------------------------------------------`);
      console.log(`- Tổng số Requests      : ${result.requests.total}`);
      console.log(`- Requests/giây (Avg)   : ${result.requests.average.toFixed(1)} req/s`);
      console.log(`- Throughput (Avg)       : ${(result.throughput.average / (1024 * 1024)).toFixed(2)} MB/s`);
      console.log(`- Độ trễ p50 (Trung vị)  : ${result.latency.p50} ms`);
      console.log(`- Độ trễ p90             : ${result.latency.p90} ms`);
      console.log(`- Độ trễ p99             : ${result.latency.p99} ms`);
      console.log(`- Độ trễ tối đa (Max)    : ${result.latency.max} ms`);
      console.log(`- Số lỗi (Errors / 1xx-5xx): ${result.errors} lỗi, ${result.non2xx} non-2xx`);
      console.log(`------------------------------------------------------`);
      resolve(result);
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:5173';

  console.log(`MadK Store Performance Test Suite đang hướng tới: ${targetUrl}`);

  // 1. Kịch bản 1: Danh sách sản phẩm (Catalog)
  await runBenchmark('1. Danh sách sản phẩm & SSR/Client Shell (/categories)', {
    url: `${targetUrl}/categories`,
    connections: 15,
    duration: 10,
    pipelining: 1,
  });

  // 2. Kịch bản 2: Tìm kiếm sản phẩm (/categories?search=ROG)
  await runBenchmark('2. Tìm kiếm danh mục & sản phẩm (/categories?search=ROG)', {
    url: `${targetUrl}/categories?search=ROG`,
    connections: 15,
    duration: 10,
    pipelining: 1,
  });

  // 3. Kịch bản 3: Chi tiết sản phẩm & Tải tài nguyên 3D (/products/laptop-asus-rog-strix-scar-16)
  await runBenchmark('3. Trang chi tiết sản phẩm & 3D Viewer (/products/laptop-asus-rog-strix-scar-16)', {
    url: `${targetUrl}/products/laptop-asus-rog-strix-scar-16`,
    connections: 15,
    duration: 10,
    pipelining: 1,
  });

  // 4. Kịch bản 4: Giỏ hàng & Checkout flow (/cart)
  await runBenchmark('4. Luồng giỏ hàng (/cart)', {
    url: `${targetUrl}/cart`,
    connections: 15,
    duration: 10,
    pipelining: 1,
  });

  console.log('\n✅ TẤT CẢ CÁC KỊCH BẢN LOAD TEST ĐÃ HOÀN TẤT THÀNH CÔNG.\n');
}

main().catch(console.error);
