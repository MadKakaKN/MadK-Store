using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Đơn đặt mua / Phiếu nhập hàng từ nhà cung cấp.
/// </summary>
public class PurchaseOrder : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ReceivedAt { get; set; }

    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}
