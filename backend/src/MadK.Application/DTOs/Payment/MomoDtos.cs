using MadK.Application.DTOs.Order;
using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Payment;

/// <summary>
/// Cấu hình kết nối tới cổng thanh toán Ví MoMo (All-In-One QR & App Gateway).
/// Hỗ trợ nạp cấu hình qua biến môi trường (MOMO_*) hoặc appsettings.json.
/// </summary>
public class MomoSettings
{
    public const string SectionName = "Momo";

    /// <summary>
    /// Mã đối tác do MoMo cấp (Partner Code).
    /// Mặc định: MOMOBKUN20180529 (Sandbox Test Partner của MoMo).
    /// </summary>
    public string PartnerCode { get; set; } = "MOMOBKUN20180529";

    /// <summary>
    /// Khóa truy cập (Access Key).
    /// </summary>
    public string AccessKey { get; set; } = "klm05TvNBjHgWzWH";

    /// <summary>
    /// Khóa bí mật dùng để tạo và đối soát chữ ký HMAC-SHA256 (Secret Key).
    /// </summary>
    public string SecretKey { get; set; } = "at67qH6mk8w5Y1nAyMoYKMWACiEi2Aca";

    /// <summary>
    /// Endpoint khởi tạo giao dịch thanh toán MoMo v2 (captureWallet).
    /// Sandbox: https://test-payment.momo.vn/v2/gateway/api/create
    /// </summary>
    public string Endpoint { get; set; } = "https://test-payment.momo.vn/v2/gateway/api/create";

    /// <summary>
    /// Endpoint tra cứu trạng thái giao dịch MoMo v2.
    /// Sandbox: https://test-payment.momo.vn/v2/gateway/api/query
    /// </summary>
    public string QueryEndpoint { get; set; } = "https://test-payment.momo.vn/v2/gateway/api/query";

    /// <summary>
    /// URL chuyển hướng người dùng quay lại sau khi thanh toán trên MoMo.
    /// </summary>
    public string ReturnUrl { get; set; } = "http://localhost:5173/checkout/momo-return";

    /// <summary>
    /// Webhook URL để máy chủ MoMo gọi IPN (Instant Payment Notification).
    /// </summary>
    public string IpnUrl { get; set; } = "http://localhost:5000/api/v1/payments/momo/ipn";

    /// <summary>
    /// Thời hạn phiên thanh toán giữ hàng (phút), mặc định 15 phút.
    /// </summary>
    public int PaymentExpiryMinutes { get; set; } = 15;
}

/// <summary>
/// Yêu cầu tạo phiên thanh toán MoMo cho đơn hàng hiện có.
/// </summary>
public record CreateMomoPaymentRequestDto(
    string OrderNumber,
    string? ReturnUrl = null,
    string? IpAddress = null
);

/// <summary>
/// Kết quả phản hồi khi khởi tạo phiên thanh toán MoMo.
/// </summary>
public record MomoPaymentResponseDto(
    string OrderNumber,
    string OrderId,
    string RequestId,
    decimal Amount,
    string PayUrl,
    string? Deeplink,
    string? QrCodeUrl,
    string? ShortLink,
    DateTime ExpiresAt,
    int ResultCode,
    string Message
);

/// <summary>
/// Kết quả checkout trực tiếp đơn hàng bằng MoMo.
/// </summary>
public record CheckoutMomoResponseDto(
    OrderDto Order,
    string PayUrl,
    string? Deeplink,
    string? QrCodeUrl,
    string OrderId,
    DateTime ExpiresAt
);

/// <summary>
/// Dữ liệu gửi đến từ Webhook IPN của máy chủ MoMo (v2 captureWallet).
/// </summary>
public record MomoIpnRequestDto(
    string PartnerCode,
    string OrderId,
    string RequestId,
    long Amount,
    string? OrderInfo,
    string? OrderType,
    long TransId,
    int ResultCode,
    string? Message,
    string? PayType,
    long ResponseTime,
    string? ExtraData,
    string? Signature
);

/// <summary>
/// Phản hồi của hệ thống MadK Store trả về cho máy chủ MoMo sau khi xử lý IPN.
/// </summary>
public record MomoIpnResponseDto(
    string PartnerCode,
    string OrderId,
    string RequestId,
    int ResultCode,
    string Message,
    long ResponseTime,
    string? ExtraData
);

/// <summary>
/// Kết quả xác thực tại trang Return URL của MoMo sau khi khách thanh toán xong.
/// </summary>
public record MomoCallbackResultDto(
    bool IsSuccess,
    string OrderNumber,
    decimal Amount,
    string? TransId,
    int ResultCode,
    string Message,
    PaymentStatus Status,
    OrderStatus OrderStatus
);

/// <summary>
/// DTO phục vụ kiểm thử / giả lập Webhook IPN từ MoMo tại môi trường Localhost.
/// </summary>
public record SimulateMomoIpnRequestDto(
    string OrderNumber,
    int ResultCode = 0,
    decimal? Amount = null,
    long? TransId = null,
    string? Message = "Thành công.",
    bool TamperSignature = false
);
