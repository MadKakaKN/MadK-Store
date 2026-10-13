using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Ghi chép sổ cái (Ledger) cho mọi biến động tồn kho.
/// Đảm bảo tính minh bạch, truy vết và kiểm toán (Audit Trail) cho toàn bộ hệ thống kho.
/// </summary>
public class StockMovement : BaseEntity
{
    public Guid InventoryId { get; set; }
    public Inventory? Inventory { get; set; }

    public Guid VariantId { get; set; }

    public StockMovementType Type { get; set; }

    /// <summary>
    /// Số lượng hàng biến động trong thao tác này.
    /// </summary>
    public int Quantity { get; set; }

    public int OnHandBefore { get; set; }
    public int OnHandAfter { get; set; }

    public int ReservedBefore { get; set; }
    public int ReservedAfter { get; set; }

    /// <summary>
    /// Loại thực thể tham chiếu (ví dụ: "Order", "Reservation", "Cart", "Manual")
    /// </summary>
    public string? ReferenceType { get; set; }

    /// <summary>
    /// Khóa/Mã tham chiếu (ví dụ: OrderId, ReservationId)
    /// </summary>
    public string? ReferenceId { get; set; }

    /// <summary>
    /// Ghi chú lý do biến động.
    /// </summary>
    public string? Reason { get; set; }
}
