namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho bản ghi Quản lý Tồn kho của một biến thể sản phẩm.
/// Tách bạch giữa Tồn thực tế (OnHandQuantity) và Tồn đang giữ tạm (ReservedQuantity).
/// Tồn khả dụng (AvailableQuantity) luôn bằng OnHandQuantity - ReservedQuantity và không bao giờ được phép âm.
/// </summary>
public class Inventory : BaseEntity
{
    public Guid VariantId { get; set; }
    public ProductVariant? Variant { get; set; }

    /// <summary>
    /// Số lượng hàng thực tế có trong kho vật lý.
    /// </summary>
    public int OnHandQuantity { get; set; }

    /// <summary>
    /// Số lượng hàng đang được giữ trước cho các đơn hàng chưa hoàn tất/đang thanh toán.
    /// </summary>
    public int ReservedQuantity { get; set; }

    /// <summary>
    /// Tồn kho khả dụng để bán: OnHand - Reserved.
    /// Không bao giờ được phép âm.
    /// </summary>
    public int AvailableQuantity => Math.Max(0, OnHandQuantity - ReservedQuantity);

    /// <summary>
    /// Lịch sử các biến động tồn kho (Stock Movements).
    /// </summary>
    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}
