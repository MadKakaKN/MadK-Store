using MadK.Application.DTOs.Order;
using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Payment;

/// <summary>
/// Cấu hình kết nối tới cổng thanh toán VNPay Sandbox / Production.
/// Được nạp qua biến môi trường (Vnpay__*) hoặc appsettings.
/// </summary>
public class VnpaySettings
{
    public const string SectionName = "Vnpay";

    /// <summary>
    /// Mã Terminal ID do VNPay cấp (vnp_TmnCode).
    /// </summary>
    public string TmnCode { get; set; } = "MADKTEST";

    /// <summary>
    /// Chuỗi bí mật dùng để ký và xác thực checksum HMAC-SHA512 (vnp_HashSecret).
    /// </summary>
    public string HashSecret { get; set; } = "MADK_VNPAY_SECRET_KEY_FOR_LOCAL_TESTING_2026";

    /// <summary>
    /// URL cổng thanh toán VNPay (Sandbox: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html).
    /// </summary>
    public string BaseUrl { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    /// <summary>
    /// URL trang trả về (Return URL) trên frontend sau khi khách hoàn tất giao diện VNPay.
    /// </summary>
    public string ReturnUrl { get; set; } = "http://localhost:5173/checkout/vnpay-return";

    /// <summary>
    /// Thời gian đơn hàng chờ thanh toán trước khi timeout hết hạn (phút), mặc định 15 phút.
    /// </summary>
    public int PaymentExpiryMinutes { get; set; } = 15;
}

public record CreatePaymentUrlRequestDto(
    string OrderNumber,
    string? ReturnUrl = null,
    string? IpAddress = null
);

public record PaymentUrlResponseDto(
    string PaymentUrl,
    string OrderNumber,
    string TxnRef,
    DateTime ExpiresAt
);

public record CheckoutVnpayResponseDto(
    OrderDto Order,
    string PaymentUrl,
    string TxnRef,
    DateTime ExpiresAt
);

/// <summary>
/// Định dạng phản hồi tiêu chuẩn bắt buộc cho VNPay IPN Webhook.
/// VNPay yêu cầu status code 200 kèm json: {"RspCode": "00", "Message": "Confirm Success"}
/// </summary>
public record VnpayIpnResponseDto(
    string RspCode,
    string Message
);

/// <summary>
/// DTO chứa kết quả xác thực khi người dùng quay lại trang Return URL.
/// Chỉ dùng để hiển thị giao diện người dùng, không phải nguồn sự thật cập nhật dữ liệu.
/// </summary>
public record VnpayCallbackResultDto(
    bool IsSuccess,
    string OrderNumber,
    decimal Amount,
    string? TransactionNo,
    string? BankCode,
    string ResponseCode,
    string? TransactionStatus,
    string Message,
    PaymentStatus Status,
    OrderStatus OrderStatus
);

public record SimulateIpnRequestDto(
    string OrderNumber,
    string ResponseCode = "00",
    decimal? Amount = null,
    string? BankCode = "NCB",
    string? TransactionNo = null,
    bool TamperSignature = false
);

public record PaymentDto(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
    string TxnRef,
    string? TransactionNo,
    decimal Amount,
    string Currency,
    PaymentMethod PaymentMethod,
    PaymentStatus Status,
    string? BankCode,
    string? CardType,
    string? ResponseCode,
    string? TransactionStatus,
    string? OrderInfo,
    DateTime CreatedAt,
    DateTime? PaymentTime
);
