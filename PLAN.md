# Kế hoạch xây dựng hệ thống web bán đồ công nghệ (v2)

## Tổng quan

- **Loại dự án:** Project cá nhân, làm một mình, bán thời gian.
- **Mục tiêu:** Web thương mại điện tử bán đồ công nghệ (tất cả nhóm hàng: điện thoại, laptop, phụ kiện, linh kiện...).
- **Nền tảng:** Web (responsive, ưu tiên trải nghiệm mobile).
- **Định hướng:** Bắt đầu gọn (modular monolith), thiết kế để mở rộng về sau.
- **Nguyên tắc:** Giai đoạn nào xong cũng phải chạy được và demo được.

## Tech stack

| Thành phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core 8, EF Core 8, Clean Architecture (Domain, Application, Infrastructure, API) |
| Database | PostgreSQL (JSONB cho thông số kỹ thuật, GIN index) |
| Cache | Redis (chỉ thêm khi cần) |
| Hàng đợi / job nền | RabbitMQ + worker hoặc Hangfire |
| Frontend | React 18 + TypeScript + Vite + TailwindCSS (hoặc Next.js nếu cần SEO tốt) |
| 3D | three.js qua React Three Fiber (`@react-three/fiber`) + `@react-three/drei`, model định dạng glTF/GLB (nén Draco/Meshopt, texture KTX2/WebP) |
| Lưu ảnh và model 3D | S3 hoặc MinIO (+ CDN) |
| Logging / giám sát | Serilog, health check endpoint, Sentry (hoặc tương đương) |
| Test | xUnit (unit + integration), Playwright (E2E) |
| Hạ tầng | Docker, Docker Compose, CI/CD, deploy VPS/cloud giá rẻ |

## Quyết định thiết kế chính

- **Category dạng cây** (ví dụ: Điện thoại, Laptop, Phụ kiện > Sạc, Tai nghe...).
- **Product và ProductVariant (SKU) tách riêng:** Product giữ thông tin chung; Variant giữ màu/cấu hình, giá, tồn kho.
- **Thông số kỹ thuật dùng JSONB:** mỗi category có một "schema thông số" riêng (laptop: RAM/CPU; tai nghe: kết nối/pin). Bộ lọc sinh ra từ schema này, thêm loại hàng mới không cần sửa code.
- **Order lưu snapshot:** tên, giá, thông số tại thời điểm mua để đơn cũ không bị sai khi sản phẩm đổi giá.
- **Server luôn tính lại giá:** không tin giá gửi từ client.
- **Tồn kho có 2 mức: tồn thực và tồn đang giữ (reserved).** Trừ kho an toàn bằng transaction và kiểm tra điều kiện trong một câu lệnh, hoặc optimistic concurrency.
- **Thanh toán online xử lý bằng webhook/IPN**, không chỉ dựa vào redirect; phải idempotent.
- **Giá có lịch sử và thời hạn:** giá gốc, giá khuyến mãi theo khoảng thời gian.
- **Backend stateless** (JWT, không lưu session trong RAM) để sau này chạy nhiều instance.
- **Phân quyền theo role/permission**, không chỉ cờ IsAdmin.
- **Không commit secrets** (key VNPay, mật khẩu DB); dùng biến môi trường / user-secrets.
- **UI 3D chỉ ở 3 chỗ:** trình xem sản phẩm trên trang chi tiết, hero trang chủ, trang "đặt hàng thành công" hoặc 404. Các trang còn lại (danh sách và lọc, giỏ hàng, checkout, tài khoản, quản trị, trang chính sách) giữ 2D. Nguyên tắc: 3D để "xem và thích", 2D để "tìm và mua".
- **3D chỉ là lớp trình bày thêm:** mọi nội dung quan trọng (tên, giá, mô tả, thông số) vẫn là HTML thường để phục vụ SEO và truy cập; luồng mua hàng không phụ thuộc vào 3D.
- **Model 3D là tùy chọn theo sản phẩm:** Product có trường đường dẫn model GLB (có thể rỗng). Sản phẩm không có model thì hiển thị ảnh thường. Chỉ 5-10 sản phẩm nổi bật có model.
- **Biến thể gắn với 3D:** màu của ProductVariant có thể ánh xạ sang vật liệu của model để đổi màu theo biến thể.
- **Luôn có fallback:** thiết bị yếu hoặc không hỗ trợ WebGL thì hiển thị ảnh tĩnh; có nút bật/tắt 3D.

