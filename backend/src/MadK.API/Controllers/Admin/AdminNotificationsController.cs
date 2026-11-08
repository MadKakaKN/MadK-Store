using MadK.Application.Common;
using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/notifications")]
[Authorize(Roles = "Admin,SuperAdmin,Sales")]
public class AdminNotificationsController : ControllerBase
{
    private readonly ITelegramNotificationService _telegramService;
    private readonly IEmailSender _emailSender;
    private readonly IRealtimeNotificationService _realtimeService;
    private readonly TelegramSettings _telegramSettings;
    private readonly EmailSettings _emailSettings;

    public AdminNotificationsController(
        ITelegramNotificationService telegramService,
        IEmailSender emailSender,
        IRealtimeNotificationService realtimeService,
        IOptions<TelegramSettings> telegramOptions,
        IOptions<EmailSettings> emailOptions)
    {
        _telegramService = telegramService;
        _emailSender = emailSender;
        _realtimeService = realtimeService;
        _telegramSettings = telegramOptions.Value ?? new TelegramSettings();
        _emailSettings = emailOptions.Value ?? new EmailSettings();
    }

    /// <summary>
    /// Lấy trạng thái cấu hình của hệ thống thông báo Telegram Bot.
    /// </summary>
    [HttpGet("telegram/status")]
    public IActionResult GetTelegramStatus()
    {
        var hasToken = !string.IsNullOrWhiteSpace(_telegramSettings.BotToken);
        var hasChatId = !string.IsNullOrWhiteSpace(_telegramSettings.ChatId);

        string? maskedToken = null;
        if (hasToken)
        {
            var token = _telegramSettings.BotToken!;
            maskedToken = token.Length > 8
                ? $"{token[..4]}****{token[^4..]}"
                : "****";
        }

        return Ok(Result<object>.Success(new
        {
            enabled = _telegramSettings.Enabled,
            isConfigured = hasToken && hasChatId,
            botTokenConfigured = hasToken,
            chatIdConfigured = hasChatId,
            maskedBotToken = maskedToken,
            chatId = _telegramSettings.ChatId,
            lowStockThreshold = _telegramSettings.LowStockThreshold
        }, "Lấy trạng thái cấu hình Telegram Bot thành công."));
    }

    /// <summary>
    /// Lấy trạng thái cấu hình của hệ thống Email tự động (SMTP).
    /// </summary>
    [HttpGet("email/status")]
    public IActionResult GetEmailStatus()
    {
        var hasUser = !string.IsNullOrWhiteSpace(_emailSettings.Username);
        var hasPass = !string.IsNullOrWhiteSpace(_emailSettings.Password);

        return Ok(Result<object>.Success(new
        {
            host = _emailSettings.Host,
            port = _emailSettings.Port,
            fromEmail = _emailSettings.FromEmail,
            fromName = _emailSettings.FromName,
            enableSsl = _emailSettings.EnableSsl,
            useMock = _emailSettings.UseMock,
            isConfigured = hasUser && hasPass && !_emailSettings.UseMock
        }, "Lấy trạng thái cấu hình Email SMTP thành công."));
    }

