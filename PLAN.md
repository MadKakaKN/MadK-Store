# Kế hoạch xây dựng & Cải tiến hệ thống MadK-Store (v2.5)

## 📌 Tổng quan dự án

- **Tên dự án:** MadK Store - Nền tảng thương mại điện tử chuyên đồ công nghệ & thời trang cá tính.
- **Kiến trúc:** Modular Monolith, Clean Architecture (Domain, Application, Infrastructure, API).
- **Backend:** ASP.NET Core 8, EF Core 8, PostgreSQL (Supabase), Redis/IMemoryCache, RabbitMQ/Channel Queue, WebSockets/Polling.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Three.js / React Three Fiber (3D Canvas).
- **Nguyên tắc vận hành:** Mọi cải tiến đều phải chạy được ngay, 0 lỗi build, có test đầy đủ, dữ liệu thực 100% từ database và tương thích triển khai Production (Render + Vercel).

---

## 🚀 TIẾN ĐỘ THỰC HIỆN CÁC HẠNG MỤC CẢI TIẾN BACKEND

### ✅ CÁC CẢI TIẾN ĐÃ HOÀN THÀNH (COMMITTED & DEPLOYED)

- [x] **Cải tiến 0.1: Tối ưu Connection Pooling Supabase PostgreSQL (53300 fix)**
  - Cấu hình `MaxPoolSize = 15` chống nghẽn slot kết nối Supabase Pooler.
  - Xóa bỏ cold-start & cache OutputCache 60s cho danh mục/sản phẩm.
  - Tích hợp tìm kiếm mờ dung lỗi chính tả `pg_trgm` + API search suggestions. *(Commit `06638d3`)*
- [x] **Cải tiến 0.2: Thu hồi Token tức thì & Dọn dẹp giỏ hàng định kỳ**
  - Instant Token Revocation qua `JwtBearerEvents` & `IMemoryCache`.
  - Background Worker `CartCleanupWorker` tự động dọn giỏ hàng vãng lai sau 30 ngày. *(Commit `e4cec55`, `b8a87a5`)*
- [x] **Cải tiến 1: Tự động hóa Webhook Ngân hàng VietQR (SePAY/Casso)**
  - Tự động nhận diện thanh toán Techcombank (19050430057012 - NGUYEN HOANG KHANG), trích xuất mã đơn `MK-...`.
  - Tự động đối soát số tiền, chuyển trạng thái đơn sang `Paid` & `Processing`.
  - Khách hàng trên trang `OrderSuccessPage.tsx` nhận diện thanh toán thành công tự động sau 1-2 giây. *(Commit `ff673eb`)*
- [x] **Cải tiến 2: Dịch vụ Thông báo Telegram Bot Tự Động**
  - Tự động bắn tin nhắn tới Admin: Đơn hàng mới (COD/VietQR), Tiền về tài khoản, Cảnh báo tồn kho thấp $\le 3$ chiếc.
  - Controller `AdminNotificationsController` kiểm tra trạng thái và test bot. *(Commit `ec9e31d`)*
- [x] **Cải tiến 3: Header HTTP Cache-Control 1 Năm cho Static Assets**
  - Cấu hình `Cache-Control: public, max-age=31536000, immutable` cho ảnh WebP và model 3D `.glb`.
  - Tự động khởi tạo thư mục `wwwroot` trên Docker/Render container. *(Commit `ec9e31d`)*
- [x] **Cải tiến 4: Thanh trừng 100% Mock Data Fallback ở Frontend**
  - Gỡ bỏ hoàn toàn việc fallback về dữ liệu mẫu trong `catalogApi.ts`, `adminCatalogApi.ts`, `adminInventoryApi.ts`.
  - Toàn bộ giao diện người dùng và quản trị kết nối 100% dữ liệu thực từ PostgreSQL. *(Commit `ec9e31d`)*

---

### 📋 DANH SÁCH CÁC HẠNG MỤC CẢI TIẾN TIẾP THEO (LÀM THEO THỨ TỰ)

Dưới đây là các hạng mục được chia nhỏ theo thứ tự ưu tiên từ cao xuống thấp để tiến hành lần lượt:

#### 🟢 HẠNG MỤC 1: XUẤT BÁO CÁO DOANH THU, ĐƠN HÀNG & TỒN KHO RA FILE EXCEL / CSV (Đã hoàn thành ✅)
> *Mục tiêu: Giúp Quản trị viên tải sổ sách, doanh thu, đơn hàng và bảng kiểm kho về máy tính chỉ với 1 cú click chuột.*
- [x] **1.1. Xây dựng dịch vụ Xuất file Excel / CSV (`IExcelExportService` & `ExcelExportService`)**
  - Hỗ trợ xuất dữ liệu dạng bảng với định dạng CSV UTF-8 có BOM (tương thích 100% Microsoft Excel, không bị lỗi font Tiếng Việt).
- [x] **1.2. API Xuất Báo cáo Doanh thu (`GET /api/v1/admin/reports/revenue/export`)**
  - Xuất bảng kê doanh thu theo ngày/tháng, số đơn thành công, doanh thu thực tế, tiền ship, chiết khấu.
