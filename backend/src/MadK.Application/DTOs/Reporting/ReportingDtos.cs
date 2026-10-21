namespace MadK.Application.DTOs.Reporting;

public record DailyOrderStatDto(
    string Date,
    int OrderCount,
    decimal Revenue,
    decimal GrossProfit
);

public record TopSellingProductDto(
    Guid? ProductId,
    Guid? VariantId,
    string ProductName,
    string VariantName,
    string Sku,
    string? ThumbnailUrl,
    int QuantitySold,
    decimal Revenue,
    decimal GrossProfit
);

public record LowStockItemDto(
    Guid VariantId,
    string Sku,
    string ProductName,
    string VariantName,
    string? ThumbnailUrl,
    int OnHand,
    int Reserved,
    int Available,
    int Threshold
);

public record RevenueReportDto(
    decimal TotalRevenue,
    decimal GrossProfit,
    decimal GrossMarginPercentage,
    int TotalOrders,
    int CompletedOrders,
    int CancelledOrders,
    decimal AverageOrderValue,
    List<DailyOrderStatDto> DailyStats,
    List<TopSellingProductDto> TopProducts
);

public record InventoryReportDto(
    int TotalSkus,
    int TotalOnHand,
    int TotalReserved,
    int AvailableStock,
    int LowStockSkuCount,
    List<LowStockItemDto> LowStockItems
);

public record DashboardSummaryDto(
    RevenueReportDto? Revenue,
    InventoryReportDto? Inventory,
    int TotalUsers,
    int TotalProducts,
    int TotalAuditLogs,
    string Role
);
