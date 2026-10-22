# Hướng dẫn Chuẩn bị, Tối ưu & Gắn Model 3D (GLB) vào MadK Store

Tài liệu này hướng dẫn chi tiết quy trình chuẩn bị mô hình 3D, tối ưu nén dung lượng, lưu trữ và liên kết vào hệ thống sản phẩm của MadK Store.

---

## 1. Tiêu chuẩn Kỹ thuật cho Model 3D

Để đảm bảo hiệu năng tải trang nhanh trên cả **Desktop** và **Mobile**:
- **Định dạng:** `.glb` (glTF 2.0 Binary - đã đóng gói toàn bộ meshes, textures, materials vào 1 file duy nhất).
- **Dung lượng khuyến nghị:** 
  - Tối ưu: **< 2 MB**
  - Giới hạn tối đa: **< 5 MB**
- **Độ phức tạp đa giác (Polygon Count):**
  - Không quá **50,000 - 100,000 triangles** cho sản phẩm thông thường.
  - Tận dụng Normal Maps để tạo độ chi tiết thay vì tăng số lượng polygon.
- **Kích thước Texture:**
  - BaseColor / Metallic / Roughness: **1024x1024** hoặc tối đa **2048x2048**.
  - Định dạng texture nén: **WebP** hoặc **KTX2 / Basis Universal**.

---

## 2. Nguồn tải Model 3D miễn phí chất lượng cao

Bạn có thể tìm kiếm và tải các mô hình đồ công nghệ (bàn phím, tai nghe, điện thoại, laptop):
1. **Sketchfab** ([sketchfab.com](https://sketchfab.com/)) - Chọn filter "Downloadable" và "CC Attribution".
2. **Poly Pizza** ([poly.pizza](https://poly.pizza/)) - Kho model low-poly, dung lượng siêu nhẹ, hoàn toàn miễn phí.
3. **Free3D / TurboSquid** - Các model định dạng FBX/OBJ có thể xuất sang GLB bằng Blender.
4. **Khronos glTF Sample Assets** - Các mẫu thử nghiệm chuẩn glTF 2.0.

---

## 3. Quy trình Nén & Tối ưu hóa Model (Draco & Meshopt)

Sử dụng công cụ mã nguồn mở **glTF-Transform** (không cần cài đặt phần mềm nặng, chạy trực tiếp qua Node.js):

### Bước 3.1: Nén tự động hoàn toàn (Khuyến nghị)
Mở terminal và chạy lệnh:
```bash
npx @gltf-transform/cli optimize input.glb output.glb --draco --texture-compress webp
```
*Lệnh này sẽ tự động giảm từ 50% - 80% dung lượng file ban đầu bằng cách nén hình học Draco và chuyển đổi texture sang WebP.*

### Bước 3.2: Tùy chỉnh chi tiết (Nếu cần)
- Giảm độ phân giải texture xuống 1024px:
  ```bash
  npx @gltf-transform/cli resize input.glb output.glb --width 1024 --height 1024
  ```
- Nén hình học bằng thuật toán Meshopt:
  ```bash
  npx @gltf-transform/cli meshopt input.glb output.glb
  ```

---

## 4. Nơi đặt file Model 3D trong dự án

### Cách 1: Chạy thử cục bộ (Local Development)
1. Đặt file `.glb` vào thư mục:
   ```text
   frontend/public/models/
   ```
   *Ví dụ: `frontend/public/models/keychron-q1-pro.glb`*
2. Đường dẫn truy cập trong hệ thống là:
   ```text
   /models/keychron-q1-pro.glb
   ```
*(Hệ thống đã có sẵn 2 model mẫu trong thư mục này: `/models/sample-box.glb` và `/models/sample-gadget.glb`).*

### Cách 2: Môi trường Production (S3 / MinIO / CDN)
1. Upload file qua trang quản trị Admin: **Admin -> Catalog -> Quản lý sản phẩm -> Chọn file 3D (.glb)**.
2. Hoặc upload trực tiếp lên S3/MinIO bucket `madk-catalog` tại thư mục `/uploads/models3d/`.
3. URL sẽ có dạng: `https://cdn.madkstore.vn/uploads/models3d/keychron-q1-pro.glb`.

---

## 5. Gắn Model vào Sản phẩm

### Cách 1: Qua giao diện Quản trị Admin
1. Đăng nhập với tài khoản Admin hoặc Sales có quyền `catalog.manage`.
2. Vào **Admin Dashboard -> Quản lý sản phẩm (Catalog)**.
3. Bấm **Chỉnh sửa** sản phẩm tương ứng (ví dụ: *Bàn phím cơ Keychron Q1 Pro*).
4. Điền URL model vào ô **Đường dẫn mô hình 3D (GLB)**:
   - Nếu là file trong thư mục public: `/models/sample-gadget.glb`
   - Nếu là file online: `https://.../keychron-q1-pro.glb`
5. Bấm **Lưu thay đổi**.

### Cách 2: Qua Database Seeder hoặc SQL
Cập nhật cột `model3d_url` trong bảng `products`:
```sql
UPDATE products 
SET model3d_url = '/models/sample-gadget.glb' 
WHERE slug = 'ban-phim-co-keychron-q1-pro';
```

---

## 6. Cơ chế Đổi màu Biến thể (Variant Material Tinting)

Trình xem `Product3DViewer` tự động phân tích các meshes của model:
1. Khi khách hàng bấm chọn biến thể (ví dụ: *"Trắng Ceramic"*, *"Đen Carbon"*, *"Xanh Midnight"*, *"Đỏ Crimson"*):
   - Hệ thống trích xuất mã màu hex tương ứng từ `attributes` JSON hoặc `name` của biến thể.
   - Quét qua scene và cập nhật thuộc tính `material.color` của các khối vỏ/body chính.
   - Giữ nguyên các vật liệu kính (glass), màn hình LED hoặc lens phát sáng.
2. Khách hàng cũng có thể tự do thử nghiệm các màu sắc khác nhau thông qua thanh công cụ màu tương tác nhanh ngay trên khung nhìn 3D.
