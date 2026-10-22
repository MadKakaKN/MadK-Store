# Sổ tay Vận hành & Bảo mật Hạ tầng (Operations Manual) - MadK Store

Tài liệu này hướng dẫn chi tiết quy trình triển khai, bảo mật, sao lưu dự phòng, giám sát và xử lý sự cố cho hệ thống **MadK Store** trên môi trường Staging và Production (VPS/Cloud).

---

## 1. Kiến trúc Triển khai Hạ tầng (Deployment Architecture)

```
                            [ Client / Internet ]
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    Nginx Reverse Proxy        │
                      │  - Let's Encrypt HTTPS (443)  │
                      │  - HTTP/2 & Gzip/Brotli       │
                      │  - OWASP Security Headers     │
                      │  - Rate Limiting (30r/s)      │
                      └───────────────┬───────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌────────────────────────┐                             ┌────────────────────────┐
│  Frontend Container    │                             │    Backend API         │
│  - Nginx Alpine        │                             │  - .NET 8 Web API      │
│  - SPA Routing         │                             │  - Port 8080 (internal)│
│  - 1Y Cache for Assets │                             │  - Rate Limiting Engine│
└────────────────────────┘                             └───────────┬────────────┘
                                                                   │
                                     ┌─────────────────────────────┼─────────────────────────────┐
                                     ▼                             ▼                             ▼
                          ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
                          │   PostgreSQL 16      │      │       Redis 7        │      │    RabbitMQ 3        │
                          │ - Persistent Volume  │      │ - In-memory Cache    │      │ - Email Queue Worker │
                          │ - Automated Backup   │      │ - Cart & Lock Engine │      │ - Message Resilience │
                          └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

---

## 2. Hướng dẫn Triển khai VPS / Cloud với HTTPS

### Bước 2.1: Chuẩn bị máy chủ VPS (Ubuntu 22.04 / 24.04 LTS)
1. Cập nhật hệ thống và cài đặt Docker + Docker Compose:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl git ufw
   curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```
