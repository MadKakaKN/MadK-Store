namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho một dòng sản phẩm trong yêu cầu đổi trả.
/// </summary>
public class ReturnRequestItem : BaseEntity
{
    public Guid ReturnRequestId { get; set; }
    public ReturnRequest? ReturnRequest { get; set; }

    public Guid? OrderItemId { get; set; }
    public Guid? VariantId { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;

    /// <summary>
    /// Số lượng yêu cầu trả lại (phải &lt;= số lượng đã mua trong đơn).
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Đơn giá tại thời điểm mua hàng.
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Tổng tiền dòng sản phẩm đổi trả = Quantity * UnitPrice.
    /// </summary>
    public decimal TotalPrice { get; set; }

    /// <summary>
    /// Lý do chi tiết cho riêng món hàng này.
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Tình trạng hàng hóa khi nhận lại (Nguyên seal, Đã mở hộp, Trầy xước, Hỏng hóc).
    /// </summary>
    public string? Condition { get; set; }
}
