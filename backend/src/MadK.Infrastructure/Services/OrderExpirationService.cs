using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

/// <summary>
/// Triển khai dịch vụ quét và hủy đơn hàng quá hạn thanh toán.
/// Đảm bảo tính Idempotent và an toàn concurrency khi giải phóng tồn kho.
/// </summary>
public class OrderExpirationService : IOrderExpirationService
{
    private readonly IAppDbContext _context;
    private readonly DbContext _efContext;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<OrderExpirationService> _logger;

    public OrderExpirationService(
        IAppDbContext context,
        IInventoryService inventoryService,
        ILogger<OrderExpirationService> logger)
    {
        _context = context;
        _efContext = (DbContext)context;
        _inventoryService = inventoryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<int> CancelExpiredOrdersAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        // Truy vấn các đơn hàng online đang PendingPayment đã quá thời hạn ExpiresAt
        var expiredOrders = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .Where(o => o.Status == OrderStatus.PendingPayment &&
                        o.ExpiresAt != null &&
                        o.ExpiresAt <= now)
            .ToListAsync(ct);

        if (expiredOrders.Count == 0)
        {
            return 0;
        }

        _logger.LogInformation("Found {Count} expired PendingPayment orders needing cancellation at {Now:u}",
            expiredOrders.Count, now);

        int cancelledCount = 0;

        foreach (var order in expiredOrders)
        {
            try
            {
                // Kiểm tra lại trạng thái để tránh race condition nếu IPN vừa cập nhật xong
                if (order.Status != OrderStatus.PendingPayment)
                {
                    _logger.LogInformation("Order {OrderNumber} status changed to {Status} concurrently. Skipping auto-cancellation.",
                        order.OrderNumber, order.Status);
                    continue;
                }

                bool isRelational = _efContext.Database.IsRelational();
                await using var tx = isRelational ? await _efContext.Database.BeginTransactionAsync(ct) : null;

                try
                {
                    // 1. Giải phóng tồn kho đã giữ (Release) cho từng dòng hàng
                    foreach (var item in order.Items)
                    {
                        if (item.VariantId.HasValue && item.Quantity > 0)
                        {
                            var releaseRes = await _inventoryService.ReleaseAsync(
                                item.VariantId.Value,
                                item.Quantity,
                                "Order",
                                order.OrderNumber,
                                "Hủy giữ hàng do quá hạn thanh toán 15 phút",
                                ct);

                            if (!releaseRes.IsSuccess)
                            {
                                _logger.LogWarning("Release stock warning for order {OrderNumber}, variant {VariantId}: {Err}",
                                    order.OrderNumber, item.VariantId, releaseRes.Error);
                            }
                        }
                    }

                    // 2. Cập nhật trạng thái đơn hàng sang Cancelled
                    var oldStatus = order.Status;
                    order.Status = OrderStatus.Cancelled;
                    order.CancelReason = "Tự động hủy do quá thời hạn thanh toán (15 phút)";
                    order.CancelledAt = now;
                    order.UpdatedAt = now;

                    var history = new OrderStatusHistory
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        FromStatus = oldStatus,
                        ToStatus = OrderStatus.Cancelled,
                        ChangedByName = "Hệ thống (Job hủy đơn quá hạn)",
                        Reason = "Tự động hủy do quá thời hạn thanh toán 15 phút theo docs/order-states.md",
                        CreatedAt = now
                    };

                    _context.OrderStatusHistories.Add(history);
                    order.StatusHistories.Add(history);

                    await _context.SaveChangesAsync(ct);

                    if (tx != null)
                    {
                        await tx.CommitAsync(ct);
                    }

                    cancelledCount++;
                    _logger.LogInformation("Successfully cancelled expired order {OrderNumber} and released reserved stock.",
                        order.OrderNumber);
                }
                catch (Exception ex)
                {
                    if (tx != null) await tx.RollbackAsync(ct);
                    _logger.LogError(ex, "Failed to cancel expired order {OrderNumber}", order.OrderNumber);
                }
            }
            catch (Exception orderEx)
            {
                _logger.LogError(orderEx, "Error processing expiration for order {OrderNumber}", order.OrderNumber);
            }
        }

        return cancelledCount;
    }
}
