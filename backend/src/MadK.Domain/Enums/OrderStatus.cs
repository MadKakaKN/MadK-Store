namespace MadK.Domain.Enums;

/// <summary>
/// Vòng đời trạng thái đơn hàng theo docs/order-states.md.
/// </summary>
public enum OrderStatus
{
    /// <summary>
    /// Đơn mới tạo (COD: giữ kho chờ duyệt; hoặc đơn vừa khởi tạo).
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Chờ thanh toán online (VNPay - giữ kho tạm 15 phút).
    /// </summary>
    PendingPayment = 2,

    /// <summary>
    /// Đã xác nhận (Sales/Admin đã gọi xác nhận).
    /// </summary>
    Confirmed = 3,

    /// <summary>
    /// Đang xử lý / đóng gói tại kho (In phiếu xuất kho).
    /// </summary>
    Processing = 4,

    /// <summary>
    /// Đang giao hàng (Đã bàn giao đơn vị vận chuyển - xuất kho trừ thật).
    /// </summary>
    Shipping = 5,

    /// <summary>
    /// Giao hàng thành công / Đơn hàng hoàn tất.
    /// </summary>
    Completed = 6,

    /// <summary>
    /// Đơn đã bị hủy (Giải phóng tồn kho đang giữ hoặc nhập lại kho nếu chuyển hoàn).
    /// </summary>
    Cancelled = 7,

    /// <summary>
    /// Khách hàng yêu cầu đổi trả (trong 7 ngày).
    /// </summary>
    ReturnRequested = 8,

    /// <summary>
    /// Đã nhận lại hàng đổi trả và hoàn tiền/nhập lại kho.
    /// </summary>
    Returned = 9
}
