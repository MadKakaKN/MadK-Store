using MadK.Application.Common;
using MadK.Application.DTOs.Payment;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MadK.API.Controllers;

[ApiController]
[EnableRateLimiting("payment-ipn")]
[Route("api/v1/payments/momo")]
public class MomoPaymentsController : ControllerBase
{
    private readonly IMomoService _momoService;
    private readonly ILogger<MomoPaymentsController> _logger;

    public MomoPaymentsController(IMomoService momoService, ILogger<MomoPaymentsController> logger)
    {
        _momoService = momoService;
        _logger = logger;
    }

    /// <summary>
    /// Khởi tạo phiên thanh toán MoMo cho đơn hàng đang chờ thanh toán (PendingPayment / Pending).
    /// Trả về liên kết chuyển hướng thanh toán (PayUrl), Deeplink App MoMo và mã QR MoMo.
    /// </summary>
    [HttpPost("create")]
    [ProducesResponseType(typeof(Result<MomoPaymentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<MomoPaymentResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePayment(
        [FromBody] CreateMomoPaymentRequestDto request,
        CancellationToken ct)
    {
        string clientIp = ResolveClientIp(request.IpAddress);
        var result = await _momoService.CreatePaymentUrlForOrderAsync(
            request.OrderNumber, clientIp, request.ReturnUrl, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Xử lý Webhook IPN (Instant Payment Notification) từ máy chủ MoMo.
    /// ĐÂY LÀ NGUỒN SỰ THẬT DUY NHẤT để ghi nhận thanh toán:
    /// - Kiểm tra chữ ký HMAC-SHA256 (sai -> resultCode 97).
    /// - Kiểm tra mã đơn (không thấy -> resultCode 1).
    /// - Kiểm tra số tiền khớp (sai -> resultCode 4).
    /// - Idempotent: gọi lặp lại không xử lý hai lần (trả về resultCode 0).
    /// - Trừ kho thực tế và cập nhật trạng thái đơn sang Paid.
    /// </summary>
    [HttpPost("ipn")]
    [ProducesResponseType(typeof(MomoIpnResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> HandleIpn(
        [FromBody] MomoIpnRequestDto ipnRequest,
        CancellationToken ct)
    {
        _logger.LogInformation("MoMo IPN webhook received for OrderId {OrderId}, Amount {Amount}, ResultCode {Code}",
            ipnRequest.OrderId, ipnRequest.Amount, ipnRequest.ResultCode);

        var response = await _momoService.ProcessIpnAsync(ipnRequest, ct);
        return Ok(response);
    }

    /// <summary>
    /// Trang Return URL gọi endpoint này để xác thực chữ ký và kiểm tra trạng thái đơn.
    /// LƯU Ý: Endpoint này CHỈ dùng để hiển thị giao diện cho khách, KHÔNG cập nhật trạng thái đơn hàng.
    /// </summary>
    [HttpGet("payment-return")]
    [ProducesResponseType(typeof(Result<MomoCallbackResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<MomoCallbackResultDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyPaymentReturn(CancellationToken ct)
    {
        var queryParams = ExtractQueryParams();
        var result = await _momoService.VerifyPaymentReturnAsync(queryParams, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Giả lập gọi Webhook IPN phục vụ kiểm thử tại môi trường Localhost (không cần mở ngrok).
    /// Tự động sinh chữ ký HMAC-SHA256 hợp lệ theo Secret Key nội bộ và gọi vào pipeline IPN chuẩn.
    /// </summary>
    [HttpPost("simulate-ipn")]
    [ProducesResponseType(typeof(MomoIpnResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SimulateIpn(
        [FromBody] SimulateMomoIpnRequestDto request,
        CancellationToken ct)
    {
        _logger.LogInformation("Simulating MoMo IPN for order {OrderNumber} with ResultCode {Code}",
            request.OrderNumber, request.ResultCode);

        var result = await _momoService.SimulateIpnAsync(request, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách lịch sử các giao dịch MoMo của một đơn hàng (dùng cho đối soát).
    /// </summary>
    [HttpGet("orders/{orderNumber}/transactions")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrderPayments(
        [FromRoute] string orderNumber,
        CancellationToken ct)
    {
        var result = await _momoService.GetPaymentsByOrderAsync(orderNumber, ct);
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

        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor) && !string.IsNullOrWhiteSpace(forwardedFor))
        {
            var ips = forwardedFor.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries);
            if (ips.Length > 0) return ips[0].Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}
