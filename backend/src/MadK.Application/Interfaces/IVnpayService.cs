using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Payment;
using MadK.Domain.Entities;

namespace MadK.Application.Interfaces;

/// <summary>
/// Service tích hợp cổng thanh toán trực tuyến VNPay Sandbox.
/// Xử lý tạo URL thanh toán, xác thực chữ ký HMAC-SHA512,
/// và xử lý IPN/Webhook đảm bảo tính Idempotency và an toàn dữ liệu.
/// </summary>
public interface IVnpayService
{
    /// <summary>
    /// Checkout trực tiếp với phương thức thanh toán VNPay:
    /// - Tạo Order ở trạng thái PendingPayment.
    /// - Giữ kho tạm thời (15 phút).
    /// - Tạo bản ghi Payment khởi tạo (Pending).
    /// - Sinh URL chuyển hướng sang cổng thanh toán VNPay Sandbox.
    /// </summary>
    Task<Result<CheckoutVnpayResponseDto>> CheckoutVnpayAsync(
        Guid? userId,
        string? anonymousId,
        CheckoutCodRequestDto request,
        string ipAddress,
        CancellationToken ct = default);

    /// <summary>
    /// Sinh URL thanh toán VNPay cho đơn hàng đang ở trạng thái PendingPayment.
    /// </summary>
    Task<Result<PaymentUrlResponseDto>> CreatePaymentUrlForOrderAsync(
        string orderNumber,
        string ipAddress,
        string? customReturnUrl = null,
        CancellationToken ct = default);

    /// <summary>
    /// Xử lý Webhook IPN (Instant Payment Notification) từ máy chủ VNPay:
    /// - Kiểm tra tính toàn vẹn và chữ ký điện tử HMAC-SHA512.
    /// - Kiểm tra mã đơn hàng và số tiền (vnp_Amount / 100 == order.TotalAmount).
    /// - Đảm bảo Idempotent: Nếu đơn đã thanh toán thì trả về code "02" (Order already confirmed), không xử lý lại.
    /// - Nếu hợp lệ ("00"): Cập nhật Payment -> Paid, Order -> Pending, OrderStatusHistory, và chốt giữ kho.
    /// - Nếu thất bại / hủy: Cập nhật Payment -> Failed, Order -> Cancelled, hoàn lại kho đã giữ.
    /// - Lưu toàn bộ payload thô vào bảng Payment để phục vụ đối soát.
    /// </summary>
    Task<VnpayIpnResponseDto> ProcessIpnAsync(
        IReadOnlyDictionary<string, string> queryParams,
        CancellationToken ct = default);

    /// <summary>
    /// Xác thực thông tin khi trình duyệt khách hàng quay lại trang Return URL.
    /// LƯU Ý: Trang return chỉ hiển thị kết quả cho khách, không tự ý cập nhật trạng thái đơn (IPN là nguồn sự thật).
    /// </summary>
    Task<Result<VnpayCallbackResultDto>> VerifyPaymentReturnAsync(
        IReadOnlyDictionary<string, string> queryParams,
        CancellationToken ct = default);

    /// <summary>
    /// Mô phỏng IPN cục bộ (Local Simulation) phục vụ kiểm thử và phát triển
    /// mà không cần cấu hình domain công khai.
    /// </summary>
    Task<VnpayIpnResponseDto> SimulateIpnAsync(
        SimulateIpnRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Sinh URL thanh toán có kèm chữ ký số HMAC-SHA512 từ thông tin đơn hàng.
    /// </summary>
    string CreatePaymentUrl(
        Order order,
        string txnRef,
        string ipAddress,
        string? customReturnUrl = null);

    /// <summary>
    /// Kiểm tra tính hợp lệ của chữ ký HMAC-SHA512 theo quy chuẩn VNPay 2.1.0.
    /// </summary>
    bool ValidateSignature(IReadOnlyDictionary<string, string> queryParams, string secureHash);

    /// <summary>
    /// Tạo chữ ký số HMAC-SHA512 từ danh sách tham số.
    /// </summary>
    string GenerateSignature(IReadOnlyDictionary<string, string> queryParams);

    /// <summary>
    /// Tra cứu lịch sử các giao dịch thanh toán của một đơn hàng.
    /// </summary>
    Task<Result<IReadOnlyList<PaymentDto>>> GetPaymentsByOrderAsync(
        string orderNumber,
        CancellationToken ct = default);
}
