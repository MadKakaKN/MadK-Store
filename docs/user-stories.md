# User Stories Theo Actor - MadK Store

Tài liệu này định nghĩa danh sách User Story cho 4 actor chính theo chuẩn:
**"Là [Actor], tôi muốn [Hành động/Tính năng] để [Lợi ích/Mục đích]."**
Các story bao phủ toàn bộ phạm vi từ **Giai đoạn 1 đến Giai đoạn 4** trong [PLAN.md](file:///c:/Users/ADMIN/Downloads/MadK-Store/PLAN.md).

---

## 1. Customer (Khách hàng)

### Danh mục & Tìm kiếm (Giai đoạn 1)
- Là Customer, tôi muốn duyệt danh mục sản phẩm theo cấu trúc cây đa cấp để dễ dàng thu hẹp phạm vi tìm kiếm thiết bị công nghệ.
- Là Customer, tôi muốn lọc sản phẩm theo thương hiệu, khoảng giá và các thông số kỹ thuật đặc thù (RAM, CPU, pin, loại kết nối) để chọn đúng cấu hình mong muốn.
- Là Customer, tôi muốn tìm kiếm sản phẩm bằng từ khóa tiếng Việt không dấu hoặc có dấu để nhanh chóng tiếp cận sản phẩm cần mua.
- Là Customer, tôi muốn sắp xếp danh sách sản phẩm theo giá tăng dần, giảm dần hoặc mới nhất để thuận tiện so sánh.
- Là Customer, tôi muốn xem chi tiết sản phẩm với đầy đủ ảnh, mô tả, bảng thông số kỹ thuật và chọn các biến thể màu sắc/dung lượng để biết chính xác giá bán của từng cấu hình.
- Là Customer, tôi muốn tương tác với mô hình 3D (xoay, zoom, đổi màu sắc theo biến thể) trên các sản phẩm nổi bật để có trải nghiệm xem sản phẩm chân thực trước khi mua.

### Tài khoản & Sổ địa chỉ (Giai đoạn 2)
- Là Customer, tôi muốn đăng ký tài khoản bằng email và nhận email xác thực để kích hoạt tài khoản an toàn.
- Là Customer, tôi muốn đăng nhập để nhận JWT token và duy trì phiên đăng nhập bằng refresh token nhằm tiếp tục mua sắm thuận tiện.
- Là Customer, tôi muốn yêu cầu đặt lại mật khẩu qua email khi quên mật khẩu để có thể khôi phục quyền truy cập tài khoản.
- Là Customer, tôi muốn quản lý sổ địa chỉ với cấu trúc hành chính Việt Nam (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã, địa chỉ chi tiết) để chọn nhanh địa chỉ khi thanh toán.

### Giỏ hàng & Đặt hàng (Giai đoạn 2 & 4)
- Là Customer, tôi muốn thêm biến thể sản phẩm vào giỏ hàng, cập nhật số lượng hoặc xóa sản phẩm để quản lý các món dự định mua.
- Là Customer, tôi muốn giỏ hàng của tôi được đồng bộ và lưu trữ an toàn khi chuyển đổi thiết bị.
- Là Customer, tôi muốn nhập mã giảm giá khi thanh toán để được trừ tiền hợp lệ theo chính sách khuyến mãi.
- Là Customer, tôi muốn đặt hàng với hình thức thanh toán khi nhận hàng (COD) để thuận tiện thanh toán tiền mặt tại nhà.
- Là Customer, tôi muốn thanh toán trực tuyến qua cổng VNPay một cách an toàn và nhận thông báo xác nhận tức thì.
- Là Customer, tôi muốn nhận email xác nhận đơn hàng ngay sau khi đặt hàng thành công để lưu trữ biên nhận mua sắm.

### Theo dõi đơn & Đổi trả (Giai đoạn 2 & 4)
- Là Customer, tôi muốn xem danh sách và chi tiết các đơn hàng của riêng tôi để theo dõi tiến độ giao hàng mà không bị rò rỉ đơn của người khác.
- Là Customer, tôi muốn tự hủy đơn hàng khi đơn còn ở trạng thái Mới hoặc Chờ xác nhận để kịp thời thay đổi ý định mua.
- Là Customer, tôi muốn gửi yêu cầu đổi trả hoặc hoàn tiền kèm lý do và số tài khoản nhận tiền khi sản phẩm gặp sự cố.

---

## 2. Sales (Nhân viên bán hàng)

### Xử lý đơn hàng (Giai đoạn 2 & 3)
- Là Sales, tôi muốn xem danh sách toàn bộ đơn hàng trong hệ thống kèm bộ lọc theo trạng thái, ngày tạo và phương thức thanh toán để xử lý kịp thời.
- Là Sales, tôi muốn xem chi tiết đơn hàng cùng các thông tin snapshot sản phẩm, giá, địa chỉ nhận hàng để liên hệ xác minh khách hàng.
- Là Sales, tôi muốn gọi điện và đổi trạng thái đơn hàng COD từ Mới sang Đã xác nhận để chuyển tiếp cho bộ phận kho chuẩn bị đóng gói.
- Là Sales, tôi muốn hủy đơn hàng và ghi rõ lý do hủy (khách không nghe máy, khách đổi ý) để hệ thống tự động hoàn lại tồn kho.

### Đổi trả & Hoàn tiền (Giai đoạn 4)
- Là Sales, tôi muốn xem danh sách các yêu cầu đổi trả/hoàn tiền từ khách hàng để kiểm tra tính hợp lệ của khiếu nại.
- Là Sales, tôi muốn duyệt hoặc từ chối yêu cầu đổi trả kèm lý do phản hồi cho khách hàng.
- Là Sales, tôi muốn kích hoạt lệnh hoàn tiền cho các đơn thanh toán trực tuyến đã hủy hoặc đổi trả thành công.

### Khuyến mãi & Báo cáo (Giai đoạn 3 & 4)
- Là Sales, tôi muốn tạo và quản lý các mã giảm giá (theo %, số tiền cố định, số lượt tối đa, hạn sử dụng) để triển khai các chiến dịch thúc đẩy doanh số.
- Là Sales, tôi muốn xem báo cáo doanh thu theo ngày, tuần, tháng và tỷ lệ chuyển đổi đơn hàng để đánh giá hiệu quả kinh doanh.

---

## 3. Warehouse (Nhân viên kho)

### Tồn kho & Kiểm soát (Giai đoạn 3)
- Là Warehouse, tôi muốn xem số lượng tồn thực tế (`quantity_on_hand`) và tồn đang giữ (`quantity_reserved`) của từng biến thể SKU để nắm rõ khả năng đáp ứng hàng.
- Là Warehouse, tôi muốn nhận cảnh báo danh sách các sản phẩm có tồn kho thấp hơn ngưỡng an toàn để kịp thời lập kế hoạch nhập hàng.
- Là Warehouse, tôi muốn thực hiện điều chỉnh tồn kho thủ công sau mỗi đợt kiểm kê định kỳ và ghi rõ lý do sai lệch để đối soát.
- Là Warehouse, tôi muốn xem sổ cái lịch sử biến động kho (`stock_movements`) của từng SKU để truy vết mọi giao dịch nhập, xuất, hoàn, hủy.

### Đóng gói & Bàn giao (Giai đoạn 2 & 3)
- Là Warehouse, tôi muốn xem danh sách đơn hàng Đã xác nhận để in phiếu xuất và đóng gói sản phẩm.
- Là Warehouse, tôi muốn chuyển trạng thái đơn hàng sang Đang giao và cập nhật mã vận đơn khi bàn giao hàng cho đơn vị vận chuyển (GHN/GHTK).

### Nhà cung cấp & Nhập kho (Giai đoạn 3)
- Là Warehouse, tôi muốn quản lý danh bạ nhà cung cấp thiết bị công nghệ (tên, mã, thông tin liên hệ).
- Là Warehouse, tôi muốn tạo phiếu nhập hàng (Purchase Order) với danh sách SKU, số lượng đặt và giá vốn.
- Là Warehouse, tôi muốn xác nhận số lượng thực nhận khi lô hàng về kho để hệ thống tự động tăng tồn thực tế và cập nhật sổ cái biến động kho.
- Là Warehouse, tôi muốn nhập lại kho các sản phẩm từ các đơn hàng đổi trả đạt tiêu chuẩn chất lượng.

---

## 4. Admin (Quản trị viên)

### Quản trị Danh mục & Catalog (Giai đoạn 1 & 3)
- Là Admin, tôi muốn thêm, sửa, đổi vị trí các danh mục sản phẩm theo mô hình phân cấp cây để tổ chức cấu trúc ngành hàng khoa học.
- Là Admin, tôi muốn thiết lập template schema thông số kỹ thuật (JSONB) cho từng danh mục để quy định chuẩn dữ liệu cấu hình thiết bị.
- Là Admin, tôi muốn quản lý danh sách thương hiệu công nghệ (logo, tên, slug).
- Là Admin, tôi muốn thêm mới và chỉnh sửa sản phẩm, gán thông số kỹ thuật theo schema của danh mục, tải lên nhiều ảnh (MinIO/S3) và cấu hình đường dẫn file mô hình 3D GLB.
- Là Admin, tôi muốn tạo và quản lý các biến thể SKU cho sản phẩm kèm mã màu, cấu hình bộ nhớ và giá bán riêng.
- Là Admin, tôi muốn thiết lập giá niêm yết, giá bán khuyến mãi có thời hạn và xem lại toàn bộ lịch sử biến động giá của từng SKU.

### Người dùng & Phân quyền (Giai đoạn 3)
- Là Admin, tôi muốn xem danh sách toàn bộ người dùng trong hệ thống và khóa/mở khóa tài khoản khi phát hiện bất thường.
- Là Admin, tôi muốn phân quyền theo Role và Permission (Admin, Sales, Warehouse, Customer) cho từng tài khoản để đảm bảo đúng ma trận bảo mật ở server.

### Kiểm toán & Giám sát (Giai đoạn 0 & 3)
- Là Admin, tôi muốn xem Audit Log chi tiết (ai đã sửa gì, vào lúc nào, giá trị cũ/mới dạng JSONB, địa chỉ IP) để phục vụ kiểm toán an toàn thông tin.
- Là Admin, tôi muốn theo dõi trang sức khỏe hệ thống (Health Check) về trạng thái kết nối PostgreSQL, Redis và API server.
- Là Admin, tôi muốn xem Dashboard tổng quan gồm: doanh thu, lợi nhuận gộp, số lượng đơn theo ngày, top sản phẩm bán chạy nhất và cảnh báo tồn kho.
