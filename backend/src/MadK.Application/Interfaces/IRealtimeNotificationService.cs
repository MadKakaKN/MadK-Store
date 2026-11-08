using MadK.Domain.Entities;

namespace MadK.Application.Interfaces;

/// <summary>
/// Giao diện dịch vụ phát thông báo thời gian thực (Real-time SignalR Hub)
/// tới trình duyệt của Quản trị viên (Admin), Nhân viên bán hàng (Sales),
/// Nhân viên kho (Warehouse) và Khách hàng (User).
/// </summary>
public interface IRealtimeNotificationService
{
    /// <summary>
    /// Phát thông báo khi có đơn hàng mới (COD, Online, hoặc POS).
    /// </summary>
    Task SendNewOrderAlertAsync(Order order, CancellationToken ct = default);

    /// <summary>
    /// Phát thông báo khi đơn hàng được chuyển đổi trạng thái (Xác nhận, Đang giao, Hoàn tất, Hủy).
    /// </summary>
    Task SendOrderStatusChangedAlertAsync(Order order, string oldStatus, string newStatus, CancellationToken ct = default);

    /// <summary>
    /// Phát thông báo khi nhận tiền thanh toán thành công (MoMo, VNPay, VietQR, POS).
    /// </summary>
    Task SendPaymentReceivedAlertAsync(string orderNumber, decimal amount, string gateway, string? refCode = null, CancellationToken ct = default);

    /// <summary>
    /// Phát thông báo cảnh báo kho khi biến thể sản phẩm chạm ngưỡng tồn thấp.
    /// </summary>
    Task SendLowStockAlertAsync(string productName, string sku, int availableQuantity, CancellationToken ct = default);
}
