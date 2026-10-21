using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Đợt kiểm kê kho (Stock Count / Inventory Audit).
/// </summary>
public class InventoryAudit : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public InventoryAuditStatus Status { get; set; } = InventoryAuditStatus.Draft;
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<InventoryAuditItem> Items { get; set; } = new List<InventoryAuditItem>();
}