## Actor và phân quyền

Về kỹ thuật chỉ dùng một bảng User kèm Role/Permission, không tách bảng riêng cho từng loại actor. Customer kế thừa quyền của Guest.

### Actor người dùng

| Actor | Mô tả | Chức năng chính |
|---|---|---|
| **Guest (khách vãng lai)** | Chưa đăng nhập | Xem và tìm sản phẩm, lọc, so sánh, thêm giỏ hàng, đăng ký, đăng nhập, quên mật khẩu |
| **Customer (khách hàng)** | Đã đăng nhập | Mọi thứ của Guest, cộng thêm: đặt hàng, thanh toán, quản lý hồ sơ và địa chỉ, theo dõi và hủy đơn, đánh giá sản phẩm, wishlist, yêu cầu đổi trả |
| **Admin (quản trị viên)** | Toàn quyền | Quản lý người dùng và phân quyền, cấu hình hệ thống, xem báo cáo toàn bộ, xem audit log |
| **Sales (nhân viên bán hàng)** | Xử lý đơn | Xác nhận và đổi trạng thái đơn, xử lý đổi trả và hoàn tiền, quản lý mã giảm giá, duyệt đánh giá |
| **Warehouse (nhân viên kho)** | Quản lý hàng | Nhập hàng, kiểm kho, điều chỉnh tồn kho, quản lý nhà cung cấp, đóng gói và bàn giao vận chuyển |

### Actor hệ thống bên ngoài

| Actor | Vai trò |
|---|---|
| **Cổng thanh toán (VNPay)** | Gửi kết quả thanh toán qua IPN/webhook, xử lý hoàn tiền |
| **Đơn vị vận chuyển (GHN/GHTK)** | Tính phí ship, nhận đơn, cập nhật trạng thái giao hàng |
| **Dịch vụ email/SMS** | Gửi xác nhận email, đặt lại mật khẩu, thông báo đơn |

### Actor thời gian

| Actor | Vai trò |
|---|---|
| **Scheduler (job nền)** | Tự hủy đơn quá hạn thanh toán và hoàn kho, gửi email qua hàng đợi, cảnh báo sắp hết hàng |

### Ma trận quyền theo module (tham khảo)

| Module | Guest | Customer | Sales | Warehouse | Admin |
|---|---|---|---|---|---|
| Xem catalog, tìm kiếm | ✔ | ✔ | ✔ | ✔ | ✔ |
| Giỏ hàng | ✔ | ✔ | | | |
| Đặt hàng, thanh toán | | ✔ | | | |
| Xem đơn của mình | | ✔ | | | |
| Quản lý đơn hàng | | | ✔ | | ✔ |
| Đổi trả, hoàn tiền | | yêu cầu | xử lý | | ✔ |
| Mã giảm giá | | | ✔ | | ✔ |
| Quản lý sản phẩm, giá | | | | | ✔ |
| Tồn kho, nhập hàng, nhà cung cấp | | | | ✔ | ✔ |
| Người dùng, phân quyền, audit log | | | | | ✔ |
| Báo cáo | | | doanh thu | tồn kho | toàn bộ |

Ghi chú: ma trận này là điểm xuất phát, điều chỉnh khi làm đến Giai đoạn 3. Mọi kiểm tra quyền thực hiện ở server, không chỉ ẩn nút trên giao diện.

---

## Giai đoạn 0: Chuẩn bị (1 tuần)

**Phân tích và thiết kế**
- [x] Chốt phạm vi MVP: catalog, giỏ hàng, đặt hàng COD, trang quản trị
- [x] Chốt danh sách actor và ma trận quyền (xem mục "Actor và phân quyền")
- [x] Viết user story ngắn cho từng actor chính (Customer, Sales, Warehouse, Admin)
- [x] Vẽ sơ đồ trạng thái đơn hàng
- [ ] Vẽ wireframe (giấy hoặc Figma) cho các trang chính, gồm cả bản mobile
- [x] Chốt phạm vi 3D (3 chỗ: chi tiết sản phẩm, hero trang chủ, đặt hàng thành công/404) và chọn React Three Fiber
- [ ] Chọn 5-10 sản phẩm nổi bật sẽ có model 3D; tìm nguồn model (Sketchfab, Poly Pizza hoặc tự làm bằng Blender) và kiểm tra giấy phép
- [x] Vẽ ERD sơ bộ và danh sách API

