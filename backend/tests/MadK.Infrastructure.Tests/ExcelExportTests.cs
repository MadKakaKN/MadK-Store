using FluentAssertions;
using MadK.Application.DTOs.Inventory;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Reporting;
using MadK.Domain.Enums;
using MadK.Infrastructure.Services;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class ExcelExportTests
{
    private readonly ExcelExportService _service = new();

    [Fact]
    public void ExportRevenueReportToCsv_GeneratesUtf8BomAndValidHeaders()
    {
        // Arrange
        var report = new RevenueReportDto(
            TotalRevenue: 15000000m,
            GrossProfit: 4500000m,
            GrossMarginPercentage: 30.0m,
            TotalOrders: 10,
            CompletedOrders: 8,
            CancelledOrders: 2,
            AverageOrderValue: 1500000m,
            DailyStats: new List<DailyOrderStatDto>
            {
                new("2026-11-04", 5, 7500000m, 2250000m),
                new("2026-11-05", 5, 7500000m, 2250000m)
            },
            TopProducts: new List<TopSellingProductDto>
            {
                new(Guid.NewGuid(), Guid.NewGuid(), "Laptop Dell XPS 13", "16GB / 512GB", "DELL-XPS-13", null, 3, 75000000m, 15000000m)
            }
        );

        // Act
        var bytes = _service.ExportRevenueReportToCsv(report, DateTime.UtcNow.AddDays(-7), DateTime.UtcNow);

        // Assert
        bytes.Should().NotBeNullOrEmpty();
        // UTF-8 BOM check: 0xEF, 0xBB, 0xBF
        bytes[0].Should().Be(0xEF);
        bytes[1].Should().Be(0xBB);
        bytes[2].Should().Be(0xBF);

        var content = System.Text.Encoding.UTF8.GetString(bytes);
        content.Should().Contain("BÁO CÁO DOANH THU & HIỆU QUẢ KINH DOANH MADK-STORE");
        content.Should().Contain("Laptop Dell XPS 13");
        content.Should().Contain("DELL-XPS-13");
        content.Should().Contain("15,000,000");
    }

    [Fact]
    public void ExportOrdersToCsv_ProperlyFormatsAndEscapesFields()
    {
        // Arrange
        var orders = new List<OrderDto>
        {
            new(
                Id: Guid.NewGuid(),
                OrderNumber: "MK-20261105-EXP01",
                UserId: Guid.NewGuid(),
                CustomerEmail: "test@example.com",
                CustomerPhone: "0912345678",
                Status: OrderStatus.Completed,
                PaymentStatus: PaymentStatus.Paid,
                PaymentMethod: PaymentMethod.BankTransfer,
                SubtotalAmount: 1200000m,
                DiscountAmount: 50000m,
                ShippingFee: 30000m,
                TotalAmount: 1180000m,
                ShippingAddressSnapshot: "{\"recipientName\":\"Nguyen Van A\",\"phoneNumber\":\"0912345678\",\"fullAddress\":\"123 Le Loi, Phuong Ben Nghe, Quan 1, TP.HCM\"}",
                CustomerNote: "Giao vào buổi sáng, gọi trước khi đến",
                AdminNote: null,
                CancelReason: null,
                CancelledAt: null,
                IdempotencyKey: null,
                Items: new List<OrderItemDto>(),
                StatusHistory: new List<OrderStatusHistoryDto>(),
                CreatedAt: DateTime.UtcNow
            )
        };

        // Act
        var bytes = _service.ExportOrdersToCsv(orders);

        // Assert
        bytes.Should().NotBeNullOrEmpty();
        var content = System.Text.Encoding.UTF8.GetString(bytes);

        content.Should().Contain("DANH SÁCH ĐƠN HÀNG MADK-STORE");
        content.Should().Contain("MK-20261105-EXP01");
        content.Should().Contain("Nguyen Van A");
        content.Should().Contain("Chuyển khoản VietQR");
        content.Should().Contain("Đã thanh toán");
        content.Should().Contain("Hoàn thành");
        // Check CSV escaping for commas in address or notes
        content.Should().Contain("\"123 Le Loi, Phuong Ben Nghe, Quan 1, TP.HCM\"");
        content.Should().Contain("\"Giao vào buổi sáng, gọi trước khi đến\"");
    }

    [Fact]
    public void ExportInventoryToCsv_AccuratelyReportsStockLevels()
    {
        // Arrange
        var items = new List<VariantInventoryItemDto>
        {
            new(
                VariantId: Guid.NewGuid(),
                ProductId: Guid.NewGuid(),
                ProductName: "Áo Thun MadK Oversize",
                VariantName: "Đen / M",
                Sku: "MK-TSHIRT-BLK-M",
                CategoryName: "Áo",
                BrandName: "MadK",
                ThumbnailUrl: null,
                CostPrice: 150000m,
                SalePrice: 250000m,
                OnHandQuantity: 10,
                ReservedQuantity: 2,
                AvailableQuantity: 8,
                UpdatedAt: DateTime.UtcNow
            ),
            new(
                VariantId: Guid.NewGuid(),
                ProductId: Guid.NewGuid(),
                ProductName: "Áo Hoodie MadK Streetwear",
                VariantName: "Đỏ / L",
                Sku: "MK-HOODIE-RED-L",
                CategoryName: "Áo Hoodie",
                BrandName: "MadK",
                ThumbnailUrl: null,
                CostPrice: 300000m,
                SalePrice: 550000m,
                OnHandQuantity: 2,
                ReservedQuantity: 1,
                AvailableQuantity: 1,
                UpdatedAt: DateTime.UtcNow
            )
        };

        // Act
        var bytes = _service.ExportInventoryToCsv(items);

        // Assert
        bytes.Should().NotBeNullOrEmpty();
        var content = System.Text.Encoding.UTF8.GetString(bytes);

        content.Should().Contain("BẢNG KIỂM KÊ TỒN KHO CHI TIẾT MADK-STORE");
        content.Should().Contain("MK-TSHIRT-BLK-M");
        content.Should().Contain("Còn hàng");
        content.Should().Contain("MK-HOODIE-RED-L");
        content.Should().Contain("SẮP HẾT HÀNG");
    }
}
