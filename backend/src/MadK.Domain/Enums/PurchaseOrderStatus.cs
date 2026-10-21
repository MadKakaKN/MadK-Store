namespace MadK.Domain.Enums;

/// <summary>
/// Trạng thái của đơn mua / phiếu nhập hàng (Purchase Order).
/// </summary>
public enum PurchaseOrderStatus
{
    /// <summary>
    /// Đang tạo / nháp, chưa nhập kho thực tế.
    /// </summary>
    Draft = 1,

    /// <summary>
    /// Đã nhập hàng vào kho thực tế (hàng đã vào kho, tồn tăng, ghi giá vốn).
    /// </summary>
    Received = 2,

    /// <summary>
    /// Đã hủy phiếu nhập.
    /// </summary>
    Cancelled = 3
}
