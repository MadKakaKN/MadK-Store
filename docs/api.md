# Đặc tả Danh mục API - MadK Store

Tài liệu này đặc tả toàn bộ các RESTful API endpoints của hệ thống **MadK Store**, bao phủ tất cả chức năng từ **Giai đoạn 1 đến Giai đoạn 4** theo [PLAN.md](file:///c:/Users/ADMIN/Downloads/MadK-Store/PLAN.md) và mô hình dữ liệu tại [docs/erd.md](file:///c:/Users/ADMIN/Downloads/MadK-Store/docs/erd.md).

---

## 1. Nguyên tắc thiết kế API

- **Định dạng dữ liệu:** JSON cho toàn bộ Request & Response (`Content-Type: application/json`).
- **Phân trang (Pagination):** Chuẩn thống nhất:
  - Query params: `page` (default: 1), `pageSize` (default: 20, max: 100).
  - Response bọc dạng: `{ "items": [...], "page": 1, "pageSize": 20, "totalItems": 150, "totalPages": 8 }`.
- **Cấu trúc phản hồi chuẩn (Result Envelope):**
  - Thành công: `{ "isSuccess": true, "data": { ... }, "message": null }`
  - Thất bại: `{ "isSuccess": false, "data": null, "error": "Mã hoặc thông báo lỗi" }`
- **Xác thực & Phân quyền:** Header `Authorization: Bearer <jwt_token>`. Kiểm tra phân quyền ở server theo ma trận quyền; kiểm tra quyền sở hữu đơn hàng / giỏ hàng để chống **IDOR**.
- **An toàn tính giá & Đặt hàng:** Server luôn tính lại giá trị sản phẩm, biến thể, voucher và phí ship; không tin giá client gửi lên.

---

## 2. Danh mục Endpoints theo Phân hệ

### 2.1. Module Xác thực & Tài khoản (`/api/v1/auth`, `/api/v1/users`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Guest | Đăng ký tài khoản mới | `email`, `password`, `fullName`, `phoneNumber` | `userId`, `email`, `message` | 400 (Email đã tồn tại / Mật khẩu yếu) |
| `POST` | `/api/v1/auth/login` | Guest | Đăng nhập lấy token | `email`, `password` | `accessToken`, `refreshToken`, `expiresIn`, `user` (id, fullName, roles) | 400, 401 (Sai tài khoản/mật khẩu), 429 (Rate limit) |
| `POST` | `/api/v1/auth/refresh-token`| All Users | Đổi token hết hạn (xoay vòng, phát hiện tái sử dụng) | `refreshToken` | `accessToken`, `refreshToken`, `expiresIn`, `user` | 400, 401 (Token không hợp lệ/hết hạn/tái sử dụng trái phép) |
| `POST` | `/api/v1/auth/logout` | Authenticated / All | Đăng xuất và thu hồi refresh token | `refreshToken` (optional) | `message` | Không |
| `POST` | `/api/v1/auth/forgot-password`| Guest | Yêu cầu gửi mail đặt lại mật khẩu | `email` | `message` (luôn trả 200 để tránh enumeration) | 429 (Rate limit) |
| `POST` | `/api/v1/auth/reset-password` | Guest | Đặt lại mật khẩu với token một lần | `email`, `token`, `newPassword` | `message` | 400 (Token hết hạn / không hợp lệ), 429 |
| `POST` | `/api/v1/auth/verify-email` | Guest | Xác thực email đăng ký (POST) | `email`, `token` | `message` | 400 (Token sai/hết hạn) |
| `GET` | `/api/v1/auth/verify-email` | Guest | Xác thực email đăng ký qua link trực tiếp (GET) | Query: `token`, `email` | `message` | 400 (Token sai/hết hạn) |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Đổi mật khẩu tài khoản | `currentPassword`, `newPassword` | `message` | 400, 401 |
| `GET` | `/api/v1/auth/me` | Authenticated | Lấy hồ sơ tài khoản hiện tại | None | `id`, `email`, `fullName`, `phoneNumber`, `roles`, `permissions` | 401 (Chưa đăng nhập) |
| `GET` | `/api/v1/users/me` | Authenticated | Lấy hồ sơ tài khoản hiện tại | None | `id`, `email`, `fullName`, `phoneNumber`, `roles`, `permissions` | 401 (Chưa đăng nhập) |
| `PUT` | `/api/v1/users/me` | Authenticated | Cập nhật thông tin cá nhân | `fullName`, `phoneNumber`, `avatarUrl` | `user` thông tin mới | 400, 401 |
| `GET` | `/api/v1/users/me/addresses`| Customer | Lấy danh sách sổ địa chỉ | None | `items: [AddressDto]` | 401 |
| `POST` | `/api/v1/users/me/addresses`| Customer | Thêm địa chỉ nhận hàng mới | `recipientName`, `phone`, `provinceCode`, `districtCode`, `wardCode`, `detailedAddress`, `isDefault` | `addressId`, chi tiết địa chỉ | 400, 401 |
| `PUT` | `/api/v1/users/me/addresses/{id}`| Customer | Sửa địa chỉ (chống IDOR) | Dữ liệu địa chỉ cập nhật | `address` cập nhật | 403 (Không sở hữu địa chỉ), 404 |
| `DELETE`| `/api/v1/users/me/addresses/{id}`| Customer | Xóa địa chỉ (chống IDOR) | None | `message` | 403, 404 |
| `PUT` | `/api/v1/users/me/addresses/{id}/default`| Customer | Đặt làm địa chỉ mặc định | None | `message` | 403, 404 |
| `GET` | `/api/v1/admin/users` | Admin | Quản lý danh sách người dùng | Query: `search`, `role`, `isActive`, `page`, `pageSize` | Danh sách phân trang người dùng | 401, 403 (Cần quyền Admin) |
| `PUT` | `/api/v1/admin/users/{id}/roles`| Admin | Gán vai trò cho người dùng | `roleIds: [Guid]` | `message` | 400, 403, 404 |
| `PUT` | `/api/v1/admin/users/{id}/status`| Admin | Khóa / mở khóa tài khoản | `isActive: bool`, `reason` | `message` | 400, 403, 404 |

---

### 2.2. Module Danh mục & Thương hiệu (`/api/v1/categories`, `/api/v1/brands`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/categories` | Public | Lấy cây danh mục sản phẩm | None | Danh sách dạng cây lồng nhau (children) | Không |
| `GET` | `/api/v1/categories/{slug}` | Public | Chi tiết danh mục kèm thông số | None | Thông tin danh mục, schema bộ lọc thông số | 404 |
| `POST` | `/api/v1/admin/categories` | Admin | Tạo danh mục mới | `name`, `slug`, `parentId`, `description`, `iconUrl`, `displayOrder` | Danh mục vừa tạo | 400 (Trùng slug), 403 |
| `PUT` | `/api/v1/admin/categories/{id}` | Admin | Sửa danh mục | Dữ liệu danh mục cập nhật | Danh mục cập nhật | 400, 403, 404 |
| `DELETE`| `/api/v1/admin/categories/{id}` | Admin | Xóa/ẩn danh mục | None | `message` | 400 (Có sản phẩm con), 403, 404 |
| `GET` | `/api/v1/admin/categories/{id}/spec-template`| Admin | Lấy mẫu schema thông số (JSONB) | None | `schemaDefinition` (JSON Schema) | 403, 404 |
| `PUT` | `/api/v1/admin/categories/{id}/spec-template`| Admin | Lưu mẫu schema thông số kỹ thuật | `schemaDefinition: json` | `message` | 400 (Schema JSON không hợp lệ), 403, 404 |
| `GET` | `/api/v1/brands` | Public | Danh sách thương hiệu | Query: `isActive` | `items: [BrandDto]` | Không |
| `POST` | `/api/v1/admin/brands` | Admin | Tạo thương hiệu mới | `name`, `slug`, `logoUrl`, `description` | Thương hiệu vừa tạo | 400 (Trùng slug), 403 |
| `PUT` | `/api/v1/admin/brands/{id}` | Admin | Sửa thương hiệu | Dữ liệu cập nhật | Thương hiệu cập nhật | 400, 403, 404 |
| `DELETE`| `/api/v1/admin/brands/{id}` | Admin | Xóa thương hiệu | None | `message` | 400, 403, 404 |

---

### 2.3. Module Sản phẩm & Biến thể SKU (`/api/v1/products`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/products` | Public | Danh sách sản phẩm (Lọc, Tìm kiếm, Sắp xếp, Phân trang) | Query: `categoryId`, `brandId`, `minPrice`, `maxPrice`, `search` (Full-Text), `specs` (JSONB query e.g. `specs[ram]=16GB`), `sort` (`price_asc`, `price_desc`, `newest`), `page`, `pageSize` | Danh sách phân trang sản phẩm (kèm min/max price, thumbnail, model_3d_url) | 400 |
| `GET` | `/api/v1/products/{slug}` | Public | Chi tiết sản phẩm | None | Chi tiết sản phẩm, đường dẫn `model_3d_url`, thông số `specifications`, danh sách `variants` (SKU, giá, tồn kho khả dụng), `images` | 404 |
| `POST` | `/api/v1/admin/products` | Admin | Tạo sản phẩm mới | `name`, `slug`, `categoryId`, `brandId`, `shortDescription`, `description`, `specifications` (JSONB), `model3dUrl` (tùy chọn), `basePrice`, `isFeatured` | Sản phẩm vừa tạo | 400 (Trùng slug / Sai schema), 403 |
| `PUT` | `/api/v1/admin/products/{id}` | Admin | Cập nhật thông tin chung sản phẩm | Dữ liệu cập nhật sản phẩm | Sản phẩm cập nhật | 400, 403, 404 |
| `DELETE`| `/api/v1/admin/products/{id}` | Admin | Xóa/ẩn sản phẩm | None | `message` | 403, 404 |
| `POST` | `/api/v1/admin/products/{id}/images` | Admin | Tải ảnh sản phẩm (MinIO/S3) | `multipart/form-data`: `file`, `variantId`, `isPrimary`, `displayOrder` | Thông tin ảnh đã upload | 400 (File quá lớn / sai định dạng), 403, 404 |
| `POST` | `/api/v1/admin/products/{id}/variants`| Admin | Thêm biến thể SKU | `sku`, `name`, `attributes` (JSONB màu sắc, RAM...), `originalPrice`, `salePrice`, `costPrice`, `initialQuantity` | Biến thể vừa tạo | 400 (Trùng SKU), 403, 404 |
| `PUT` | `/api/v1/admin/variants/{id}` | Admin | Cập nhật thông tin biến thể | `name`, `attributes`, `costPrice`, `isActive` | Biến thể cập nhật | 400, 403, 404 |
| `PUT` | `/api/v1/admin/variants/{id}/price` | Admin | Cập nhật giá & lưu lịch sử | `newOriginalPrice`, `newSalePrice`, `effectiveFrom`, `effectiveTo`, `reason` | `message` (tự động ghi `price_histories`) | 400, 403, 404 |
| `GET` | `/api/v1/admin/variants/{id}/price-history`| Admin, Sales | Xem lịch sử giá của biến thể | Query: `page`, `pageSize` | Danh sách lịch sử thay đổi giá | 403, 404 |

---

### 2.4. Module Giỏ hàng (`/api/v1/cart`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/cart` | Guest / Customer | Lấy chi tiết giỏ hàng | Header: `X-Anonymous-Id` (nếu là khách vãng lai) | `cartId`, `items`: [item: variantId, name, sku, price, quantity, thumbnail, stockAvailable], `totalAmount` | 400 |
| `POST` | `/api/v1/cart/items` | Guest / Customer | Thêm sản phẩm vào giỏ | `variantId`, `quantity` | Chi tiết giỏ hàng sau khi thêm | 400 (Vượt quá tồn kho khả dụng), 404 |
| `PUT` | `/api/v1/cart/items/{itemId}` | Guest / Customer | Cập nhật số lượng | `quantity` | Chi tiết giỏ hàng | 400 (Hết hàng), 404 |
| `DELETE`| `/api/v1/cart/items/{itemId}` | Guest / Customer | Xóa món khỏi giỏ | None | Chi tiết giỏ hàng | 404 |
| `DELETE`| `/api/v1/cart/clear` | Guest / Customer | Xóa toàn bộ giỏ hàng | None | `message` | Không |

---

### 2.5. Module Mã giảm giá (`/api/v1/coupons`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/coupons/apply` | Customer | Kiểm tra & tính thử mã giảm giá | `couponCode`, `cartTotalAmount` | `isValid`, `discountAmount`, `finalAmount`, `message` | 400 (Mã không tồn tại / Hết hạn / Chưa đạt giá trị tối thiểu) |
| `GET` | `/api/v1/admin/coupons` | Admin, Sales | Danh sách mã giảm giá | Query: `isActive`, `page`, `pageSize` | Danh sách phân trang coupon | 403 |
| `POST` | `/api/v1/admin/coupons` | Admin, Sales | Tạo mã giảm giá mới | `code`, `description`, `discountType`, `discountValue`, `minOrderValue`, `maxDiscountAmount`, `usageLimit`, `startDate`, `endDate` | Coupon vừa tạo | 400 (Trùng mã code), 403 |
| `PUT` | `/api/v1/admin/coupons/{id}` | Admin, Sales | Cập nhật mã giảm giá | Dữ liệu cập nhật | Coupon cập nhật | 400, 403, 404 |
| `DELETE`| `/api/v1/admin/coupons/{id}` | Admin, Sales | Hủy/xóa mã giảm giá | None | `message` | 403, 404 |

---

### 2.6. Module Đơn hàng & Đặt hàng (`/api/v1/orders`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/orders/checkout` | Customer | **Tạo đơn hàng (Server tính lại giá, giữ kho, lưu snapshot)** | `paymentMethod` (`COD`/`VNPay`), `addressId` (hoặc thông tin địa chỉ mới), `couponCode` (tùy chọn), `customerNote` | `orderId`, `orderNumber`, `totalAmount`, `paymentUrl` (nếu chọn VNPay), `status` | 400 (Hết hàng/Mã giảm giá không hợp lệ/Giá thay đổi), 401 |
| `GET` | `/api/v1/orders/my-orders` | Customer | Danh sách đơn hàng của tôi (**chống IDOR**) | Query: `status`, `page`, `pageSize` | Danh sách đơn hàng phân trang của chính user | 401 |
| `GET` | `/api/v1/orders/my-orders/{id}` | Customer | Chi tiết đơn hàng của tôi (**chống IDOR**) | None | Chi tiết đơn hàng, snapshot mặt hàng, lịch sử trạng thái | 401, 403 (Không sở hữu đơn), 404 |
| `POST` | `/api/v1/orders/my-orders/{id}/cancel` | Customer | Tự hủy đơn hàng (chỉ khi `Pending`) | `reason` | `message` (tự giải phóng `quantity_reserved`) | 400 (Đơn đã xác nhận/đang giao không được tự hủy), 403, 404 |
| `GET` | `/api/v1/admin/orders` | Sales, Admin | Xem danh sách toàn bộ đơn | Query: `status`, `paymentStatus`, `searchOrderNumber`, `fromDate`, `toDate`, `page`, `pageSize` | Danh sách đơn toàn shop | 403 |
| `GET` | `/api/v1/admin/orders/{id}` | Sales, Admin, Warehouse | Chi tiết đơn hàng cho nhân viên | None | Đầy đủ chi tiết đơn hàng, snapshot, log kho | 403, 404 |
| `PATCH`| `/api/v1/admin/orders/{id}/status` | Sales, Warehouse, Admin | Cập nhật trạng thái đơn hàng | `newStatus` (`Confirmed`, `Processing`, `Shipping`, `Completed`, `Cancelled`), `note` | `message` (áp dụng logic tác động tồn kho) | 400 (Chuyển trạng thái không hợp lệ), 403, 404 |

---

### 2.7. Module Thanh toán (`/api/v1/payments`)

| Method | Path | Actor | Mô tả | Request Body / Params chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/payments/{orderId}/vnpay-url` | Customer | Lấy lại URL thanh toán VNPay nếu trước đó chưa thanh toán | None | `paymentUrl` | 400 (Đơn đã thanh toán/quá hạn), 403, 404 |
| `POST` | `/api/v1/payments/vnpay-ipn` | External (VNPay) | **Webhook IPN (Idempotent, kiểm tra checksum HMAC-SHA512)** | Query Params từ VNPay (`vnp_SecureHash`, `vnp_TxnRef`, `vnp_ResponseCode`, ...) | `{ "RspCode": "00", "Message": "Confirm Success" }` | 400 (Sai chữ ký), 404 (Không tìm thấy đơn) |
| `GET` | `/api/v1/payments/vnpay-return` | Customer | Xử lý redirect sau thanh toán | Query Params từ VNPay | Redirect về trang web FE kèm trạng thái thành công/thất bại | 400 |

---

### 2.8. Module Đổi trả & Hoàn tiền (`/api/v1/return-requests`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/orders/{id}/return-requests` | Customer | Gửi yêu cầu đổi trả / hoàn tiền | `items: [{ orderItemId, quantity, reason, conditionNote }]`, `reason`, `bankInfo` (STK, ngân hàng, tên) | `returnRequestId`, `status` | 400 (Quá 7 ngày / Đơn chưa hoàn tất), 403, 404 |
| `GET` | `/api/v1/admin/return-requests` | Sales, Admin | Danh sách yêu cầu đổi trả | Query: `status`, `page`, `pageSize` | Danh sách yêu cầu đổi trả | 403 |
| `GET` | `/api/v1/admin/return-requests/{id}` | Sales, Admin | Chi tiết yêu cầu đổi trả | None | Chi tiết yêu cầu, danh sách món | 403, 404 |
| `PATCH`| `/api/v1/admin/return-requests/{id}/process`| Sales, Admin | Duyệt / Từ chối yêu cầu đổi trả | `status` (`Approved`, `Rejected`), `adminNote`, `refundAmount` | `message` (nếu duyệt kích hoạt quy trình hoàn tiền/kho) | 400, 403, 404 |

---

### 2.9. Module Quản lý Kho & Nhà cung cấp (`/api/v1/admin/inventory`, `/api/v1/admin/purchase-orders`)

| Method | Path | Actor | Mô tả | Request Body chính | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/inventory` | Warehouse, Admin | Xem bảng tồn kho tất cả SKU | Query: `searchSku`, `categoryId`, `lowStockOnly: bool`, `page`, `pageSize` | Danh sách tồn kho (`quantityOnHand`, `quantityReserved`, `availableToPromise`) | 403 |
| `POST` | `/api/v1/admin/inventory/adjust` | Warehouse, Admin | Điều chỉnh tồn kho kiểm kê thủ công | `variantId`, `actualQuantity`, `reason`, `note` | `message` (ghi nhận `stock_movements`) | 400, 403, 404 |
| `GET` | `/api/v1/admin/inventory/movements` | Warehouse, Admin | Sổ cái lịch sử biến động kho | Query: `variantId`, `movementType`, `fromDate`, `toDate`, `page`, `pageSize` | Danh sách dòng biến động kho | 403 |
| `GET` | `/api/v1/admin/suppliers` | Warehouse, Admin | Danh sách nhà cung cấp | Query: `isActive` | `items: [SupplierDto]` | 403 |
| `POST` | `/api/v1/admin/suppliers` | Warehouse, Admin | Thêm nhà cung cấp mới | `name`, `code`, `contactName`, `phone`, `email`, `address` | Nhà cung cấp vừa tạo | 400 (Trùng code), 403 |
| `GET` | `/api/v1/admin/purchase-orders` | Warehouse, Admin | Danh sách phiếu nhập hàng | Query: `supplierId`, `status`, `page`, `pageSize` | Danh sách phiếu nhập hàng | 403 |
| `POST` | `/api/v1/admin/purchase-orders` | Warehouse, Admin | Tạo phiếu nhập hàng (PO) | `supplierId`, `items: [{ variantId, quantityOrdered, unitCost }]`, `note` | Phiếu nhập hàng vừa tạo | 400, 403 |
| `POST` | `/api/v1/admin/purchase-orders/{id}/receive`| Warehouse, Admin | Xác nhận nhập kho thực tế | `receivedItems: [{ purchaseOrderItemId, quantityReceived }]`, `note` | `message` (tự động tăng `quantity_on_hand` và ghi ledger) | 400 (Đã hoàn tất không thể nhập tiếp), 403, 404 |

---

### 2.10. Module Báo cáo, Kiểm toán & Hệ thống (`/api/v1/admin/reports`, `/api/v1/admin/audit-logs`, `/health`)

| Method | Path | Actor | Mô tả | Request Body / Query | Response chính | Mã lỗi thường gặp |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/reports/dashboard`| Admin, Sales | Tổng quan Dashboard quản trị | Query: `fromDate`, `toDate` | `revenue`, `grossProfit`, `ordersCount`, `topSellingProducts`: [...], `lowStockWarnings`: [...] | 403 |
| `GET` | `/api/v1/admin/audit-logs` | Admin | Tra cứu nhật ký kiểm toán hệ thống | Query: `entityName`, `entityId`, `userId`, `fromDate`, `toDate`, `page`, `pageSize` | Danh sách phân trang Audit Log (kèm old/new values JSONB) | 403 |
| `GET` | `/health` | Public | Kiểm tra tình trạng sức khỏe ứng dụng | None | `{ "status": "Healthy", "entries": { "postgresql": { "status": "Healthy" } } }` | 503 (Nếu database mất kết nối) |
