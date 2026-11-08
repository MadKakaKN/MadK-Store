using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace MadK.API.Hubs;

/// <summary>
/// SignalR Hub phát và nhận thông báo thời gian thực cho hệ thống MadK Store.
/// Hỗ trợ phân nhóm:
/// - "Admins": Nhận tất cả thông báo đơn hàng, thanh toán, doanh thu và cảnh báo kho.
/// - "Sales": Nhận thông báo đơn mới cần duyệt, đơn đổi trạng thái và đơn POS.
/// - "Warehouse": Nhận thông báo xuất kho và cảnh báo tồn thấp.
/// - "user_{userId}": Nhận thông báo riêng cho từng khách hàng về tiến trình đơn hàng của họ.
/// </summary>
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var user = Context.User;
        var connectionId = Context.ConnectionId;

        if (user?.Identity?.IsAuthenticated == true)
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value
                ?? user.FindFirst("id")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(connectionId, $"user_{userId}");
            }

            if (user.IsInRole("Admin") || user.IsInRole("SuperAdmin"))
            {
                await Groups.AddToGroupAsync(connectionId, "Admins");
                _logger.LogInformation("SignalR: Quản trị viên đã kết nối (ConnId: {ConnId}, UserId: {UserId})", connectionId, userId);
            }

            if (user.IsInRole("Sales"))
            {
                await Groups.AddToGroupAsync(connectionId, "Sales");
                _logger.LogInformation("SignalR: Nhân viên Sales đã kết nối (ConnId: {ConnId}, UserId: {UserId})", connectionId, userId);
            }

            if (user.IsInRole("Warehouse"))
            {
                await Groups.AddToGroupAsync(connectionId, "Warehouse");
                _logger.LogInformation("SignalR: Nhân viên Kho đã kết nối (ConnId: {ConnId}, UserId: {UserId})", connectionId, userId);
            }
        }
        else
        {
            _logger.LogDebug("SignalR: Khách vãng lai đã kết nối (ConnId: {ConnId})", connectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogDebug("SignalR: Client ngắt kết nối ({ConnId})", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Kiểm tra kết nối 2 chiều giữa client và server (Health check).
    /// </summary>
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }
}
