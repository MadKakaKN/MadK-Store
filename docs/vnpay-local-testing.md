# Hướng dẫn Kiểm thử VNPay Sandbox & IPN Webhook Local

Tài liệu này hướng dẫn cách kiểm thử luồng thanh toán VNPay Sandbox trên môi trường phát triển local (Frontend: `http://localhost:5173`, Backend: `http://localhost:5000` hoặc qua Docker: `http://localhost:8080`).

---

## 1. Cơ chế hoạt động & Nguồn sự thật (Single Source of Truth)

1. **Tạo đơn hàng & URL thanh toán (`POST /api/v1/orders/checkout/vnpay`):**
   - Đơn hàng được tạo ở trạng thái `PendingPayment`.
   - Tồn kho sản phẩm được giữ chỗ (`ReserveStockAsync`).
   - Backend tính toán mã bảo mật HMAC-SHA512 (`vnp_SecureHash`) và trả về `paymentUrl`.
   - Frontend chuyển hướng khách hàng sang cổng thanh toán VNPay Sandbox.

2. **Khách hàng thanh toán trên cổng VNPay Sandbox:**
   - Dùng thông tin thẻ test sandbox do VNPay cung cấp (ngân hàng NCB, số thẻ test, OTP 123456).

3. **Xử lý IPN / Webhook (`GET /api/v1/payments/vnpay/ipn`) — NGUỒN SỰ THẬT:**
   - VNPay Server gọi trực tiếp server-to-server tới endpoint IPN của backend.
   - Backend kiểm tra:
     - Chữ ký số HMAC-SHA512 hợp lệ (`RspCode: 00`, nếu sai trả `RspCode: 97`).
     - Đơn hàng tồn tại trong DB (nếu không có trả `RspCode: 01`).
     - Số tiền thanh toán khớp đúng 100% với giá trị đơn hàng (nếu sai trả `RspCode: 04`).
     - **Idempotency**: Nếu đơn hàng đã được xác nhận hoặc đã thanh toán trước đó, trả về `RspCode: 02` ("Order already confirmed") và không xử lý lặp lại.
   - Khi IPN thành công (`vnp_ResponseCode == "00"`):
     - Trạng thái đơn hàng chuyển sang `Pending` (sẵn sàng cho Sales xử lý giao hàng theo `order-states.md`).
     - Đánh dấu `IsPaid = true`, `PaidAt = UtcNow`.
     - Lưu đầy đủ bản ghi vào bảng `payments` kèm `RawPayload` (JSON chứa toàn bộ tham số VNPay gửi sang).
   - Nếu thanh toán thất bại hoặc khách bấm hủy tại cổng VNPay:
     - Trạng thái đơn chuyển sang `Cancelled`.
     - Tồn kho giữ chỗ được hoàn trả tự động (`ReleaseStockAsync`).
   - **Kể cả khi người dùng đóng tab giữa chừng**, IPN vẫn gọi đến backend và đơn hàng vẫn được chuyển trạng thái chính xác.

4. **Trang trả về kết quả (`GET /checkout/vnpay-return`):**
   - Chỉ dùng để hiển thị giao diện thông báo cho người dùng (Thành công / Thất bại).
   - Tuyệt đối **không** cập nhật trạng thái đơn hàng tại trang Return để tránh gian lận / thao túng client.

---

## 2. Cấu hình biến môi trường (Secrets qua Environment Variables)

Cấu hình thông tin Merchant VNPay Sandbox qua file `.env` hoặc biến môi trường hệ thống (không bao giờ commit thông tin nhạy cảm vào Git):

```ini
# .env
VNPAY_TMN_CODE=MADKTEST
VNPAY_HASH_SECRET=MADK_VNPAY_SECRET_KEY_FOR_LOCAL_TESTING_2026
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/checkout/vnpay-return
```

