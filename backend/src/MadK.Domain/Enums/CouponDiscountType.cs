namespace MadK.Domain.Enums;

/// <summary>
/// Loại hình giảm giá của mã Coupon / Khuyến mại.
/// </summary>
public enum CouponDiscountType
{
    /// <summary>
    /// Giảm theo tỷ lệ phần trăm (0 - 100%), có thể kèm mức giảm tối đa MaxDiscountAmount.
    /// </summary>
    Percentage = 1,

    /// <summary>
    /// Giảm một khoản tiền cố định (VND).
    /// </summary>
    FixedAmount = 2
}
