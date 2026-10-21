using System.ComponentModel.DataAnnotations;
using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Mã giảm giá / Coupon khuyến mãi của MadK Store.
/// Hỗ trợ giảm theo phần trăm hoặc số tiền, kèm các điều kiện đơn tối thiểu, hạn dùng và giới hạn lượt.
/// </summary>
public class Coupon : BaseEntity
{
    /// <summary>
    /// Mã giảm giá (viết hoa, duy nhất, e.g. MADK2026, FREESHIP).
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả chương trình khuyến mại.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Loại giảm giá: Percentage (%) hoặc FixedAmount (VND).
    /// </summary>
    public CouponDiscountType DiscountType { get; set; } = CouponDiscountType.Percentage;

    /// <summary>
    /// Giá trị giảm: Ví dụ 10 (10%) hoặc 50000 (50.000đ).
    /// </summary>
    public decimal DiscountValue { get; set; }

    /// <summary>
    /// Mức giảm tối đa (áp dụng cho loại Percentage để tránh lỗ khi đơn quá lớn).
    /// </summary>
    public decimal? MaxDiscountAmount { get; set; }

    /// <summary>
    /// Giá trị đơn hàng tối thiểu (Subtotal) để được áp dụng mã. Mặc định 0đ.
    /// </summary>
    public decimal MinOrderAmount { get; set; } = 0m;

    /// <summary>
    /// Thời điểm bắt đầu có hiệu lực (UTC). Null nghĩa là có hiệu lực ngay lập tức.
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Thời điểm hết hạn (UTC). Null nghĩa là không thời hạn.
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Giới hạn tổng số lượt sử dụng tối đa của toàn hệ thống. Null nghĩa là không giới hạn.
    /// </summary>
    public int? UsageLimit { get; set; }

    /// <summary>
    /// Số lượt mã đã được áp dụng thành công.
    /// Đánh dấu [ConcurrencyCheck] để kiểm soát đồng thời lạc quan (Optimistic Concurrency Control).
    /// </summary>
    [ConcurrencyCheck]
    public int UsedCount { get; set; } = 0;

    /// <summary>
    /// Trạng thái kích hoạt của mã (Sales/Admin có thể bật/tắt thủ công).
    /// </summary>
    public bool IsActive { get; set; } = true;
}