Hoặc theo chuẩn ASP.NET Core:
```ini
Vnpay__TmnCode=MADKTEST
Vnpay__HashSecret=MADK_VNPAY_SECRET_KEY_FOR_LOCAL_TESTING_2026
Vnpay__BaseUrl=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
Vnpay__ReturnUrl=http://localhost:5173/checkout/vnpay-return
```

---

## 3. Cách 1: Mô phỏng IPN trực tiếp không cần mạng ngoài (Khuyến nghị cho Local Dev)

Hệ thống đã tích hợp sẵn endpoint mô phỏng IPN an toàn `POST /api/v1/payments/vnpay/simulate-ipn`. Backend sẽ tự động sinh chữ ký HMAC-SHA512 chuẩn xác bằng secret key đang cấu hình và gọi luồng IPN thực thụ.

### Kịch bản A: Giả lập IPN thành công
```powershell
$body = @{
    orderNumber = "ORD-20261015-XXXX"
    amount = 500000
    isSuccess = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/payments/vnpay/simulate-ipn" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```
**Kết quả mong đợi:**
```json
{
  "rspCode": "00",
  "message": "Confirm Success"
}
```

### Kịch bản B: Thử gọi IPN lặp lại (Idempotency Test)
Chạy lại lệnh trên lần thứ 2 với cùng `orderNumber`:
**Kết quả mong đợi:**
```json
{
  "rspCode": "02",
  "message": "Order already confirmed"
}
```
Đơn hàng không bị cộng dồn, không bị gọi update lần hai.

### Kịch bản C: Thử số tiền không khớp (Amount Mismatch)
```powershell
$body = @{
    orderNumber = "ORD-20261015-XXXX"
    amount = 100000  # Số tiền sai lệch
    isSuccess = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/payments/vnpay/simulate-ipn" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```
**Kết quả mong đợi:**
```json
{
  "rspCode": "04",
  "message": "Invalid amount"
}
```

---

## 4. Cách 2: Mở đường hầm nhận IPN thật từ Cổng VNPay Sandbox

Nếu bạn muốn VNPay Sandbox gọi IPN trực tiếp vào máy dev của bạn:

### Lựa chọn A: Cloudflare Tunnel (Miễn phí, không cần tài khoản, rất ổn định)
1. Tải `cloudflared`:
   - Windows: `winget install Cloudflare.cloudflared` hoặc tải file `.exe` từ Cloudflare.
2. Mở terminal và chạy lệnh mở đường hầm tới port backend (ví dụ port 5000):
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
3. Cloudflare sẽ cấp một URL công khai dạng:
   `https://random-subdomain.trycloudflare.com`

4. Cập nhật IPN URL vào trang quản trị Merchant VNPay Sandbox hoặc truyền cấu hình:
   - URL IPN: `https://random-subdomain.trycloudflare.com/api/v1/payments/vnpay/ipn`

### Lựa chọn B: Ngrok
1. Chạy lệnh ngrok mở cổng backend:
   ```bash
   ngrok http 5000
   ```
2. Lấy URL dạng `https://xxxx.ngrok-free.app`.
3. URL IPN: `https://xxxx.ngrok-free.app/api/v1/payments/vnpay/ipn`.

---

## 5. Bảng tra cứu đối soát giao dịch (Bảng `payments`)

Mọi giao dịch thanh toán gửi qua IPN đều được lưu trữ đầy đủ trong bảng `payments`. Để xem lịch sử giao dịch và payload thô của một đơn hàng:

```http
GET /api/v1/payments/vnpay/orders/{orderNumber}/transactions
```
**Dữ liệu trả về:**
- `orderNumber`: Mã đơn hàng.
- `txnRef`: Mã tham chiếu giao dịch.
- `amount`: Số tiền thanh toán.
- `status`: `Success` / `Failed`.
- `bankCode`, `bankTranNo`, `cardType`.
- `rawPayload`: Toàn bộ JSON query string gốc do VNPay gửi tới phục vụ việc đối soát và thanh tra lỗi.