**Hạ tầng**
- [x] Dựng repo, cấu trúc Clean Architecture
- [x] Docker Compose (API, PostgreSQL, Redis)
- [x] Tách cấu hình dev / staging / prod, quản lý secrets
- [x] CI cơ bản (build + test)
- [x] Logging (Serilog) và health check endpoint

**Kết quả:** `docker compose up` là chạy được.

## Giai đoạn 1: Catalog (1-2 tuần)

**Database**
- [x] Category (dạng cây), Brand
- [x] Product, ProductVariant (SKU, giá, tồn kho), ProductImage
- [x] Bảng schema thông số theo category (JSONB)
- [x] Slug thân thiện cho category và product
- [x] Trường đường dẫn model 3D (GLB, có thể rỗng) cho Product; ảnh thường vẫn là mặc định
- [x] Index cho cột lọc/sắp xếp, GIN index cho JSONB và full-text

**Backend**
- [x] API danh sách có phân trang
- [x] Lọc theo category / brand / giá / thông số kỹ thuật
- [x] Sắp xếp
- [x] Tìm kiếm full-text của PostgreSQL
- [x] API chi tiết sản phẩm
- [x] Tránh N+1 query (kiểm tra bằng log SQL)

**Frontend**
- [x] Trang chủ
- [x] Trang danh mục có bộ lọc
- [x] Trang chi tiết với chọn biến thể
- [x] Giao diện responsive trên mobile

**Dữ liệu mẫu**
- [x] Seed 50-100 sản phẩm đa dạng (điện thoại, laptop, phụ kiện, linh kiện) để test bộ lọc

**Kết quả:** duyệt và tìm được sản phẩm.

## Giai đoạn 2: Tài khoản và mua hàng (2-3 tuần)

**Tài khoản & Xác thực (Identity Backend - Phase 2.1)**
- [x] Đăng ký, đăng nhập (JWT + refresh token xoay vòng)
- [x] Xác thực email (token có hạn, gửi qua IEmailSender giả lập)
- [x] Quên mật khẩu / đặt lại mật khẩu (token có hạn, dùng một lần)
- [x] Rate limiting cho đăng nhập và đặt lại mật khẩu, khóa tạm tài khoản khi thử sai 5 lần (brute-force defense)
- [x] Role Customer mặc định, thiết kế schema RBAC mở rộng (User, Role, Permission, UserRole, RolePermission, RefreshToken)
- [x] Sổ địa chỉ với địa chỉ Việt Nam dạng chọn: tỉnh, quận/huyện, phường/xã (Backend & Frontend, chống IDOR, seed 63 tỉnh/thành)

**Giao diện Tài khoản & Xác thực (Frontend Auth & Account - Phase 2.2)**
- [x] Trang đăng ký (`/auth/register`), đăng nhập (`/auth/login`), quên mật khẩu (`/auth/forgot-password`), đặt lại mật khẩu (`/auth/reset-password`), xác thực email (`/auth/verify-email`), hồ sơ cá nhân (`/account`)
- [x] Lưu token an toàn (`localStorage`), tự động làm mới token ngầm (silent refresh qua interceptor khi 401) không làm gián đoạn người dùng
- [x] Route guard: `ProtectedRoute` (bảo vệ `/account`, lưu redirect URL), `GuestRoute` (chặn người đã đăng nhập vào trang auth)
- [x] Form validation phía client (email, độ dài mật khẩu, xác nhận mật khẩu, tên), hiển thị lỗi trường & lỗi server rõ ràng

**Giỏ hàng và đơn hàng**
- [x] Giỏ hàng (lưu DB cho người đã đăng nhập; localStorage hoặc Redis cho khách)
- [x] Checkout COD
- [x] Tạo đơn với snapshot tên, giá, thông số
- [x] Trừ tồn kho an toàn khi đặt hàng
- [x] Trạng thái đơn: Mới, Xác nhận, Đang giao, Hoàn tất, Hủy (hủy thì hoàn kho)
- [x] Trang "Đơn hàng của tôi", kiểm tra quyền sở hữu đơn (chống IDOR)

