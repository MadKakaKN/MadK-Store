using MadK.Application.Common;
using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/notifications")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminNotificationsController : ControllerBase
{
    private readonly ITelegramNotificationService _telegramService;
    private readonly TelegramSettings _settings;

    public AdminNotificationsController(
        ITelegramNotificationService telegramService,
        IOptions<TelegramSettings> options)
    {
        _telegramService = telegramService;
        _settings = options.Value ?? new TelegramSettings();
    }

    /// <summary>
    /// Lấy trạng thái cấu hình của hệ thống thông báo Telegram Bot.
    /// </summary>
    [HttpGet("telegram/status")]
    public IActionResult GetTelegramStatus()
    {
        var hasToken = !string.IsNullOrWhiteSpace(_settings.BotToken);
        var hasChatId = !string.IsNullOrWhiteSpace(_settings.ChatId);

        string? maskedToken = null;
        if (hasToken)
        {
            var token = _settings.BotToken!;
            maskedToken = token.Length > 8
                ? $"{token[..4]}****{token[^4..]}"
                : "****";
        }

        return Ok(Result<object>.Success(new
        {
            enabled = _settings.Enabled,
            isConfigured = hasToken && hasChatId,
            botTokenConfigured = hasToken,
            chatIdConfigured = hasChatId,
            maskedBotToken = maskedToken,
            chatId = _settings.ChatId,
            lowStockThreshold = _settings.LowStockThreshold
        }, "Lấy trạng thái cấu hình Telegram Bot thành công."));
    }

    /// <summary>
    /// Gửi tin nhắn thử nghiệm tới Telegram Bot của Ban Quản Trị.
    /// </summary>
    [HttpPost("telegram/test")]
    public async Task<IActionResult> TestTelegramNotification(CancellationToken ct)
    {
        var hasToken = !string.IsNullOrWhiteSpace(_settings.BotToken);
        var hasChatId = !string.IsNullOrWhiteSpace(_settings.ChatId);

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
