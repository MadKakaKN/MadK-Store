using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Lưu vết toàn bộ lịch sử chuyển trạng thái của đơn hàng (Audit Trail).
/// Ghi nhận ai (Khách, Nhân viên, Hệ thống), khi nào và lý do/ghi chú.
/// </summary>
public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    /// <summary>
    /// Trạng thái trước khi chuyển (null khi mới khởi tạo đơn).
    /// </summary>
    public OrderStatus? FromStatus { get; set; }

    /// <summary>
    /// Trạng thái sau khi chuyển.
    /// </summary>
    public OrderStatus ToStatus { get; set; }

    /// <summary>
    /// ID người thực hiện (nếu là người dùng hoặc nhân viên đăng nhập).
    /// </summary>
    public Guid? ChangedByUserId { get; set; }

    /// <summary>
    /// Tên người / tác nhân thực hiện (e.g. "Khách hàng", "Sales", "Kho", "Hệ thống").
    /// </summary>
    public string ChangedByName { get; set; } = "Hệ thống";

    /// <summary>
    /// Lý do chuyển trạng thái (đặc biệt khi Hủy đơn, Đổi trả).
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Ghi chú nội bộ bổ sung (nếu có).
    /// </summary>
    public string? Note { get; set; }
}
