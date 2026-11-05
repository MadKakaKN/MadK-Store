using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Payment;

namespace MadK.Application.Interfaces;

/// <summary>
/// Giao diện dịch vụ cổng thanh toán Ví điện tử MoMo (MoMo All-In-One Gateway).
/// Hỗ trợ thanh toán App MoMo, Quét mã QR MoMo và Webhook IPN chuẩn v2.
/// </summary>
public interface IMomoService
{
    /// <summary>
    /// Sinh URL / Deeplink / Mã QR thanh toán MoMo cho đơn hàng đang chờ thanh toán (Pending / PendingPayment).
    /// </summary>
    Task<Result<MomoPaymentResponseDto>> CreatePaymentUrlForOrderAsync(
        string orderNumber,
        string? clientIp,
        string? customReturnUrl = null,
        CancellationToken ct = default);

    /// <summary>
    /// Checkout trực tiếp giỏ hàng với phương thức MoMo:
    /// - Tạo đơn hàng trạng thái PendingPayment.
    /// - Giữ hàng tạm thời (15 phút).
    /// - Gọi MoMo Gateway sinh PayUrl / Deeplink / QR Code.
    /// </summary>
    Task<Result<CheckoutMomoResponseDto>> CheckoutMomoAsync(
        Guid? userId,
        string? anonymousId,
        CheckoutCodRequestDto request,
        string clientIp,
        CancellationToken ct = default);

    /// <summary>
    /// Xử lý Webhook IPN (Instant Payment Notification) từ máy chủ MoMo.
    /// ĐÂY LÀ NGUỒN SỰ THẬT DUY NHẤT để ghi nhận thanh toán:
    /// - Kiểm tra chữ ký số HMAC-SHA256.
    /// - Kiểm tra đơn hàng & đối soát số tiền.
    /// - Đảm bảo Idempotency (gọi lại nhiều lần không trừ kho hay cập nhật đúp).
    /// - Trừ kho thực tế, đổi trạng thái đơn sang Paid, bắn thông báo Telegram & gửi email.
    /// </summary>
    Task<MomoIpnResponseDto> ProcessIpnAsync(
        MomoIpnRequestDto ipnRequest,
        CancellationToken ct = default);

    /// <summary>
    /// Xác thực tham số và chữ ký trả về tại trang Return URL (sau khi khách bấm xong trên MoMo).
    /// Chỉ dùng để hiển thị giao diện, không phải nguồn sự thật cập nhật trạng thái đơn hàng.
    /// </summary>
    Task<Result<MomoCallbackResultDto>> VerifyPaymentReturnAsync(
        IReadOnlyDictionary<string, string> queryParams,
        CancellationToken ct = default);

    /// <summary>
    /// Giả lập Webhook IPN của MoMo phục vụ kiểm thử môi trường Localhost (không cần mở ngrok).
    /// Tự động tính chữ ký HMAC-SHA256 hợp lệ theo SecretKey nội bộ.
    /// </summary>
    Task<MomoIpnResponseDto> SimulateIpnAsync(
        SimulateMomoIpnRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách lịch sử giao dịch MoMo của một đơn hàng để đối soát.
    /// </summary>
    Task<Result<IReadOnlyList<PaymentDto>>> GetPaymentsByOrderAsync(
        string orderNumber,
        CancellationToken ct = default);
}
