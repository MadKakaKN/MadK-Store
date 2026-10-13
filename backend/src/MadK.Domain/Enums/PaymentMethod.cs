namespace MadK.Domain.Enums;

/// <summary>
/// Phương thức thanh toán được hỗ trợ.
/// </summary>
public enum PaymentMethod
{
    /// <summary>
    /// Thanh toán khi nhận hàng (Cash On Delivery).
    /// </summary>
    COD = 1,

    /// <summary>
    /// Cổng thanh toán trực tuyến VNPay.
    /// </summary>
    VNPay = 2
}