- [x] **1.3. API Xuất Danh sách Đơn hàng Chi tiết (`GET /api/v1/admin/orders/export`)**
  - Xuất file danh sách đơn hàng có bộ lọc (theo khoảng ngày, trạng thái thanh toán, phương thức thanh toán).
  - Gồm: Mã đơn, Ngày tạo, Tên khách, SĐT, Địa chỉ giao hàng, Phương thức, Trạng thái, Tổng tiền.
- [x] **1.4. API Xuất Bảng Kiểm kê Tồn kho (`GET /api/v1/admin/inventory/export`)**
  - Xuất toàn bộ danh mục sản phẩm, biến thể (SKU, Tên sản phẩm, Màu/Size, Tồn thực tế OnHand, Tồn đang giữ Reserved, Tồn khả dụng, Giá vốn, Giá bán).
- [x] **1.5. Nút bấm Xuất File trên giao diện Admin Frontend**
  - Nút "Xuất Excel" trên trang `AdminReportsPage.tsx`.
  - Nút "Xuất danh sách đơn" trên `AdminOrdersPage.tsx`.
  - Nút "Xuất file tồn kho" trên `AdminInventoryPage.tsx`.

---

#### 🟢 HẠNG MỤC 2: HỆ THỐNG ĐÁNH GIÁ & XẾP HẠNG SAO SẢN PHẨM (Product Reviews & Ratings) (Đã hoàn thành ✅)
> *Mục tiêu: Tăng độ tin cậy và tỷ lệ chuyển đổi cho website bằng nhận xét thực tế từ người mua hàng.*
- [x] **2.1. Thiết kế thực thể `ProductReview` trong Domain Entity**
  - Trường: `Id`, `ProductId`, `UserId`, `OrderId`, `Rating` (1-5 sao), `Title`, `Comment`, `ImagesJson`, `IsVerifiedPurchase` (đã mua hàng thực tế), `Status` (Pending/Approved/Rejected), `CreatedAt`.
  - Quy tắc chống đánh giá ảo: Chỉ người dùng đã có đơn hàng thành công chứa sản phẩm đó mới được đánh giá có tick xanh Verified.
- [x] **2.2. API Đánh giá cho Khách hàng**
  - `GET /api/v1/products/{productId}/reviews`: Lấy danh sách đánh giá đã duyệt, phân trang, lọc theo số sao, tóm tắt tổng quan (% 5 sao, 4 sao, điểm trung bình).
  - `POST /api/v1/products/{productId}/reviews`: Khách hàng gửi đánh giá kèm chấm sao và nhận xét.
  - `POST /api/v1/products/reviews/{reviewId}/helpful`: Vote đánh giá hữu ích.
- [x] **2.3. API Kiểm duyệt Đánh giá cho Quản trị viên (Admin / Sales)**
  - `GET /api/v1/admin/reviews`: Xem toàn bộ đánh giá mới cần duyệt.
  - `PUT /api/v1/admin/reviews/{id}/status`: Duyệt (Approve) hoặc Ẩn/Từ chối (Reject) đánh giá rác/spam và gửi phản hồi chính thức từ cửa hàng.
  - `DELETE /api/v1/admin/reviews/{id}`: Xóa mềm đánh giá rác.
- [x] **2.4. Giao diện Đánh giá Frontend**
  - Tab "Đánh giá & Nhận xét" trên trang chi tiết sản phẩm `ProductDetailPage.tsx` với biểu đồ sao, lọc số sao, danh sách nhận xét, badge Verified Buyer, xem ảnh phóng to.
  - Modal gửi đánh giá từ trang lịch sử đơn hàng của khách `AccountOrdersPage.tsx` (`OrderCard.tsx`, `OrderDetailModal.tsx`).
  - Trang quản lý đánh giá `AdminReviewsPage.tsx` tích hợp sidebar menu và bộ lọc trạng thái.

---

#### 🟢 HẠNG MỤC 3: DANH SÁCH YÊU THÍCH (Wishlist Sync API) (Đã hoàn thành ✅)
> *Mục tiêu: Cho phép khách hàng lưu lại các món đồ muốn mua sau, tăng tỷ lệ quay lại của khách hàng.*
- [x] **3.1. Entity `WishlistItem` & Service backend**
  - `WishlistItem` (UserId, ProductId, CreatedAt) với chỉ mục và ràng buộc Unique chống trùng.
  - API `GET /api/v1/wishlist`: Lấy danh sách sản phẩm yêu thích của user.
  - API `GET /api/v1/wishlist/ids`: Lấy danh sách ProductId nhanh để render trái tim.
  - API `POST /api/v1/wishlist/{productId}`: Thêm vào yêu thích.
  - API `DELETE /api/v1/wishlist/{productId}`: Bỏ yêu thích.
  - API `POST /api/v1/wishlist/sync`: Đồng bộ từ giỏ yêu thích vãng lai (LocalStorage) vào tài khoản khi khách đăng nhập.