2. Cấu hình tường lửa UFW:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP (Let's Encrypt Challenge)
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

### Bước 2.2: Cấp chứng chỉ SSL/TLS miễn phí với Let's Encrypt Certbot
1. Trỏ bản ghi DNS:
   * `madk.store` -> IP VPS
   * `www.madk.store` -> IP VPS
   * `staging.madk.store` -> IP VPS
2. Chạy certbot cấp chứng chỉ qua webroot:
   ```bash
   mkdir -p /opt/madk-store/certbot/conf /opt/madk-store/certbot/www
   docker run -it --rm --name certbot \
     -v /opt/madk-store/certbot/conf:/etc/letsencrypt \
     -v /opt/madk-store/certbot/www:/var/www/certbot \
     certbot/certbot certonly --webroot -w /var/www/certbot \
     -d madk.store -d www.madk.store -d staging.madk.store \
     --email admin@madk.store --agree-tos --no-eff-email
   ```

### Bước 2.3: Quản lý Biến Môi trường & Secrets (.env)
> [!IMPORTANT]
> Tuyệt đối KHÔNG commit file `.env` vào Git. Trên máy chủ, tạo file `.env` từ mẫu `.env.example`:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Các biến môi trường bắt buộc:
* `POSTGRES_PASSWORD`: Mật khẩu cơ sở dữ liệu ngẫu nhiên mạnh (tối thiểu 32 ký tự alphanumeric).
* `REDIS_PASSWORD`: Khóa truy cập Redis server.
* `JWT_SECRET_KEY`: Khóa ký token JWT (tối thiểu 64 ký tự).
* `VNPAY_TMN_CODE` & `VNPAY_HASH_SECRET`: Thông tin cổng thanh toán VNPay thật từ Merchant Dashboard.
* `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`: Thông tin gửi mail transactional.
* `SENTRY_DSN`: Đường dẫn DSN giám sát crash report từ Sentry.io.

---

## 3. Phân tách Môi trường Staging và Production

| Tiêu chí | Môi trường Staging | Môi trường Production |
| :--- | :--- | :--- |
| **Domain** | `https://staging.madk.store` | `https://madk.store` |
| **Docker Compose** | `docker-compose.staging.yml` | `docker-compose.prod.yml` |
| **Database** | `madkstore_staging` | `madkstore_prod` |
| **Thanh toán** | VNPay Sandbox (NCB demo) | VNPay Production Gateway |
| **Email** | Mailpit Mock Web UI (Port 8025) | SMTP Server thật (SendGrid / AWS SES) |
| **Logging** | Debug / Information | Warning / Error + Sentry |
| **Mục đích** | Kiểm thử QA, test luồng người dùng cuối | Khách hàng thực tế giao dịch |

### Lệnh chạy Staging:
```bash
docker compose -f docker-compose.staging.yml up -d --build
```

### Lệnh chạy Production:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 4. Tự động hóa Triển khai (Automated Deployment & CI/CD)

Hệ thống đã được trang bị bộ công cụ tự động hóa toàn diện từ máy cục bộ, GitHub đến VPS:

### 4.1. Tự động thiết lập VPS lần đầu bằng 1 lệnh duy nhất (`setup-vps.sh`)
Trên máy chủ VPS mới, chỉ cần chạy script tự động:
```bash
chmod +x scripts/setup-vps.sh
sudo ./scripts/setup-vps.sh --domain ten-mien-cua-ban.com --email admin@ten-mien-cua-ban.com
```
*Script sẽ tự động: cập nhật Ubuntu, cài Docker & Compose, cấu hình firewall UFW, sinh mật khẩu ngẫu nhiên cho `.env`, cấp SSL Let's Encrypt và khởi chạy toàn bộ website.*

### 4.2. Triển khai tự động từ máy tính Windows (`deploy-to-vps.ps1`)
Từ PowerShell trên máy tính cá nhân của bạn:
```powershell
.\scripts\deploy-to-vps.ps1 -VpsIp "IP_VPS" -Domain "madk.store" -Email "admin@madk.store"
```

### 4.3. Tự động cập nhật qua GitHub Actions CI/CD (Zero-Touch Git Push)
Workflow [`.github/workflows/cd.yml`](file:///c:/Users/ADMIN/Downloads/MadK-Store/.github/workflows/cd.yml) đã được cấu hình sẵn:
1. Thêm 2 secret vào GitHub Repository (**Settings -> Secrets and variables -> Actions**):
   * `VPS_HOST`: Địa chỉ IP máy chủ VPS.
   * `VPS_SSH_KEY`: Khóa SSH riêng tư (`id_rsa` hoặc `id_ed25519`) để SSH vào VPS.
2. Mỗi khi bạn gõ:
   ```bash
   git push origin main
   ```
   GitHub Actions sẽ tự động: Chạy test xUnit -> Chạy Playwright E2E -> Kết nối SSH vào VPS -> Gọi [`scripts/deploy.sh`](file:///c:/Users/ADMIN/Downloads/MadK-Store/scripts/deploy.sh) -> Cập nhật website không gián đoạn -> Kiểm tra `/health` và **tự động hoàn tác (Auto-Rollback) nếu phát hiện lỗi**.

### 4.4. Quy trình Cập nhật thủ công không gián đoạn (Zero-downtime Rolling Update)
```bash
# Chạy script cập nhật tự động có sẵn trên VPS:
./scripts/deploy.sh
```

### 4.2. Quy trình Rollback khẩn cấp khi phát sinh sự cố
Nếu phiên bản mới phát sinh lỗi nghiêm trọng sau khi triển khai:
```bash
# 1. Quay về commit / tag ổn định trước đó
git checkout <previous-stable-tag>

# 2. Khởi động lại dịch vụ với phiên bản cũ
docker compose -f docker-compose.prod.yml up -d --build

# 3. Nếu có Migration DB cần hoàn tác:
# Xem lịch sử migration và chạy lệnh rollback
docker exec -it madk-api dotnet ef database update <PreviousMigrationName>

# 4. Xác nhận hệ thống xanh trở lại
curl -f https://madk.store/health
```

---

## 5. Quy trình Sao lưu Tự động & Khôi phục Cơ sở dữ liệu (Backup & DR)

### 5.1. Cơ chế Sao lưu Tự động
Service `db-backup` trong `docker-compose.prod.yml` chạy ngầm định kỳ **02:00 AM mỗi ngày** thông qua cronjob container:
* Lệnh sao lưu: [`scripts/backup-db.sh`](file:///c:/Users/ADMIN/Downloads/MadK-Store/scripts/backup-db.sh)
* Dữ liệu được nén dạng `madkstore_prod_YYYYMMDD_HHMMSS.sql.gz`.
* Lưu trữ tại thư mục persistent `/backups/postgresql`.
* Tự động dọn dẹp (retention policy) các bản lưu cũ hơn **30 ngày**.

### 5.2. Chạy sao lưu thủ công tức thời
* Trên Linux / Docker:
  ```bash
  docker exec -t madk-postgres pg_dump -U madkstore -d madkstore_prod --clean --if-exists | gzip > ./backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz
  ```
* Trên Windows (PowerShell):
  ```powershell
  .\scripts\backup-db.ps1 -DbName "madkstore_prod"
  ```

### 5.3. Quy trình Khôi phục Cơ sở dữ liệu (Disaster Recovery)
Khi cần khôi phục dữ liệu từ một bản backup:
* Trên Linux:
  ```bash
  ./scripts/restore-db.sh /backups/postgresql/madkstore_prod_20261022_020000.sql.gz madkstore_prod
  ```
* Trên Windows:
  ```powershell
  .\scripts\restore-db.ps1 -BackupFile "backups\madkstore_prod_20261022_020000.sql" -TargetDb "madkstore_prod"
  ```

> [!NOTE]
> Quy trình sao lưu và khôi phục đã được kiểm thử tự động thành công 100% bằng script [`scripts/test-backup-restore.ps1`](file:///c:/Users/ADMIN/Downloads/MadK-Store/scripts/test-backup-restore.ps1).

---

## 6. Giám sát & Báo cáo Lỗi (Monitoring & Telemetry)

1. **Endpoint Giám sát Tình trạng (Health Check API):**
   * URL: `GET /health`
   * Kiểm tra liên tục độ trễ và khả năng kết nối tới PostgreSQL và Redis.
   * Định dạng trả về: JSON chuẩn RFC, mã trạng thái HTTP 200 (Healthy) hoặc 503 (Unhealthy).
2. **Crash Reporting với Sentry:**
   * **Backend:** Cấu hình qua mục `Sentry:Dsn` trong `appsettings.json` hoặc biến môi trường `SENTRY_DSN`. Tự động chụp stack trace khi xảy ra Exception chưa được xử lý tại `GlobalExceptionMiddleware`.
   * **Frontend:** Tích hợp module [`frontend/src/utils/monitoring.ts`](file:///c:/Users/ADMIN/Downloads/MadK-Store/frontend/src/utils/monitoring.ts), tự động bắt lỗi `unhandledrejection` và window error để chuyển về Sentry Dashboard.
3. **Structured Logging (Serilog):**
   * Toàn bộ request có gắn `CorrelationId` và `TraceId` giúp truy vết nguyên nhân gốc rễ xuyên suốt giữa Client và Server.

---

## 7. Báo cáo Rà soát Bảo mật OWASP Top 10

| Hạng mục OWASP | Rủi ro tiềm ẩn | Hiện trạng & Giải pháp đã thực hiện | Trạng thái |
| :--- | :--- | :--- | :---: |
| **A01: Broken Access Control (IDOR)** | Người dùng xem/sửa đơn hàng, sổ địa chỉ, yêu cầu đổi trả của người khác | • Kiểm tra quyền sở hữu `userId` trong `AddressesController`, `OrdersController`, `ReturnsController`. Nếu không khớp, trả về `403 Forbidden`.<br>• Đã phát hiện và bổ sung `[Authorize(Roles = "Admin")]` cho endpoint `POST /api/v1/orders/process-expired`. | **ĐÃ SỬA & BẢO VỆ** |
| **A02: Cryptographic Failures** | Lộ khóa bí mật, token giải mã yếu | • Token JWT ký bằng HMAC-SHA256 với khóa 512-bit.<br>• VNPay IPN kiểm tra chữ ký HMAC-SHA512 nghiêm ngặt.<br>• Secrets tách biệt hoàn toàn khỏi Git (.gitignore bảo vệ `.env`). | **ĐẠT** |
| **A03: Injection (SQL / Command)** | Tấn công chèn mã SQL qua tham số tìm kiếm, cập nhật tồn kho | • 100% truy vấn Catalog/Order dùng LINQ Entity Framework Core parameterized query.<br>• Các thao tác cập nhật nguyên tử tồn kho dùng `ExecuteSqlInterpolatedAsync` với FormattableString chuẩn hóa `@p0, @p1`. | **ĐẠT** |
| **A04: Insecure Design & Rate Limiting** | Spam đơn hàng làm cạn kiệt tồn kho, vét voucher, brute-force đăng nhập | • Bổ sung middleware `RateLimiter` đa tầng:<br>  - `auth-login`: 10 req/phút/IP<br>  - `auth-reset-password`: 5 req/5 phút/IP<br>  - `order-checkout`: 15 req/phút/IP<br>  - `payment-ipn`: 30 req/phút/IP<br>  - `general-api`: 120 req/phút/IP<br>• Khóa chống bấm đúp qua `Idempotency-Key`. | **ĐÃ BỔ SUNG** |
| **A05: Security Misconfiguration** | Thiếu header bảo mật trình duyệt, lộ thông tin server | • Tạo mới `SecurityHeadersMiddleware.cs` tự động thêm:<br>  - `X-Content-Type-Options: nosniff`<br>  - `X-Frame-Options: DENY`<br>  - `X-XSS-Protection: 0`<br>  - `Referrer-Policy: strict-origin-when-cross-origin`<br>  - `Permissions-Policy`<br>  - `Content-Security-Policy (CSP)`<br>  - `Strict-Transport-Security (HSTS)`<br>  - Xóa bỏ header `Server` và `X-Powered-By`. | **ĐÃ BỔ SUNG** |
| **A06: Vulnerable and Outdated Components** | Thư viện bên thứ ba chứa lỗ hổng | • Đã quét `npm audit` và `dotnet list package --vulnerable`, không có lỗ hổng mức độ High hay Critical. | **ĐẠT** |
| **A07: Identification and Authentication Failures** | Đăng nhập lặp, session hijacking | • Token JWT có thời hạn ngắn (60 phút), Refresh Token xoay vòng (Rotation) và thu hồi khi đăng xuất.<br>• Mật khẩu mã hóa bằng thuật toán băm an toàn ASP.NET Core Identity (PBKDF2-SHA256). | **ĐẠT** |
| **A08: Software and Data Integrity Failures** | Sửa giá sản phẩm ở client (Price Tampering) | • Server hoàn toàn bỏ qua mọi giá trị giá tiền client gửi lên, luôn truy vấn giá chuẩn xác và tính toán từ Database. Đã có widget kiểm thử tính toàn vẹn tại trang Giỏ hàng. | **ĐẠT** |
| **A09: Security Logging and Monitoring Failures** | Không phát hiện được tấn công hoặc lỗi ngầm | • Cấu hình Serilog ghi log xoay vòng hàng ngày với Correlation ID.<br>• Tích hợp module giám sát Sentry cho cả Backend và Frontend. | **ĐÃ BỔ SUNG** |
| **A10: Server-Side Request Forgery (SSRF)** | Lạm dụng webhook hoặc gọi URL ngoài | • Các webhook thanh toán (VNPay IPN) chỉ tiếp nhận từ IP gateway được kiểm chứng, kiểm tra checksum toàn bộ payload trước khi xử lý. | **ĐẠT** |

---

## 8. Danh sách Checklist Trước khi Bàn giao (Production Go-Live Checklist)

- [x] Không có bất kỳ file chứa secrets (.env, chứng chỉ SSL, khóa riêng tư) trong Git repository.
- [x] Tất cả các cổng nội bộ (PostgreSQL 5432, Redis 6379, RabbitMQ 5672) được cô lập trong Docker network, không expose ra internet.
- [x] Nginx Reverse Proxy đã cấu hình SSL/TLS với chuẩn bảo mật cao nhất và chuyển hướng toàn bộ HTTP sang HTTPS.
- [x] Quy trình sao lưu tự động và khôi phục khẩn cấp đã được kiểm thử thành công.
- [x] Security headers và Rate limiting được áp dụng trên mọi API endpoints.
- [x] Endpoint kiểm tra sức khỏe `/health` hoạt động ổn định.
