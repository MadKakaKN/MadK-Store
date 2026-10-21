namespace MadK.Domain.Entities;

/// <summary>
/// Chi tiết kiểm đếm từng biến thể sản phẩm trong đợt kiểm kê kho.
/// </summary>
public class InventoryAuditItem : BaseEntity
{
    public Guid InventoryAuditId { get; set; }
    public InventoryAudit? InventoryAudit { get; set; }

    public Guid VariantId { get; set; }
    public ProductVariant? Variant { get; set; }

    /// <summary>
    /// Số lượng tồn kho ghi nhận trên hệ thống tại thời điểm kiểm.
    /// </summary>
    public int SystemQuantity { get; set; }

    /// <summary>
    /// Số lượng thực tế kiểm đếm được tại kho vật lý.
    /// </summary>
    public int ActualQuantity { get; set; }

    /// <summary>
    /// Chênh lệch kiểm kê: ActualQuantity - SystemQuantity.
    /// Giá trị âm: Thiếu hụt / thất thoát. Giá trị dương: Dư thừa.
    /// </summary>
    public int Discrepancy => ActualQuantity - SystemQuantity;

    /// <summary>
    /// Lý do giải trình chênh lệch kiểm kê nếu có.
    /// </summary>
    public string? Reason { get; set; }
}
