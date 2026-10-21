namespace MadK.Domain.Entities;

/// <summary>
/// Chi tiết mặt hàng trong phiếu nhập hàng, ghi nhận giá vốn tại thời điểm nhập.
/// </summary>
public class PurchaseOrderItem : BaseEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }

    public Guid VariantId { get; set; }
    public ProductVariant? Variant { get; set; }

    public int Quantity { get; set; }

    /// <summary>
    /// Giá vốn nhập hàng trên 1 đơn vị sản phẩm (Cost Price).
    /// </summary>
    public decimal UnitCost { get; set; }

    /// <summary>
    /// Tổng giá vốn của dòng nhập: Quantity * UnitCost.
    /// </summary>
    public decimal TotalCost { get; set; }

    public string? Notes { get; set; }
}