    /// <summary>
    /// Gửi email thử nghiệm tới hộp thư chỉ định để kiểm tra kết nối SMTP.
    /// </summary>
    [HttpPost("email/test")]
    public async Task<IActionResult> TestEmailNotification([FromBody] TestEmailRequestDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.RecipientEmail))
        {
            return BadRequest(Result<bool>.Failure("Vui lòng nhập địa chỉ email nhận thư thử nghiệm."));
        }

        try
        {
            var testOrder = new OrderConfirmationEmailDto(
                OrderNumber: $"TEST-{DateTime.UtcNow:HHmmss}",
                RecipientEmail: request.RecipientEmail.Trim(),
                RecipientName: "Quản trị viên MadK Store",
                RecipientPhone: "0987654321",
                ShippingAddress: "Địa chỉ Showroom MadK Store",
                PaymentMethod: "COD (Thử nghiệm)",
                SubtotalAmount: 18500000m,
                ShippingFee: 0m,
                DiscountAmount: 0m,
                TotalAmount: 18500000m,
                CouponCode: null,
                CustomerNote: "Thử nghiệm hệ thống Email tự động",
                CreatedAt: DateTime.UtcNow,
                Items: new List<OrderItemEmailDto>
                {
                    new("Bàn phím cơ Keychron Q1 Pro Wireless", "Gateron Jupiter Red / Carbon Black", "KEY-Q1-PRO", 1, 4990000m, 4990000m, null),
                    new("Chuột Gaming Logitech G Pro X Superlight 2", "Trắng (White)", "LOGI-GPX-WHT", 1, 3890000m, 3890000m, null),
                    new("Tai nghe Sony WH-1000XM5 Wireless", "Bạc (Silver)", "SONY-XM5-SLV", 1, 9620000m, 9620000m, null)
                }
            );

            await _emailSender.SendOrderConfirmationAsync(testOrder, ct);
            return Ok(Result<bool>.Success(true, $"Đã đưa email thử nghiệm vào hàng đợi gửi tới {request.RecipientEmail}. Vui lòng kiểm tra hộp thư đến (và mục Spam)!"));
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, Result<bool>.Failure("Lỗi gửi email: " + ex.Message));
        }
    }

    /// <summary>
    /// Bắn thông báo thử nghiệm qua SignalR tới tất cả trình duyệt của Admin và Sales đang mở.
    /// </summary>
    [HttpPost("realtime/test")]
    public async Task<IActionResult> TestRealtimeNotification(CancellationToken ct)
    {
        var dummyOrder = new Domain.Entities.Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"MK-TEST-{DateTime.UtcNow:HHmmss}",
            TotalAmount = 25900000m,
            PaymentMethod = Domain.Enums.PaymentMethod.Cash,
            Status = Domain.Enums.OrderStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            ShippingAddressSnapshot = "Khách thử nghiệm Real-time"
        };

        await _realtimeService.SendNewOrderAlertAsync(dummyOrder, ct);
        return Ok(Result<bool>.Success(true, "Đã phát tín hiệu SignalR thử nghiệm tới toàn bộ màn hình Quản trị và Sales!"));
    }

    /// <summary>
    /// Gửi tin nhắn thử nghiệm tới Telegram Bot của Ban Quản Trị.
    /// </summary>
    [HttpPost("telegram/test")]
    public async Task<IActionResult> TestTelegramNotification(CancellationToken ct)
    {
        var hasToken = !string.IsNullOrWhiteSpace(_telegramSettings.BotToken);
        var hasChatId = !string.IsNullOrWhiteSpace(_telegramSettings.ChatId);

        if (!hasToken || !hasChatId)
        {
            return BadRequest(Result<bool>.Failure(
                "Chưa cấu hình Telegram Bot. Vui lòng thiết lập biến môi trường TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID (hoặc cấu hình trong appsettings:Telegram)."));
        }

        var message = "🔔 <b>TEST KẾT NỐI TELEGRAM BOT MADK-STORE</b>\n\n" +
                      "✅ Kết nối từ máy chủ backend tới Telegram Bot đã sẵn sàng!\n" +
                      "📦 Các thông báo đơn hàng mới, thanh toán thành công (VietQR / VNPay), và cảnh báo tồn kho sẽ được gửi tự động qua kênh này.\n\n" +
                      $"⏰ Thời gian: {DateTime.UtcNow.AddHours(7):HH:mm:ss dd/MM/yyyy}";

        var sent = await _telegramService.SendMessageAsync(message, ct);

        if (!sent)
        {
            return StatusCode(StatusCodes.Status502BadGateway, Result<bool>.Failure(
                "Không thể gửi tin nhắn tới Telegram. Vui lòng kiểm tra lại tính chính xác của BotToken và ChatId, hoặc quyền của bot trong đoạn chat."));
        }

        return Ok(Result<bool>.Success(true, "Đã gửi tin nhắn thử nghiệm thành công tới Telegram!"));
    }
}

public record TestEmailRequestDto(string RecipientEmail);
