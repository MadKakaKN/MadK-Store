namespace MadK.Application.DTOs.Notifications;

/// <summary>
/// Cấu hình Telegram Bot nhận thông báo kinh doanh (Đơn hàng mới, Tồn kho thấp, Tiền về tài khoản).
/// Nạp qua biến môi trường (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) hoặc appsettings:Telegram.
/// </summary>
public class TelegramSettings
{
    public const string SectionName = "Telegram";

    /// <summary>
    /// Bật/tắt gửi thông báo Telegram. Mặc định true nếu có BotToken và ChatId.
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Token của Telegram Bot do @BotFather cấp (ví dụ: 7123456789:AAH...).
    /// </summary>
    public string? BotToken { get; set; }

    /// <summary>
    /// Chat ID của bạn hoặc ID của Nhóm quản lý nhận tin nhắn (ví dụ: -100123456789 hoặc 123456789).
    /// </summary>
    public string? ChatId { get; set; }

    /// <summary>
    /// Ngưỡng số lượng tồn kho khả dụng để kích hoạt cảnh báo sắp hết hàng. Mặc định 3 cái.
    /// </summary>
    public int LowStockThreshold { get; set; } = 3;
}
