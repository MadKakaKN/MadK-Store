using MadK.Application.Common;
using MadK.Application.DTOs.Reporting;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class ReportingService : IReportingService
{
    private readonly IAppDbContext _context;
    private readonly ILogger<ReportingService> _logger;

    public ReportingService(IAppDbContext context, ILogger<ReportingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Thống kê doanh thu, lợi nhuận gộp, biên lợi nhuận, số đơn theo ngày và top sản phẩm bán chạy.
    /// Sử dụng truy vấn tối ưu, lọc trước ở DB và chỉ load dữ liệu cần thiết.
    /// </summary>
    public async Task<Result<RevenueReportDto>> GetRevenueReportAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        try
        {
            var ordersQuery = _context.Orders.AsNoTracking();

            if (fromDate.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.CreatedAt >= fromDate.Value);
            }
            if (toDate.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.CreatedAt <= toDate.Value);
            }

            var totalOrders = await ordersQuery.CountAsync(ct);
            var completedOrders = await ordersQuery.CountAsync(o => o.Status == OrderStatus.Completed, ct);
            var cancelledOrders = await ordersQuery.CountAsync(o => o.Status == OrderStatus.Cancelled, ct);

            // Doanh thu chỉ tính trên các đơn Hoàn tất hoặc Đang giao hàng
            var qualifyingOrdersQuery = ordersQuery.Where(o => o.Status == OrderStatus.Completed || o.Status == OrderStatus.Shipping);
            var totalRevenue = await qualifyingOrdersQuery.SumAsync(o => o.TotalAmount, ct);

            // Lấy tóm tắt các đơn (chỉ Id, CreatedAt, Status, TotalAmount) để tính biểu đồ ngày tối ưu
            var orderSummaries = await ordersQuery
                .Select(o => new
                {
                    o.Id,
                    o.CreatedAt,
                    o.Status,
                    o.TotalAmount
                })
                .ToListAsync(ct);

            var qualifyingOrderIds = orderSummaries
                .Where(o => o.Status == OrderStatus.Completed || o.Status == OrderStatus.Shipping)
                .Select(o => o.Id)
                .ToHashSet();

            // Truy vấn các item thuộc qualifying orders để tính giá vốn và lợi nhuận gộp
            var itemsData = await _context.OrderItems
                .AsNoTracking()
                .Where(i => qualifyingOrderIds.Contains(i.OrderId))
                .Select(i => new
                {
                    i.OrderId,
                    i.ProductId,
                    i.VariantId,
                    ProductName = i.ProductNameSnapshot,
                    VariantName = i.VariantNameSnapshot,
                    Sku = i.SkuSnapshot,
                    ThumbnailUrl = i.ThumbnailUrlSnapshot,
                    i.Quantity,
                    i.TotalPrice,
                    CostPrice = i.Variant != null ? i.Variant.CostPrice : 0m,
                    SalePrice = i.Variant != null ? i.Variant.SalePrice : 0m,
                    UnitPriceSnapshot = i.UnitPriceSnapshot
                })
                .ToListAsync(ct);

            decimal totalCost = 0m;
            var itemProfitsByOrder = new Dictionary<Guid, decimal>();

            foreach (var item in itemsData)
            {
                decimal unitCost = item.CostPrice > 0
                    ? item.CostPrice
                    : (item.SalePrice * 0.7m > 0 ? item.SalePrice * 0.7m : item.UnitPriceSnapshot * 0.7m);

                decimal itemCost = item.Quantity * unitCost;
                decimal itemGrossProfit = item.TotalPrice - itemCost;
                totalCost += itemCost;

                if (!itemProfitsByOrder.ContainsKey(item.OrderId))
                {
                    itemProfitsByOrder[item.OrderId] = 0m;
                }
                itemProfitsByOrder[item.OrderId] += itemGrossProfit;
            }

            decimal grossProfit = totalRevenue - totalCost;
            decimal grossMarginPct = totalRevenue > 0
                ? Math.Round((grossProfit / totalRevenue) * 100m, 2)
                : 0m;

            decimal aov = completedOrders > 0
                ? Math.Round(totalRevenue / completedOrders, 2)
                : (totalOrders > 0 ? Math.Round(totalRevenue / totalOrders, 2) : 0m);

            // Thống kê theo ngày
            var dailyStats = orderSummaries
                .GroupBy(o => o.CreatedAt.ToString("yyyy-MM-dd"))
                .OrderBy(g => g.Key)
                .Select(g =>
                {
                    var count = g.Count();
                    var dayQualifying = g.Where(o => o.Status == OrderStatus.Completed || o.Status == OrderStatus.Shipping).ToList();
                    var dayRevenue = dayQualifying.Sum(o => o.TotalAmount);
                    var dayProfit = dayQualifying.Sum(o => itemProfitsByOrder.TryGetValue(o.Id, out var p) ? p : 0m);
                    return new DailyOrderStatDto(g.Key, count, dayRevenue, dayProfit);
                })
                .ToList();

            // Top sản phẩm bán chạy
            var topProducts = itemsData
                .GroupBy(i => new { i.ProductId, i.VariantId, i.ProductName, i.VariantName, i.Sku, i.ThumbnailUrl })
                .Select(g =>
                {
                    var q = g.Sum(x => x.Quantity);
                    var rev = g.Sum(x => x.TotalPrice);
                    var cost = g.Sum(x => x.Quantity * (x.CostPrice > 0 ? x.CostPrice : (x.SalePrice * 0.7m > 0 ? x.SalePrice * 0.7m : x.UnitPriceSnapshot * 0.7m)));
                    return new TopSellingProductDto(
                        g.Key.ProductId,
                        g.Key.VariantId,
                        g.Key.ProductName,
                        g.Key.VariantName,
                        g.Key.Sku,
                        g.Key.ThumbnailUrl,
                        q,
                        rev,
                        rev - cost
                    );
                })
                .OrderByDescending(x => x.QuantitySold)
                .Take(10)
                .ToList();

            var report = new RevenueReportDto(
                totalRevenue,
                grossProfit,
                grossMarginPct,
                totalOrders,
                completedOrders,
                cancelledOrders,
                aov,
                dailyStats,
                topProducts
            );

            return Result<RevenueReportDto>.Success(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating revenue report");
            return Result<RevenueReportDto>.Failure($"Lỗi khi tạo báo cáo doanh thu: {ex.Message}");
        }
    }

    /// <summary>
    /// Thống kê số lượng tồn kho (OnHand, Reserved, Available) và danh sách SKU sắp hết hàng.
    /// </summary>
    public async Task<Result<InventoryReportDto>> GetInventoryReportAsync(
        int lowStockThreshold = 10,
        CancellationToken ct = default)
    {
        try
        {
            var totalSkus = await _context.Inventories.CountAsync(ct);
            var totalOnHand = await _context.Inventories.SumAsync(i => (long)i.OnHandQuantity, ct);
            var totalReserved = await _context.Inventories.SumAsync(i => (long)i.ReservedQuantity, ct);
            var availableStock = (int)Math.Max(0, totalOnHand - totalReserved);

            var lowStockQuery = _context.Inventories
                .AsNoTracking()
                .Where(i => (i.OnHandQuantity - i.ReservedQuantity) <= lowStockThreshold);

            var lowStockSkuCount = await lowStockQuery.CountAsync(ct);

            var lowStockEntities = await lowStockQuery
                .Include(i => i.Variant)
                    .ThenInclude(v => v!.Product)
                .Include(i => i.Variant)
                    .ThenInclude(v => v!.Images)
                .OrderBy(i => i.OnHandQuantity - i.ReservedQuantity)
                .Take(50)
                .ToListAsync(ct);

            var lowStockItems = lowStockEntities.Select(i => new LowStockItemDto(
                i.VariantId,
                i.Variant?.Sku ?? string.Empty,
                i.Variant?.Product?.Name ?? string.Empty,
                i.Variant?.Name ?? string.Empty,
                i.Variant?.Images?.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault(),
                i.OnHandQuantity,
                i.ReservedQuantity,
                Math.Max(0, i.OnHandQuantity - i.ReservedQuantity),
                lowStockThreshold
            )).ToList();

            var report = new InventoryReportDto(
                totalSkus,
                (int)totalOnHand,
                (int)totalReserved,
                availableStock,
                lowStockSkuCount,
                lowStockItems
            );

            return Result<InventoryReportDto>.Success(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating inventory report");
            return Result<InventoryReportDto>.Failure($"Lỗi khi tạo báo cáo kho: {ex.Message}");
        }
    }

    /// <summary>
    /// Tổng hợp dashboard điều hành tùy biến theo vai trò của người dùng:
    /// - Sales: Thống kê doanh thu, lợi nhuận, biểu đồ ngày, top bán chạy.
    /// - Warehouse: Tồn kho khả dụng, cảnh báo sắp hết hàng, danh sách SKU cần nhập.
    /// - Admin: Xem toàn bộ các chỉ số của cả doanh thu, tồn kho và hệ thống.
    /// </summary>
    public async Task<Result<DashboardSummaryDto>> GetDashboardSummaryAsync(
        string role,
        CancellationToken ct = default)
    {
        try
        {
            RevenueReportDto? revenueReport = null;
            InventoryReportDto? inventoryReport = null;
            int totalUsers = 0;
            int totalProducts = 0;
            int totalAuditLogs = 0;

            bool canViewRevenue = role.Equals(Roles.Admin, StringComparison.OrdinalIgnoreCase) ||
                                  role.Equals(Roles.Sales, StringComparison.OrdinalIgnoreCase);

            bool canViewInventory = role.Equals(Roles.Admin, StringComparison.OrdinalIgnoreCase) ||
                                    role.Equals(Roles.Warehouse, StringComparison.OrdinalIgnoreCase);

            bool canViewSystemStats = role.Equals(Roles.Admin, StringComparison.OrdinalIgnoreCase);

            if (canViewRevenue)
            {
                var revRes = await GetRevenueReportAsync(ct: ct);
                if (revRes.IsSuccess) revenueReport = revRes.Value;
            }

            if (canViewInventory)
            {
                var invRes = await GetInventoryReportAsync(10, ct);
                if (invRes.IsSuccess) inventoryReport = invRes.Value;
            }

            if (canViewSystemStats)
            {
                totalUsers = await _context.Users.CountAsync(ct);
                totalProducts = await _context.Products.CountAsync(ct);
                totalAuditLogs = await _context.AuditLogs.CountAsync(ct);
            }

            var summary = new DashboardSummaryDto(
                revenueReport,
                inventoryReport,
                totalUsers,
                totalProducts,
                totalAuditLogs,
                role
            );

            return Result<DashboardSummaryDto>.Success(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating dashboard summary");
            return Result<DashboardSummaryDto>.Failure($"Lỗi khi tạo tổng quan dashboard: {ex.Message}");
        }
    }
}
