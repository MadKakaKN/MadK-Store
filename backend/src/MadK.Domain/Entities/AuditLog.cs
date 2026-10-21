namespace MadK.Domain.Entities;

/// <summary>
/// Ghi nhận nhật ký kiểm toán (Audit Log) cho các thao tác quan trọng của nhân viên và quản trị viên.
/// Ghi rõ: ai thực hiện, hành động gì, trên đối tượng nào, giá trị trước/sau và thời điểm.
/// </summary>
public class AuditLog : BaseEntity
{
    /// <summary>
    /// ID người dùng thực hiện (null nếu thao tác hệ thống tự động)
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Email người thực hiện
    /// </summary>
    public string? UserEmail { get; set; }

    /// <summary>
    /// Vai trò của người thực hiện tại thời điểm thao tác (Admin, Sales, Warehouse...)
    /// </summary>
    public string? UserRole { get; set; }

    /// <summary>
    /// Tên hành động nghiệp vụ (e.g. USER_ROLE_ASSIGNED, USER_STATUS_UPDATED, ORDER_STATUS_CHANGED, INVENTORY_RESTOCKED)
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Tên thực thể bị tác động (e.g. User, Order, Inventory, Product)
    /// </summary>
    public string EntityName { get; set; } = string.Empty;

    /// <summary>
    /// Khóa định danh của thực thể bị tác động (e.g. ID hoặc OrderNumber)
    /// </summary>
    public string? EntityId { get; set; }

    /// <summary>
    /// Giá trị trước khi thay đổi (JSON snapshot)
    /// </summary>
    public string? OldValues { get; set; }

    /// <summary>
    /// Giá trị sau khi thay đổi (JSON snapshot)
    /// </summary>
    public string? NewValues { get; set; }

    /// <summary>
    /// Địa chỉ IP người gọi
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User Agent trình duyệt/client
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Ghi chú bổ sung hoặc lý do thao tác
    /// </summary>
    public string? Note { get; set; }
}
