using System.Net;
using System.Text;
using System.Text.Json;
using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MadK.Infrastructure.Services.Notifications;

public class TelegramNotificationService : ITelegramNotificationService
{
    private readonly TelegramSettings _settings;
    private readonly ILogger<TelegramNotificationService> _logger;
    private static readonly HttpClient HttpClient = new(new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(15)
    })
    {
        Timeout = TimeSpan.FromSeconds(10)
    };

    public TelegramNotificationService(
        IOptions<TelegramSettings> options,
        IConfiguration configuration,
        ILogger<TelegramNotificationService> logger)
    {
        _logger = logger;
        _settings = options.Value ?? new TelegramSettings();

        // Ưu tiên đọc biến môi trường TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID
        var envToken = configuration["TELEGRAM_BOT_TOKEN"] ?? Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN");
        if (!string.IsNullOrWhiteSpace(envToken)) _settings.BotToken = envToken.Trim();

        var envChatId = configuration["TELEGRAM_CHAT_ID"] ?? Environment.GetEnvironmentVariable("TELEGRAM_CHAT_ID");
        if (!string.IsNullOrWhiteSpace(envChatId)) _settings.ChatId = envChatId.Trim();

        var envThreshold = configuration["TELEGRAM_LOW_STOCK_THRESHOLD"];
        if (int.TryParse(envThreshold, out var threshold)) _settings.LowStockThreshold = threshold;
    }

    public async Task SendNewOrderAlertAsync(Order order, CancellationToken ct = default)
    {
        if (order == null) return;

        try
        {
            var (recipientName, recipientPhone, fullAddress) = ParseAddressSnapshot(order.ShippingAddressSnapshot);

            string paymentLabel = order.PaymentMethod switch
            {
                PaymentMethod.BankTransfer => "Chuyển khoản VietQR (Techcombank)",
                PaymentMethod.MoMo => "Ví điện tử MoMo",
                PaymentMethod.VNPay => "Cổng VNPay",
                _ => "Thanh toán khi nhận hàng (COD)"
            };

            var sb = new StringBuilder();
            sb.AppendLine("🛍️ <b>ĐƠN HÀNG MỚI ĐÃ ĐƯỢC TẠO</b>");
            sb.AppendLine($"🧾 Mã đơn: <code>#{order.OrderNumber}</code>");
            sb.AppendLine($"👤 Khách: <b>{WebUtility.HtmlEncode(recipientName)}</b> ({WebUtility.HtmlEncode(recipientPhone)})");
            sb.AppendLine($"💰 Tổng tiền: <b>{order.TotalAmount:N0} đ</b>");
            sb.AppendLine($"💳 Phương thức: <b>{paymentLabel}</b>");

            if (!string.IsNullOrWhiteSpace(fullAddress))
            {
                sb.AppendLine($"📍 Giao tới: {WebUtility.HtmlEncode(fullAddress)}");
            }

            if (order.Items != null && order.Items.Count > 0)
            {
                sb.AppendLine($"\n📦 <b>Danh sách sản phẩm ({order.Items.Count} món):</b>");
                foreach (var item in order.Items)
                {
                    sb.AppendLine($"  • {WebUtility.HtmlEncode(item.ProductNameSnapshot)} x{item.Quantity} ({item.TotalPrice:N0}đ)");
                }
            }

            if (!string.IsNullOrWhiteSpace(order.CustomerNote))
            {
                sb.AppendLine($"\n📝 Ghi chú: <i>{WebUtility.HtmlEncode(order.CustomerNote)}</i>");
            }

            sb.AppendLine($"\n⏰ {DateTime.UtcNow.AddHours(7):HH:mm dd/MM/yyyy}");

            await SendMessageAsync(sb.ToString(), ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send Telegram new order alert for {OrderNumber}", order.OrderNumber);
        }
    }

    public async Task SendPaymentReceivedAlertAsync(
        string orderNumber,
        decimal amount,
        string gateway,
        string? refCode = null,
        CancellationToken ct = default)
    {
        try
        {
            var sb = new StringBuilder();
            sb.AppendLine("💰 <b>TIỀN VỀ TÀI KHOẢN! (THANH TOÁN THÀNH CÔNG)</b>");
            sb.AppendLine($"💵 Số tiền: <b>+{amount:N0} đ</b>");
            sb.AppendLine($"🏦 Cổng thanh toán: <b>{WebUtility.HtmlEncode(gateway)}</b>");

            if (!string.IsNullOrWhiteSpace(refCode))
            {
                sb.AppendLine($"🔖 Mã giao dịch: <code>{WebUtility.HtmlEncode(refCode)}</code>");
            }

            sb.AppendLine($"🧾 Mã đơn hàng: <code>#{WebUtility.HtmlEncode(orderNumber)}</code>");
            sb.AppendLine("✅ <i>Hệ thống đã tự động xác nhận đơn sang Đang chuẩn bị hàng (Processing)</i>");
            sb.AppendLine($"⏰ {DateTime.UtcNow.AddHours(7):HH:mm dd/MM/yyyy}");

            await SendMessageAsync(sb.ToString(), ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send Telegram payment received alert for {OrderNumber}", orderNumber);
        }
    }

    public async Task SendLowStockAlertAsync(
        string productName,
        string sku,
        int availableQuantity,
        CancellationToken ct = default)
    {
        try
        {
            var sb = new StringBuilder();
            sb.AppendLine("⚠️ <b>CẢNH BÁO TỒN KHO THẤP!</b>");
            sb.AppendLine($"📦 Sản phẩm: <b>{WebUtility.HtmlEncode(productName)}</b>");
            sb.AppendLine($"🏷️ SKU: <code>{WebUtility.HtmlEncode(sku)}</code>");
            sb.AppendLine($"📊 Tồn kho khả dụng còn: <b>{availableQuantity} chiếc</b>");
            sb.AppendLine("🚨 <i>Vui lòng chuẩn bị kế hoạch nhập thêm hàng để tránh hết hàng!</i>");
            sb.AppendLine($"⏰ {DateTime.UtcNow.AddHours(7):HH:mm dd/MM/yyyy}");

            await SendMessageAsync(sb.ToString(), ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send Telegram low stock alert for {Sku}", sku);
        }
    }

    public async Task<bool> SendMessageAsync(string htmlMessage, CancellationToken ct = default)
    {
        if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.BotToken) || string.IsNullOrWhiteSpace(_settings.ChatId))
        {
            _logger.LogDebug("Telegram notifications skipped (Enabled: {Enabled}, BotToken configured: {HasToken})",
                _settings.Enabled, !string.IsNullOrWhiteSpace(_settings.BotToken));
            return false;
        }

        try
        {
            var url = $"https://api.telegram.org/bot{_settings.BotToken}/sendMessage";
            var payload = new
            {
                chat_id = _settings.ChatId,
                text = htmlMessage,
                parse_mode = "HTML",
                disable_web_page_preview = true
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await HttpClient.PostAsync(url, jsonContent, ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Telegram notification sent successfully to chat {ChatId}", _settings.ChatId);
                return true;
            }

            var errBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Telegram send failed (Status {Status}): {Error}", response.StatusCode, errBody);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error while sending message to Telegram");
            return false;
        }
    }

    private static (string Name, string Phone, string Address) ParseAddressSnapshot(string? snapshot)
    {
        if (string.IsNullOrWhiteSpace(snapshot)) return ("Khách hàng", "", "");

        try
        {
            using var doc = JsonDocument.Parse(snapshot);
            var root = doc.RootElement;

            string name = root.TryGetProperty("recipientName", out var n) ? n.GetString() ?? "Khách hàng" : "Khách hàng";
            string phone = root.TryGetProperty("phoneNumber", out var p) ? p.GetString() ?? "" : "";
            string address = root.TryGetProperty("fullAddress", out var a) ? a.GetString() ?? "" : "";

            return (name, phone, address);
        }
        catch
        {
            return ("Khách hàng", "", "");
        }
    }
}
