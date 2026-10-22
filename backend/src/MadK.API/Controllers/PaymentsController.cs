using MadK.Application.Common;
using MadK.Application.DTOs.Payment;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MadK.API.Controllers;

[ApiController]
[EnableRateLimiting("payment-ipn")]
[Route("api/v1/payments/vnpay")]
public class PaymentsController : ControllerBase
{
    private readonly IVnpayService _vnpayService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IVnpayService vnpayService, ILogger<PaymentsController> logger)
    {
        _vnpayService = vnpayService;
        _logger = logger;
    }

    /// <summary>
    /// Sinh URL thanh toán VNPay cho đơn hàng đang ở trạng thái PendingPayment.
    /// Hỗ trợ khách hàng bấm "Thanh toán lại" khi phiên thanh toán trước đó bị gián đoạn.
    /// </summary>
    [HttpPost("create-payment-url")]
    [ProducesResponseType(typeof(Result<PaymentUrlResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<PaymentUrlResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePaymentUrl(
        [FromBody] CreatePaymentUrlRequestDto request,
        CancellationToken ct)
    {
        string clientIp = ResolveClientIp(request.IpAddress);
        var result = await _vnpayService.CreatePaymentUrlForOrderAsync(
            request.OrderNumber, clientIp, request.ReturnUrl, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Xử lý Webhook IPN (Instant Payment Notification) từ cổng thanh toán VNPay.
    /// ĐÂY LÀ NGUỒN SỰ THẬT DUY NHẤT để cập nhật trạng thái đơn hàng:
    /// - Kiểm tra chữ ký HMAC-SHA512 (sai -> code 97).
    /// - Kiểm tra mã đơn (không thấy -> code 01).
    /// - Kiểm tra số tiền khớp (sai -> code 04).
    /// - Idempotent: gọi lặp lại không xử lý hai lần (trả về code 02).
    /// - Lưu trữ toàn bộ payload thô vào bảng Payment để phục vụ đối soát kiểm toán.
    /// </summary>
    [HttpGet("ipn")]
    [ProducesResponseType(typeof(VnpayIpnResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> HandleIpn(CancellationToken ct)
    {
        var queryParams = ExtractQueryParams();
        _logger.LogInformation("VNPay IPN webhook received with {Count} parameters.", queryParams.Count);

        var ipnResult = await _vnpayService.ProcessIpnAsync(queryParams, ct);

        // VNPay quy định phản hồi luôn là HTTP 200 kèm payload JSON dạng {"RspCode": "xx", "Message": "..."}
        return Ok(ipnResult);
    }

    /// <summary>
    /// Trang Return URL gọi endpoint này để xác thực chữ ký và kiểm tra trạng thái đơn.
    /// CHÚ Ý: Endpoint này CHỈ dùng để hiển thị kết quả cho khách, KHÔNG cập nhật trạng thái đơn hàng.
    /// </summary>
    [HttpGet("payment-return")]
    [ProducesResponseType(typeof(Result<VnpayCallbackResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<VnpayCallbackResultDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyPaymentReturn(CancellationToken ct)
    {
        var queryParams = ExtractQueryParams();
        var result = await _vnpayService.VerifyPaymentReturnAsync(queryParams, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Giả lập gọi Webhook IPN phục vụ môi trường Localhost (không cần mở ngrok hay Cloudflare Tunnel).
    /// Tự động sinh chữ ký HMAC-SHA512 hợp lệ theo Secret Key nội bộ và gọi vào pipeline IPN chuẩn.
    /// </summary>
    [HttpPost("simulate-ipn")]
    [ProducesResponseType(typeof(VnpayIpnResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SimulateIpn(
        [FromBody] SimulateIpnRequestDto request,
        CancellationToken ct)
    {
        _logger.LogInformation("Simulating VNPay IPN for order {OrderNumber} with ResponseCode {Code}",
            request.OrderNumber, request.ResponseCode);

        var result = await _vnpayService.SimulateIpnAsync(request, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách lịch sử các giao dịch thanh toán của một đơn hàng (dùng cho đối soát).
    /// </summary>
    [HttpGet("orders/{orderNumber}/transactions")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrderPayments(
        [FromRoute] string orderNumber,
        CancellationToken ct)
    {
        var result = await _vnpayService.GetPaymentsByOrderAsync(orderNumber, ct);
        return Ok(result);
    }

    private Dictionary<string, string> ExtractQueryParams()
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var query in Request.Query)
        {
            if (!string.IsNullOrEmpty(query.Value))
            {
                dict[query.Key] = query.Value.ToString();
            }
        }
        return dict;
    }

    private string ResolveClientIp(string? preferredIp)
    {
        if (!string.IsNullOrWhiteSpace(preferredIp))
        {
            return preferredIp.Trim();
        }

        // Đọc từ proxy header nếu có (Cloudflare / Nginx)
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor) && !string.IsNullOrWhiteSpace(forwardedFor))
        {
            var ips = forwardedFor.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries);
            if (ips.Length > 0) return ips[0].Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}
