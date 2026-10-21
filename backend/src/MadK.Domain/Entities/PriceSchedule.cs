namespace MadK.Domain.Entities;

public enum PriceType
{
    Standard = 1,   // Giá niêm yết chuẩn
    Promotion = 2,  // Giá khuyến mãi có thời hạn
    FlashSale = 3   // Giá Flash sale đặc biệt
}

public class PriceSchedule : BaseEntity
{
    public Guid VariantId { get; set; }
    public ProductVariant Variant { get; set; } = null!;

    public PriceType PriceType { get; set; } = PriceType.Promotion;

    /// <summary>
    /// Giá áp dụng trong khoảng thời gian này (ví dụ: giá khuyến mãi).
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Giá gốc đối chiếu (Original / List price) tại thời điểm thiết lập.
    /// </summary>
    public decimal OriginalPrice { get; set; }

    /// <summary>
    /// Thời điểm bắt đầu hiệu lực (UTC).
    /// </summary>
    public DateTimeOffset StartDate { get; set; }

    /// <summary>
    /// Thời điểm kết thúc hiệu lực (UTC). Null nếu là giá vô thời hạn.
    /// </summary>
    public DateTimeOffset? EndDate { get; set; }

    /// <summary>
    /// Tên chương trình hoặc lý do điều chỉnh giá.
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Ghi chú nội bộ cho quản trị viên.
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Trạng thái kích hoạt.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Người thực hiện điều chỉnh giá (email hoặc tên).
    /// </summary>
    public string? CreatedBy { get; set; }
}
