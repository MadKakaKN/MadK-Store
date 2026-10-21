namespace MadK.Domain.Enums;

/// <summary>
/// Trạng thái của phiếu kiểm kê kho (Inventory Audit).
/// </summary>
public enum InventoryAuditStatus
{
    /// <summary>
    /// Đang kiểm đếm / bản nháp.
    /// </summary>
    Draft = 1,

    /// <summary>
    /// Đã hoàn tất kiểm kê và thực hiện cân bằng kho (điều chỉnh tồn kho).
    /// </summary>
    Completed = 2,

    /// <summary>
    /// Đã hủy đợt kiểm kê.
    /// </summary>
    Cancelled = 3
}