- [x] **3.2. Giao diện Frontend**
  - Nút Thả tim ❤️ trên thẻ sản phẩm `ProductCard.tsx` và trang chi tiết sản phẩm `ProductDetailPage.tsx`.
  - Icon Yêu thích ❤️ hiển thị số lượng trên thanh Header (desktop & mobile).
  - Tab "Sản phẩm yêu thích" trên trang tài khoản `/account?tab=wishlist` (`WishlistList.tsx`).

---

#### 🟢 HẠNG MỤC 4: HOÀN THIỆN CỔNG THANH TOÁN VÍ MOMO (MoMo QR Payment) (Đã hoàn thành ✅)
> *Mục tiêu: Bổ sung phương thức thanh toán ví điện tử MoMo bên cạnh VietQR và VNPay.*
- [x] **4.1. Tích hợp MoMo All-In-One (AIO) Gateway Service**
  - `IMomoService` & `MomoService`: Tạo payment link / QR code với chữ ký điện tử HMAC-SHA256 theo chuẩn tài liệu MoMo v2.
- [x] **4.2. API Tạo giao dịch MoMo (`POST /api/v1/payments/momo/create`)**
  - Nhận yêu cầu thanh toán đơn hàng, trả về PayUrl / Deeplink mở ứng dụng MoMo trên điện thoại hoặc mã QR trên máy tính.
- [x] **4.3. API Xử lý Webhook IPN MoMo (`POST /api/v1/payments/momo/ipn`)**
  - Kiểm tra chữ ký HMAC-SHA256 từ máy chủ MoMo.
  - Xử lý Idempotency, cập nhật đơn hàng thành `Paid`, commit trừ tồn kho an toàn, gửi thông báo Telegram & email.
- [x] **4.4. Trang kết quả & đối soát MoMo Return URL (`/checkout/momo-return`) & Frontend Checkout Integration**
  - Xác thực chữ ký phản hồi MoMo, giao diện thanh toán mượt mà trên Desktop và Mobile.

---

#### 🟢 HẠNG MỤC 5: TÍCH HỢP TỰ ĐỘNG ĐƠN VỊ VẬN CHUYỂN (GHN API) (Đã hoàn thành ✅)
> *Mục tiêu: Tính phí ship tự động chính xác theo địa chỉ và tạo mã bưu gửi sang bưu cục.*
- [x] **5.1. Dịch vụ Tích hợp API Giao Hàng Nhanh (`GhnShippingService`)**
  - Tra cứu mã Tỉnh/Huyện/Xã chuẩn GHN theo sổ địa chỉ của MadK (`/api/v1/shipping/ghn/provinces`, `/districts`, `/wards`).
  - Tính phí vận chuyển thực tế từ kho shop đến nhà khách với chính sách Freeship đơn hàng $\ge 1.000.000$đ.
- [x] **5.2. Tự động tạo mã vận đơn (AwbCode / Tracking Code)**
  - Quản trị viên/Kho tạo đơn vận chuyển GHN trên danh sách đơn hàng `AdminOrdersPage.tsx` hoặc `OrderDetailModal.tsx`.
  - Sinh mã vận đơn GHN, lấy link in phiếu gửi hàng khổ A5.
- [x] **5.3. Webhook cập nhật hành trình bưu phẩm & Tra cứu thời gian thực**
  - Webhook `POST /api/v1/shipping/ghn/webhook` nhận biến động trạng thái từ GHN (`delivering` -> Đang giao, `delivered` -> Hoàn tất & thanh toán COD tự động).
  - Modal tra cứu hành trình chi tiết thời gian thực `GhnTrackingModal.tsx` trên cả tài khoản khách hàng và quản trị viên.

---

#### 🟢 HẠNG MỤC 6: CHƯƠNG TRÌNH KHÁCH HÀNG THÂN THIẾT & TÍCH ĐIỂM (Loyalty Program)
> *Mục tiêu: Giữ chân khách hàng và khuyến khích quay lại mua sắm.*
- [ ] **6.1. Entity `LoyaltyPoint` & Lịch sử biến động điểm `PointTransaction`**
  - Tích 1% - 3% giá trị đơn hàng thành điểm thưởng khi đơn hoàn tất.
- [ ] **6.2. Sử dụng điểm lúc Checkout**
  - Khách có thể chọn dùng điểm thưởng tích lũy (ví dụ 10.000 điểm = 10.000đ) để trừ trực tiếp vào hóa đơn thanh toán.

---

## 🛠️ NGUYÊN TẮC THỰC HIỆN

1. Thực hiện lần lượt từng hạng mục theo danh sách (bắt đầu từ **Hạng mục 1**).
2. Viết Unit Test và kiểm tra build (0 Warning/Error) trước khi commit.
3. Cập nhật trạng thái `[x]` vào file `plan.md` sau khi hoàn thành mỗi task.
4. Đẩy mã nguồn lên Git Remote (`origin/main`) để CI/CD tự động deploy.
