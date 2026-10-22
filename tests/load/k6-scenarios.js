import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Cấu hình Kịch bản Tải (Load Profile)
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up lên 20 virtual users trong 30s
    { duration: '1m', target: 20 },   // Giữ tải ổn định 20 VUs trong 1 phút
    { duration: '30s', target: 50 },  // Đẩy đỉnh tải lên 50 VUs (Spike test)
    { duration: '30s', target: 0 },   // Hạ tải về 0
  ],
  thresholds: {
    // 95% số request phải hoàn tất dưới 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    // Tỷ lệ request lỗi không vượt quá 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // 1. Kịch bản 1: Duyệt danh sách sản phẩm phân trang (Catalog Pagination)
  group('1. Browse Catalog Page', () => {
    const res = http.get(`${BASE_URL}/api/v1/products?page=1&pageSize=12&sortBy=CreatedAt&sortDirection=Desc`, {
      tags: { name: 'GetProductsList' },
    });
    check(res, {
      'Catalog status 200': (r) => r.status === 200,
      'Catalog response within 300ms': (r) => r.timings.duration < 300,
    });
  });

  sleep(1);

  // 2. Kịch bản 2: Tìm kiếm sản phẩm theo từ khóa (Keyword Search)
  group('2. Search Products', () => {
    const searchTerms = ['ROG', ' bàn phím', 'MacBook', 'RTX', 'Gaming'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const res = http.get(`${BASE_URL}/api/v1/products?search=${encodeURIComponent(term)}&page=1&pageSize=10`, {
      tags: { name: 'SearchProducts' },
    });
    check(res, {
      'Search status 200': (r) => r.status === 200,
      'Search response within 400ms': (r) => r.timings.duration < 400,
    });
  });

  sleep(1);

  // 3. Kịch bản 3: Đặt hàng COD (Order Checkout COD)
  group('3. Checkout Order COD', () => {
    const idempotencyKey = `idemp_${Date.now()}_${__VU}_${__ITER}`;
    const payload = JSON.stringify({
      shippingAddress: {
        recipientName: 'Khách hàng Load Test',
        phoneNumber: '0987654321',
        provinceCode: '01',
        provinceName: 'Thành phố Hà Nội',
        districtCode: '001',
        districtName: 'Quận Ba Đình',
        wardCode: '00001',
        wardName: 'Phường Phúc Xá',
        detailedAddress: '123 Đường Bưởi, Ba Đình, Hà Nội',
      },
      items: [
        {
          variantId: 'e1000000-0000-0000-0000-000000000001',
          quantity: 1,
        },
      ],
      customerNote: 'Đơn hàng tự động từ K6 load test script',
      idempotencyKey: idempotencyKey,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      tags: { name: 'CheckoutCod' },
    };

    const res = http.post(`${BASE_URL}/api/v1/orders/checkout/cod`, payload, params);
    check(res, {
      'Checkout status is 200 or 400/409 (acceptable under race conditions)': (r) =>
        r.status === 200 || r.status === 400 || r.status === 409,
    });
  });

  sleep(2);
}