**Kết quả:** mua hàng trọn vòng đời đơn.

## Giai đoạn 3: Trang quản trị (2 tuần)

**Quản lý dữ liệu**
- [ ] CRUD sản phẩm, biến thể, danh mục, thương hiệu
- [ ] Upload ảnh (S3 hoặc MinIO), resize và nén ảnh
- [ ] Quản lý giá: lịch sử giá, giá khuyến mãi có thời hạn

**Vận hành**
- [ ] Quản lý đơn hàng, đổi trạng thái
- [ ] Quản lý tồn kho, lịch sử nhập/xuất
- [ ] Nhà cung cấp, phiếu nhập hàng, giá vốn

**Phân quyền và an toàn**
- [x] Phân quyền theo role/permission cho Admin, Sales, Warehouse (theo ma trận quyền), kiểm tra ở server
- [x] Audit log cho thao tác của admin (ai sửa gì, khi nào)

**Dashboard**
- [ ] Doanh thu, lợi nhuận gộp, đơn theo ngày, sản phẩm bán chạy, cảnh báo sắp hết hàng

**Kết quả:** vận hành shop mà không cần chạm vào DB.

## Giai đoạn 4: Thanh toán và tăng trải nghiệm (2-3 tuần)

**Thanh toán**
- [x] VNPay sandbox, xử lý bằng IPN/webhook, idempotent
- [x] Giữ tồn kho tạm khi chờ thanh toán; quá hạn thì job nền tự hủy đơn và hoàn kho
- [x] Hủy đơn đã thanh toán và hoàn tiền (có thể mô phỏng)
- [x] Quy trình đổi trả / trả hàng cơ bản

**Khuyến mãi và vận chuyển**
- [x] Mã giảm giá
- [x] Phí vận chuyển (mock hoặc GHN sandbox)

**Thông báo**
- [x] Email xác nhận đơn gửi qua hàng đợi (RabbitMQ + worker hoặc Hangfire)

**Kết quả:** luồng thanh toán online hoàn chỉnh và an toàn khi có sự cố.

## Giai đoạn 5: Hoàn thiện và deploy (1-2 tuần)

**UI 3D (chỉ làm sau khi luồng mua hàng đã chạy ổn)**
- [x] Cài `three`, `@react-three/fiber`, `@react-three/drei`
- [x] Trình xem sản phẩm 3D trên trang chi tiết: xoay, zoom, đổi màu theo biến thể (5-10 sản phẩm nổi bật)
- [x] Hero 3D trang chủ (vật thể xoay nhẹ hoặc phản ứng theo chuột/cuộn trang)
- [x] Hiệu ứng 3D nhẹ ở trang "đặt hàng thành công" hoặc 404
- [x] Nén model (Draco/Meshopt), texture KTX2/WebP; mỗi model khoảng vài trăm KB đến 2-3 MB
- [x] Lazy load model và canvas để không làm chậm tải trang
- [x] Tối ưu cho mobile: giới hạn pixel ratio, ít đèn, ít polygon
- [x] Fallback ảnh tĩnh khi không hỗ trợ WebGL hoặc thiết bị yếu; nút bật/tắt 3D
- [x] Đảm bảo thông tin sản phẩm vẫn là HTML thường (SEO, truy cập)

**SEO**
- [x] Meta tag, sitemap, robots.txt
- [x] Dữ liệu có cấu trúc schema.org Product
- [x] Trang chính sách: bảo hành, đổi trả, vận chuyển, bảo mật

**Hiệu năng và chất lượng**
- [x] Rà soát index, kiểm tra truy vấn chậm
- [x] CDN cho ảnh (headers Cache-Control 1y immutable & tài liệu Cloudflare)
- [x] Load test vài kịch bản chính (xem danh sách, tìm kiếm, đặt hàng)
- [x] Test E2E (Playwright) cho luồng: tìm sản phẩm, thêm giỏ, đặt hàng

