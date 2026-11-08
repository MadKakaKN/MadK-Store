using System.Text.Json.Serialization;

namespace MadK.Domain.Enums;

/// <summary>
/// Phương thức thanh toán được hỗ trợ.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentMethod
{
    /// <summary>
    /// Thanh toán khi nhận hàng (Cash On Delivery).
    /// </summary>
    COD = 1,

    /// <summary>
    /// Cổng thanh toán trực tuyến VNPay.
    /// </summary>
    VNPay = 2,

    /// <summary>
    /// Chuyển khoản ngân hàng trực tiếp (VietQR Napas 247).
    /// </summary>
    BankTransfer = 3,

    /// <summary>
    /// Ví điện tử MoMo (Chuyển tiền MoMo cá nhân).
    /// </summary>
    MoMo = 4,

    /// <summary>
    /// Tiền mặt thanh toán trực tiếp tại quầy bán hàng (POS).
    /// </summary>
    Cash = 5,

    /// <summary>
    /// Quẹt thẻ ngân hàng qua máy POS tại quầy.
    /// </summary>
    PosCard = 6
}
