using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Reporting;
using MadK.Domain.Constants;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class ReportingAdminTests : IClassFixture<AuthMatrixTestFixture>, IAsyncLifetime
{
    private readonly AuthMatrixTestFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ReportingAdminTests(AuthMatrixTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        await _fixture.EnsureInitializedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private HttpClient CreateRoleClient(string role)
    {
        var client = _fixture.CreateClient();
        var token = role switch
        {
            "Admin" => _fixture.AdminToken,
            "Warehouse" => _fixture.WarehouseToken,
            "Sales" => _fixture.SalesToken,
            "Customer" => _fixture.CustomerToken,
            _ => null
        };

        if (!string.IsNullOrEmpty(token))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return client;
    }

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"MadK_Reporting_Tests_{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task RevenueReport_CalculatesGrossProfit_UsingCostPriceCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var reportingService = new ReportingService(context, NullLogger<ReportingService>.Instance);

        var brand = new Brand { Id = Guid.NewGuid(), Name = "Apple", Slug = "apple-" + Guid.NewGuid() };
        var category = new Category { Id = Guid.NewGuid(), Name = "Phone", Slug = "phone-" + Guid.NewGuid() };
        var product = new Product { Id = Guid.NewGuid(), Name = "iPhone 15 Pro", Slug = "iphone-15-pro-" + Guid.NewGuid(), Brand = brand, Category = category };
        
        var variant1 = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Product = product,
            Sku = "IP15P-256-NAT",
            Name = "Natural Titanium 256GB",
            SalePrice = 28000000m,
            CostPrice = 22000000m, // Lợi nhuận mỗi máy = 6,000,000đ
            StockQuantity = 20
        };

        var variant2 = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Product = product,
            Sku = "IP15P-512-BLK",
            Name = "Black Titanium 512GB",
            SalePrice = 33000000m,
            CostPrice = 25000000m, // Lợi nhuận mỗi máy = 8,000,000đ
            StockQuantity = 10
        };

        context.Brands.Add(brand);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.ProductVariants.AddRange(variant1, variant2);

        // Tạo đơn hàng Completed
        var completedOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-TEST-COMPLETED-01",
            Status = OrderStatus.Completed,
            PaymentStatus = PaymentStatus.Paid,
            TotalAmount = 56000000m, // 2 x variant1
            CreatedAt = DateTime.UtcNow
        };

        completedOrder.Items.Add(new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = completedOrder.Id,
            VariantId = variant1.Id,
            Variant = variant1,
            ProductId = product.Id,
            ProductNameSnapshot = product.Name,
            VariantNameSnapshot = variant1.Name,
            SkuSnapshot = variant1.Sku,
            UnitPriceSnapshot = 28000000m,
            Quantity = 2,
            TotalPrice = 56000000m
        });

        // Tạo đơn hàng Shipping
        var shippingOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-TEST-SHIPPING-02",
            Status = OrderStatus.Shipping,
            PaymentStatus = PaymentStatus.Pending,
            TotalAmount = 33000000m, // 1 x variant2
            CreatedAt = DateTime.UtcNow
        };

        shippingOrder.Items.Add(new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = shippingOrder.Id,
            VariantId = variant2.Id,
            Variant = variant2,
            ProductId = product.Id,
            ProductNameSnapshot = product.Name,
            VariantNameSnapshot = variant2.Name,
            SkuSnapshot = variant2.Sku,
            UnitPriceSnapshot = 33000000m,
            Quantity = 1,
            TotalPrice = 33000000m
        });

        // Tạo đơn Cancelled (không được tính doanh thu và lợi nhuận)
        var cancelledOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-TEST-CANCELLED-03",
            Status = OrderStatus.Cancelled,
            TotalAmount = 28000000m,
            CreatedAt = DateTime.UtcNow
        };

        context.Orders.AddRange(completedOrder, shippingOrder, cancelledOrder);
        await context.SaveChangesAsync();

        // Act
        var result = await reportingService.GetRevenueReportAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        var report = result.Value!;

        // Tổng doanh thu = 56tr + 33tr = 89,000,000 đ
        report.TotalRevenue.Should().Be(89000000m);
        // Giá vốn = (2 * 22tr) + (1 * 25tr) = 44tr + 25tr = 69,000,000 đ
        // Lợi nhuận gộp = 89tr - 69tr = 20,000,000 đ
        report.GrossProfit.Should().Be(20000000m);
        report.GrossMarginPercentage.Should().BeApproximately(22.47m, 0.05m);
        report.TotalOrders.Should().Be(3);
        report.CompletedOrders.Should().Be(1);
        report.CancelledOrders.Should().Be(1);

        // Top sản phẩm bán chạy
        report.TopProducts.Should().HaveCount(2);
        report.TopProducts[0].Sku.Should().Be("IP15P-256-NAT");
        report.TopProducts[0].QuantitySold.Should().Be(2);
        report.TopProducts[0].GrossProfit.Should().Be(12000000m);
    }

    [Fact]
    public async Task InventoryReport_IdentifiesLowStockItemsAccurately()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var reportingService = new ReportingService(context, NullLogger<ReportingService>.Instance);

        var brand = new Brand { Id = Guid.NewGuid(), Name = "Logitech", Slug = "logitech-" + Guid.NewGuid() };
        var category = new Category { Id = Guid.NewGuid(), Name = "Accessories", Slug = "acc-" + Guid.NewGuid() };
        var product = new Product { Id = Guid.NewGuid(), Name = "Mouse MX", Slug = "mouse-mx-" + Guid.NewGuid(), Brand = brand, Category = category };

        var v1 = new ProductVariant { Id = Guid.NewGuid(), ProductId = product.Id, Product = product, Sku = "SKU-PLENTY", Name = "Plenty Stock" };
        var v2 = new ProductVariant { Id = Guid.NewGuid(), ProductId = product.Id, Product = product, Sku = "SKU-CRITICAL", Name = "Low Stock 1" };
        var v3 = new ProductVariant { Id = Guid.NewGuid(), ProductId = product.Id, Product = product, Sku = "SKU-RESERVED", Name = "Low Stock 2" };

        var inv1 = new Inventory { Id = Guid.NewGuid(), VariantId = v1.Id, Variant = v1, OnHandQuantity = 50, ReservedQuantity = 5 }; // Available = 45 > 10
        var inv2 = new Inventory { Id = Guid.NewGuid(), VariantId = v2.Id, Variant = v2, OnHandQuantity = 8, ReservedQuantity = 0 };  // Available = 8 <= 10
        var inv3 = new Inventory { Id = Guid.NewGuid(), VariantId = v3.Id, Variant = v3, OnHandQuantity = 15, ReservedQuantity = 10 }; // Available = 5 <= 10

        context.Brands.Add(brand);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.ProductVariants.AddRange(v1, v2, v3);
        context.Inventories.AddRange(inv1, inv2, inv3);
        await context.SaveChangesAsync();

        // Act
        var result = await reportingService.GetInventoryReportAsync(lowStockThreshold: 10);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var report = result.Value!;

        report.TotalSkus.Should().Be(3);
        report.TotalOnHand.Should().Be(73); // 50 + 8 + 15
        report.TotalReserved.Should().Be(15); // 5 + 0 + 10
        report.AvailableStock.Should().Be(58); // 73 - 15
        report.LowStockSkuCount.Should().Be(2); // inv2 (8) và inv3 (5)
        report.LowStockItems.Should().HaveCount(2);
        report.LowStockItems.Select(x => x.Sku).Should().Contain(new[] { "SKU-CRITICAL", "SKU-RESERVED" });
    }

    [Theory]
    [InlineData("Sales", true, false, false)]
    [InlineData("Warehouse", false, true, false)]
    [InlineData("Admin", true, true, true)]
    public async Task DashboardSummary_EnforcesRoleVisibilityMatrix(
        string role,
        bool expectRevenue,
        bool expectInventory,
        bool expectSystemCounts)
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var reportingService = new ReportingService(context, NullLogger<ReportingService>.Instance);

        // Act
        var result = await reportingService.GetDashboardSummaryAsync(role);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var summary = result.Value!;
        summary.Role.Should().Be(role);

        if (expectRevenue)
        {
            summary.Revenue.Should().NotBeNull();
        }
        else
        {
            summary.Revenue.Should().BeNull();
        }

        if (expectInventory)
        {
            summary.Inventory.Should().NotBeNull();
        }
        else
        {
            summary.Inventory.Should().BeNull();
        }

        if (expectSystemCounts)
        {
            // Admin role loads system counts (users, products, audit logs)
            summary.TotalUsers.Should().BeGreaterThanOrEqualTo(0);
        }
        else
        {
            summary.TotalUsers.Should().Be(0);
            summary.TotalProducts.Should().Be(0);
            summary.TotalAuditLogs.Should().Be(0);
        }
    }

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task GetDashboardSummary_EndpointAuthorization(string role, HttpStatusCode expectedStatus)
    {
        // Arrange
        using var client = CreateRoleClient(role);

        // Act
        var response = await client.GetAsync("/api/v1/admin/reports/dashboard");

        // Assert
        response.StatusCode.Should().Be(expectedStatus);

        if (expectedStatus == HttpStatusCode.OK)
        {
            var content = await response.Content.ReadFromJsonAsync<Result<DashboardSummaryDto>>(_jsonOptions);
            content.Should().NotBeNull();
            content!.IsSuccess.Should().BeTrue();
            content.Value.Should().NotBeNull();
            content.Value!.Role.Should().Be(role);

            if (role == "Sales")
            {
                content.Value.Revenue.Should().NotBeNull();
                content.Value.Inventory.Should().BeNull();
            }
            else if (role == "Warehouse")
            {
                content.Value.Revenue.Should().BeNull();
                content.Value.Inventory.Should().NotBeNull();
            }
            else if (role == "Admin")
            {
                content.Value.Revenue.Should().NotBeNull();
                content.Value.Inventory.Should().NotBeNull();
            }
        }
    }
}