**Vận hành**
- [x] Cấu hình deploy lên VPS/cloud, có HTTPS (Nginx reverse proxy, docker-compose.prod.yml)
- [x] Backup database tự động và thử khôi phục
- [x] Theo dõi lỗi (Sentry) và giám sát cơ bản
- [x] Rà soát bảo mật theo OWASP Top 10 (CORS, mass assignment, IDOR, XSS, SQL injection)

**Kết quả:** có link demo chạy ổn định, sẵn sàng đưa vào portfolio.

## Giai đoạn 6: Mở rộng (chọn theo hứng thú)

- [ ] Đánh giá và hỏi đáp sản phẩm
- [ ] So sánh sản phẩm, wishlist
- [ ] Bảo hành theo serial/IMEI
- [ ] Thu cũ đổi mới
- [ ] Flash sale
- [ ] Tìm kiếm nâng cao bằng Meilisearch
- [ ] Cache bằng Redis
- [ ] Chatbot tư vấn cấu hình dựa trên dữ liệu sản phẩm
- [ ] Chuyển storefront sang Next.js (SSR) nếu cần SEO tốt hơn

## Xuyên suốt mọi giai đoạn

**Test**
- Unit test cho nghiệp vụ lõi: tồn kho, tính giá, chuyển trạng thái đơn, xử lý webhook
- Integration test cho luồng đặt hàng và thanh toán

**Bảo mật**
- Băm mật khẩu bằng BCrypt
- Validate đầu vào ở server
- Phân quyền theo role/permission
- Luôn tính lại giá ở server
- Không commit secrets

**Tài liệu**
- README rõ ràng, Swagger, ảnh chụp màn hình (có giá trị cho portfolio)
- Ghi lại các quyết định thiết kế quan trọng

**Quy trình làm việc**
- Commit nhỏ, có ý nghĩa; mỗi giai đoạn một nhánh hoặc một tag
- Làm xong giai đoạn nào thì demo và tick checklist trước khi sang giai đoạn tiếp

## Rủi ro cần canh

- **Làm quá nhiều tính năng mà không xong luồng chính:** hoàn thành giai đoạn 1-3 trước khi nghĩ đến giai đoạn 6.
- **Thiết kế thông số sản phẩm quá cứng** (mỗi loại một bảng): dùng JSONB và schema theo category.
- **Quên snapshot đơn hàng:** đơn cũ sẽ sai khi đổi giá.
- **Trừ tồn kho không an toàn:** có thể bán vượt số lượng khi nhiều người đặt cùng lúc.
- **Không giữ/hoàn tồn kho khi thanh toán lỗi hoặc quá hạn:** hàng bị "kẹt" trong các đơn treo.
- **Xử lý thanh toán chỉ dựa vào redirect:** mất đơn khi người dùng đóng tab giữa chừng.
- **Lộ secrets hoặc thiếu backup** khi đưa lên server thật.
- **Sa đà vào 3D trước khi xong luồng bán hàng:** chỉ làm 3D sau khi giai đoạn 1-4 chạy được; nếu hết thời gian vẫn có một shop hoàn chỉnh.
- **Thiếu model 3D hoặc model quá nặng:** giới hạn 5-10 sản phẩm nổi bật, nén model, lazy load; kiểm tra giấy phép model.
- **3D chạy chậm trên mobile hoặc máy yếu:** luôn có fallback ảnh tĩnh và nút tắt 3D.
- **Nội dung chỉ nằm trong canvas 3D:** công cụ tìm kiếm không đọc được; thông tin quan trọng phải là HTML thường.

## Ước lượng

Khoảng 3-4 tháng cho giai đoạn 0-5 nếu làm đều; phần UI 3D ở Giai đoạn 5 có thể cần thêm 1-2 tuần tùy số model (chỉ mang tính tham khảo). Giai đoạn 6 làm dần theo thời gian.

## Gợi ý khi làm việc với AI agent (Antigravity)

- Giao từng giai đoạn một, ví dụ: "Làm Giai đoạn 1 theo PLAN.md".
- Yêu cầu agent tick checklist và liệt kê những gì đã làm sau mỗi lần xong.
- Review code các phần nhạy cảm (tồn kho, thanh toán, phân quyền) kỹ hơn phần còn lại.