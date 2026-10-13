namespace MadK.Domain.Enums;

/// <summary>
/// Trạng thái thanh toán của đơn hàng.
/// </summary>
public enum PaymentStatus
{
    /// <summary>
    /// Chưa thanh toán (mặc định với đơn COD).
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Đã thanh toán thành công (VNPay hoặc đã thu tiền COD).
    /// </summary>
    Paid = 2,

    /// <summary>
    /// Đã hoàn tiền một phần.
    /// </summary>
    PartiallyRefunded = 3,

    /// <summary>
    /// Đã hoàn tiền toàn bộ.
    /// </summary>
    Refunded = 4,

    /// <summary>
    /// Thanh toán thất bại.
    /// </summary>
    Failed = 5
}
