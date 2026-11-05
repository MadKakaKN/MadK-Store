using MadK.Domain.Entities;

namespace MadK.Application.Interfaces;

/// <summary>
/// Giao diện dịch vụ bắn thông báo tự động tới Telegram Bot của Quản trị viên.
/// </summary>
public interface ITelegramNotificationService
{
    /// <summary>
    /// Gửi thông báo đơn hàng mới vừa được đặt thành công.
    /// </summary>
    Task SendNewOrderAlertAsync(Order order, CancellationToken ct = default);

    /// <summary>
    /// Gửi thông báo khi nhận được thanh toán thành công (VietQR hoặc VNPay).
    /// </summary>
    Task SendPaymentReceivedAlertAsync(string orderNumber, decimal amount, string gateway, string? refCode = null, CancellationToken ct = default);

    /// <summary>
    /// Gửi cảnh báo khi tồn kho của biến thể sản phẩm chạm ngưỡng an toàn.
    /// </summary>
    Task SendLowStockAlertAsync(string productName, string sku, int availableQuantity, CancellationToken ct = default);

    /// <summary>
    /// Gửi tin nhắn tùy chỉnh (dùng cho test bot hoặc thông báo vận hành).
    /// </summary>
    Task<bool> SendMessageAsync(string htmlMessage, CancellationToken ct = default);
}
