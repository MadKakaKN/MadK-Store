namespace MadK.Domain.Enums;

/// <summary>
/// Phân loại biến động tồn kho (Stock Movement Type).
/// Ghi nhận lịch sử cho mọi thao tác biến động kho hàng.
/// </summary>
public enum StockMovementType
{
    /// <summary>
    /// Nhập hàng thực tế vào kho (tăng OnHandQuantity).
    /// </summary>
    Restock = 1,

    /// <summary>
    /// Đặt trước / giữ hàng tạm thời cho phiên thanh toán / đơn hàng (tăng ReservedQuantity).
    /// </summary>
    Reserve = 2,

    /// <summary>
    /// Hủy giữ hàng / giải phóng hàng khi đơn bị hủy hoặc hết hạn (giảm ReservedQuantity).
    /// </summary>
    Release = 3,

    /// <summary>
    /// Xuất kho / trừ kho thực tế khi đơn hàng thanh toán thành công (giảm cả OnHandQuantity & ReservedQuantity).
    /// </summary>
    Commit = 4,

    /// <summary>
    /// Điều chỉnh tồn kho kiểm kê thủ công bởi quản trị viên.
    /// </summary>
    Adjustment = 5
}
