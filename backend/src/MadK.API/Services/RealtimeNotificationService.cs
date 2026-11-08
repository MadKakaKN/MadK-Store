using MadK.API.Hubs;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.AspNetCore.SignalR;

namespace MadK.API.Services;

/// <summary>
/// Thực thi dịch vụ phát thông báo thời gian thực qua SignalR Hub.
/// </summary>
public class RealtimeNotificationService : IRealtimeNotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<RealtimeNotificationService> _logger;

    public RealtimeNotificationService(
        IHubContext<NotificationHub> hubContext,
        ILogger<RealtimeNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task SendNewOrderAlertAsync(Order order, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                type = "NEW_ORDER",
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                customerName = order.ShippingAddressSnapshot, // or parse name
                totalAmount = order.TotalAmount,
                paymentMethod = order.PaymentMethod.ToString(),
                createdAt = order.CreatedAt,
                status = order.Status.ToString(),
                title = "🛒 Đơn hàng mới!",
                message = $"Đơn hàng #{order.OrderNumber} vừa được đặt thành công. Tổng tiền: {order.TotalAmount:N0} đ."
            };

            // Bắn cho cả nhóm Quản trị viên (Admin) và Nhân viên bán hàng (Sales)
            await _hubContext.Clients.Groups("Admins", "Sales").SendAsync("ReceiveNewOrder", payload, ct);
            _logger.LogInformation("SignalR: Đã phát thông báo đơn hàng mới #{OrderNumber} tới Admins và Sales", order.OrderNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi phát SignalR thông báo đơn hàng mới #{OrderNumber}", order.OrderNumber);
        }
    }

    /// <inheritdoc />
    public async Task SendOrderStatusChangedAlertAsync(Order order, string oldStatus, string newStatus, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                type = "ORDER_STATUS_CHANGED",
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                oldStatus,
                newStatus,
                updatedAt = DateTime.UtcNow,
                title = $"📦 Cập nhật đơn hàng #{order.OrderNumber}",
                message = $"Trạng thái đơn hàng đã đổi từ '{oldStatus}' sang '{newStatus}'."
            };

            // Gửi cho nhóm quản lý nội bộ
            await _hubContext.Clients.Groups("Admins", "Sales").SendAsync("ReceiveOrderStatusChanged", payload, ct);

            // Nếu đơn thuộc về khách hàng đã đăng nhập, gửi thông báo trực tiếp cho khách đó
            if (order.UserId.HasValue)
            {
                await _hubContext.Clients.Group($"user_{order.UserId.Value}").SendAsync("ReceiveOrderStatusChanged", payload, ct);
            }

            _logger.LogInformation("SignalR: Đã phát thông báo đổi trạng thái đơn #{OrderNumber}: {OldStatus} -> {NewStatus}",
                order.OrderNumber, oldStatus, newStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi phát SignalR đổi trạng thái đơn #{OrderNumber}", order.OrderNumber);
        }
    }

    /// <inheritdoc />
    public async Task SendPaymentReceivedAlertAsync(string orderNumber, decimal amount, string gateway, string? refCode = null, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                type = "PAYMENT_RECEIVED",
                orderNumber,
                amount,
                gateway,
                refCode,
                paidAt = DateTime.UtcNow,
                title = "💰 Thanh toán thành công!",
                message = $"Đã nhận {amount:N0} đ qua cổng {gateway} cho đơn hàng #{orderNumber}."
            };

            await _hubContext.Clients.Groups("Admins", "Sales").SendAsync("ReceivePaymentReceived", payload, ct);
            _logger.LogInformation("SignalR: Đã phát thông báo thanh toán thành công #{OrderNumber} ({Gateway}: {Amount:N0} đ)",
                orderNumber, gateway, amount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi phát SignalR thông báo nhận thanh toán #{OrderNumber}", orderNumber);
        }
    }

    /// <inheritdoc />
    public async Task SendLowStockAlertAsync(string productName, string sku, int availableQuantity, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                type = "LOW_STOCK_WARNING",
                productName,
                sku,
                availableQuantity,
                alertAt = DateTime.UtcNow,
                title = "⚠️ Cảnh báo sắp hết hàng!",
                message = $"Sản phẩm '{productName}' ({sku}) hiện chỉ còn {availableQuantity} chiếc trong kho."
            };

            await _hubContext.Clients.Groups("Admins", "Warehouse").SendAsync("ReceiveLowStockAlert", payload, ct);
            _logger.LogInformation("SignalR: Đã phát thông báo cảnh báo tồn thấp cho SKU {Sku} ({Qty} còn lại)", sku, availableQuantity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi phát SignalR cảnh báo tồn thấp SKU {Sku}", sku);
        }
    }
}
