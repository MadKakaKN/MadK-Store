using MadK.Application.DTOs.Payment;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MadK.API.Controllers;

[ApiController]
[EnableRateLimiting("payment-ipn")]
[Route("api/v1/payments/bank-transfer")]
public class BankTransferWebhookController : ControllerBase
{
    private readonly IBankTransferService _bankTransferService;
    private readonly ILogger<BankTransferWebhookController> _logger;

    public BankTransferWebhookController(
        IBankTransferService bankTransferService,
        ILogger<BankTransferWebhookController> logger)
    {
        _bankTransferService = bankTransferService;
        _logger = logger;
    }

    /// <summary>
    /// Endpoint tiếp nhận Webhook biến động số dư ngân hàng từ SePAY / Casso / VietQR.
    /// Tự động đối soát mã đơn hàng và số tiền để chuyển trạng thái đơn sang Đang xử lý (Processing).
    /// </summary>
    [HttpPost("webhook")]
    [HttpPost("/api/v1/payments/sepay-webhook")]
    [ProducesResponseType(typeof(BankTransferWebhookResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> HandleBankTransferWebhook(
        [FromBody] SepayWebhookDto dto,
        CancellationToken ct)
    {
        string? authHeader = Request.Headers["Authorization"].ToString();
        if (string.IsNullOrWhiteSpace(authHeader))
        {
            authHeader = Request.Headers["X-Api-Key"].ToString();
        }

        _logger.LogInformation("Nhận Webhook VietQR ngân hàng: TransactionId={TxId}, Gateway={Gateway}, Amount={Amount:N0}đ, Content='{Content}'",
            dto?.Id, dto?.Gateway, dto?.TransferAmount, dto?.Content);

        var response = await _bankTransferService.ProcessSepayWebhookAsync(dto!, authHeader, ct);

        // Webhook ngân hàng luôn yêu cầu phản hồi HTTP 200 OK
        return Ok(response);
    }

    /// <summary>
    /// Endpoint mô phỏng chuyển tiền thành công để kiểm thử tính năng tự động duyệt đơn VietQR.
    /// Có thể gọi trực tiếp từ Swagger hoặc Admin Panel.
    /// </summary>
    [HttpPost("simulate")]
    [ProducesResponseType(typeof(BankTransferWebhookResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SimulateTransfer(
        [FromBody] SimulateBankTransferRequestDto request,
        CancellationToken ct)
    {
        _logger.LogInformation("Mô phỏng chuyển khoản VietQR cho đơn {OrderNumber} số tiền {Amount:N0}đ",
            request.OrderNumber, request.Amount);

        var response = await _bankTransferService.SimulateTransferAsync(request, ct);
        return Ok(response);
    }
}
