namespace MadK.Domain.Entities;

/// <summary>
/// Chi tiết dòng sản phẩm trong đơn hàng (Order Item).
/// BẮT BUỘC: Lưu SNAPSHOT đầy đủ (tên, SKU, giá, thông số, ảnh) tại thời điểm đặt hàng.
/// Đảm bảo không bao giờ bị biến động khi sản phẩm sau này đổi tên, đổi giá hoặc xóa.
/// </summary>
public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public Guid? VariantId { get; set; }
    public ProductVariant? Variant { get; set; }

    public Guid? ProductId { get; set; }

    /// <summary>
    /// [SNAPSHOT] Tên sản phẩm tại thời điểm mua.
    /// </summary>
    public string ProductNameSnapshot { get; set; } = string.Empty;

    /// <summary>
    /// [SNAPSHOT] Tên biến thể tại thời điểm mua (e.g. Titan Tự Nhiên - 256GB).
    /// </summary>
    public string VariantNameSnapshot { get; set; } = string.Empty;

    /// <summary>
    /// [SNAPSHOT] Mã SKU tại thời điểm mua.
    /// </summary>
    public string SkuSnapshot { get; set; } = string.Empty;

    /// <summary>
    /// [SNAPSHOT] Đơn giá bán tại thời điểm mua (Server tính từ DB, không nhận từ client).
    /// </summary>
    public decimal UnitPriceSnapshot { get; set; }

    /// <summary>
    /// [SNAPSHOT] Giá niêm yết ban đầu.
    /// </summary>
    public decimal OriginalPriceSnapshot { get; set; }

    /// <summary>
    /// Số lượng đặt mua.
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Thành tiền = UnitPriceSnapshot * Quantity.
    /// </summary>
    public decimal TotalPrice { get; set; }

    /// <summary>
    /// [SNAPSHOT] Thuộc tính biến thể (Màu, dung lượng, switch...) dạng JSON.
    /// </summary>
    public string AttributesSnapshot { get; set; } = "{}";

    /// <summary>
    /// [SNAPSHOT] Thông số kỹ thuật tóm tắt dạng JSON.
    /// </summary>
    public string? SpecificationsSnapshot { get; set; }

    /// <summary>
    /// [SNAPSHOT] Ảnh đại diện sản phẩm tại thời điểm mua.
    /// </summary>
    public string? ThumbnailUrlSnapshot { get; set; }
}
