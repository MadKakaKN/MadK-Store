using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Pricing;
using MadK.Application.Services;
using MadK.Domain.Constants;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class PricingTests : IClassFixture<AuthMatrixTestFixture>, IAsyncLifetime
{
    private readonly AuthMatrixTestFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public PricingTests(AuthMatrixTestFixture fixture)
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
            "Sales" => _fixture.SalesToken,
            "Warehouse" => _fixture.WarehouseToken,
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
            .UseInMemoryDatabase("InMemoryPricingDb_" + Guid.NewGuid())
            .Options;
        return new AppDbContext(options);
    }

    private static ProductVariant CreateSampleVariant(decimal originalPrice = 20_000_000m, decimal salePrice = 20_000_000m)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím cơ MadK Pro",
            Slug = "ban-phim-co-madk-pro-" + Guid.NewGuid().ToString()[..8],
            BasePrice = salePrice,
            IsActive = true
        };

        return new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Product = product,
            Sku = "MK-PRO-BLK",
            Name = "Màu Đen / Red Switch",
            OriginalPrice = originalPrice,
            SalePrice = salePrice,
            StockQuantity = 100,
            IsActive = true
        };
    }

    [Fact]
    public void CalculateCurrentPrice_BeforePromotionStarts_ReturnsBasePrice()
    {
        // Arrange
        var variant = CreateSampleVariant(originalPrice: 20_000_000m, salePrice: 20_000_000m);
        var tStart = new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);
        var tEnd = new DateTimeOffset(2026, 11, 10, 23, 59, 59, TimeSpan.Zero);

        variant.PriceSchedules.Add(new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Promotion,
            OriginalPrice = 20_000_000m,
            Price = 16_000_000m,
            StartDate = tStart,
            EndDate = tEnd,
            Reason = "Sale 11.11",
            IsActive = true
        });

        using var db = CreateInMemoryDbContext();
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);

        // Act: 1 giây trước khi khuyến mãi bắt đầu
        var beforeTime = tStart.AddSeconds(-1);
        var result = pricingService.CalculateCurrentPrice(variant, beforeTime);

        // Assert
        Assert.False(result.IsOnSale);
        Assert.Equal(20_000_000m, result.CurrentPrice);
        Assert.Equal(20_000_000m, result.OriginalPrice);
    }

    [Fact]
    public void CalculateCurrentPrice_AtPromotionStartBoundary_ReturnsPromotionPrice()
    {
        // Arrange
        var variant = CreateSampleVariant(originalPrice: 20_000_000m, salePrice: 20_000_000m);
        var tStart = new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);
        var tEnd = new DateTimeOffset(2026, 11, 10, 23, 59, 59, TimeSpan.Zero);

        variant.PriceSchedules.Add(new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Promotion,
            OriginalPrice = 20_000_000m,
            Price = 16_000_000m,
            StartDate = tStart,
            EndDate = tEnd,
            Reason = "Sale 11.11",
            IsActive = true
        });

        using var db = CreateInMemoryDbContext();
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);

        // Act: Đúng thời điểm mốc bắt đầu (T_start)
        var result = pricingService.CalculateCurrentPrice(variant, tStart);

        // Assert
        Assert.True(result.IsOnSale);
        Assert.Equal(16_000_000m, result.CurrentPrice);
        Assert.Equal(20_000_000m, result.OriginalPrice);
        Assert.Equal("Sale 11.11", result.PromotionName);
        Assert.Equal(20.0m, result.DiscountPercent);
    }

    [Fact]
    public void CalculateCurrentPrice_DuringPromotion_ReturnsPromotionPrice()
    {
        // Arrange
        var variant = CreateSampleVariant(originalPrice: 20_000_000m, salePrice: 20_000_000m);
        var tStart = new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);
        var tEnd = new DateTimeOffset(2026, 11, 10, 23, 59, 59, TimeSpan.Zero);

        variant.PriceSchedules.Add(new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Promotion,
            OriginalPrice = 20_000_000m,
            Price = 15_000_000m,
            StartDate = tStart,
            EndDate = tEnd,
            Reason = "Giữa đợt khuyến mãi",
            IsActive = true
        });

        using var db = CreateInMemoryDbContext();
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);

        // Act: Giữa khoảng thời gian
        var midTime = new DateTimeOffset(2026, 11, 5, 12, 0, 0, TimeSpan.Zero);
        var result = pricingService.CalculateCurrentPrice(variant, midTime);

        // Assert
        Assert.True(result.IsOnSale);
        Assert.Equal(15_000_000m, result.CurrentPrice);
        Assert.Equal(25.0m, result.DiscountPercent);
    }

    [Fact]
    public void CalculateCurrentPrice_AtPromotionEndBoundary_ReturnsPromotionPrice()
    {
        // Arrange
        var variant = CreateSampleVariant(originalPrice: 20_000_000m, salePrice: 20_000_000m);
        var tStart = new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);
        var tEnd = new DateTimeOffset(2026, 11, 10, 23, 59, 59, TimeSpan.Zero);

        variant.PriceSchedules.Add(new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Promotion,
            OriginalPrice = 20_000_000m,
            Price = 16_000_000m,
            StartDate = tStart,
            EndDate = tEnd,
            Reason = "Sale 11.11",
            IsActive = true
        });

        using var db = CreateInMemoryDbContext();
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);

        // Act: Đúng thời điểm mốc kết thúc (T_end)
        var result = pricingService.CalculateCurrentPrice(variant, tEnd);

        // Assert
        Assert.True(result.IsOnSale);
        Assert.Equal(16_000_000m, result.CurrentPrice);
    }

    [Fact]
    public void CalculateCurrentPrice_AfterPromotionBoundary_ReturnsBasePrice()
    {
        // Arrange
        var variant = CreateSampleVariant(originalPrice: 20_000_000m, salePrice: 20_000_000m);
        var tStart = new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);
        var tEnd = new DateTimeOffset(2026, 11, 10, 23, 59, 59, TimeSpan.Zero);

        variant.PriceSchedules.Add(new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Promotion,
            OriginalPrice = 20_000_000m,
            Price = 16_000_000m,
            StartDate = tStart,
            EndDate = tEnd,
            Reason = "Sale 11.11",
            IsActive = true
        });

        using var db = CreateInMemoryDbContext();
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);

        // Act: 1 giây sau khi khuyến mãi kết thúc
        var afterTime = tEnd.AddSeconds(1);
        var result = pricingService.CalculateCurrentPrice(variant, afterTime);

        // Assert
        Assert.False(result.IsOnSale);
        Assert.Equal(20_000_000m, result.CurrentPrice);
    }

    [Theory]
    [InlineData("2026-11-05", "2026-11-15")] // Bắt đầu trước, kết thúc trong
    [InlineData("2026-11-15", "2026-11-25")] // Bắt đầu trong, kết thúc sau
    [InlineData("2026-11-12", "2026-11-18")] // Nằm trọn bên trong
    [InlineData("2026-11-05", "2026-11-25")] // Bao trùm toàn bộ
    [InlineData("2026-11-10", "2026-11-20")] // Trùng khớp hoàn toàn
    public async Task CreatePromotionSchedule_WhenDatesOverlap_IsRejected(string newStartStr, string newEndStr)
    {
        // Arrange: Đã có khuyến mãi từ 10/11 đến 20/11
        using var db = CreateInMemoryDbContext();
        var variant = CreateSampleVariant();
        db.ProductVariants.Add(variant);

        var existingSchedule = new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Promotion,
            Price = 15_000_000m,
            OriginalPrice = 20_000_000m,
            StartDate = DateTimeOffset.Parse("2026-11-10T00:00:00Z"),
            EndDate = DateTimeOffset.Parse("2026-11-20T23:59:59Z"),
            Reason = "Chương trình hiện có",
            IsActive = true
        };
        db.PriceSchedules.Add(existingSchedule);
        await db.SaveChangesAsync();

        var service = new PricingService(db, NullLogger<PricingService>.Instance);

        var request = new CreatePriceScheduleDto
        {
            Price = 14_000_000m,
            StartDate = DateTimeOffset.Parse(newStartStr + "T00:00:00Z"),
            EndDate = DateTimeOffset.Parse(newEndStr + "T23:59:59Z"),
            Reason = "Chương trình mới trùng lặp"
        };

        // Act
        var result = await service.CreatePromotionScheduleAsync(variant.Id, request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("chồng chéo", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreatePromotionSchedule_WhenDatesDoNotOverlap_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var variant = CreateSampleVariant();
        db.ProductVariants.Add(variant);

        var existing = new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Promotion,
            Price = 15_000_000m,
            OriginalPrice = 20_000_000m,
            StartDate = DateTimeOffset.Parse("2026-11-10T00:00:00Z"),
            EndDate = DateTimeOffset.Parse("2026-11-20T23:59:59Z"),
            Reason = "Đợt 1",
            IsActive = true
        };
        db.PriceSchedules.Add(existing);
        await db.SaveChangesAsync();

        var service = new PricingService(db, NullLogger<PricingService>.Instance);

        // Act: Tạo đợt 2 sau khi đợt 1 kết thúc (từ 21/11 đến 30/11)
        var request = new CreatePriceScheduleDto
        {
            Price = 16_000_000m,
            StartDate = DateTimeOffset.Parse("2026-11-21T00:00:00Z"),
            EndDate = DateTimeOffset.Parse("2026-11-30T23:59:59Z"),
            Reason = "Đợt 2 không trùng lặp"
        };

        var result = await service.CreatePromotionScheduleAsync(variant.Id, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(16_000_000m, result.Data.Price);
    }

    [Fact]
    public async Task CreatePromotionSchedule_WhenEndDateIsBeforeStartDate_ReturnsFailure()
    {
        using var db = CreateInMemoryDbContext();
        var variant = CreateSampleVariant();
        db.ProductVariants.Add(variant);
        await db.SaveChangesAsync();

        var service = new PricingService(db, NullLogger<PricingService>.Instance);

        var request = new CreatePriceScheduleDto
        {
            Price = 15_000_000m,
            StartDate = DateTimeOffset.Parse("2026-11-20T00:00:00Z"),
            EndDate = DateTimeOffset.Parse("2026-11-10T00:00:00Z"), // Kết thúc trước khi bắt đầu
            Reason = "Sai ngày"
        };

        var result = await service.CreatePromotionScheduleAsync(variant.Id, request);

        Assert.False(result.IsSuccess);
        Assert.Contains("kết thúc", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateBasePrice_UpdatesBothPricesAndRecordsAuditLog()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var variant = CreateSampleVariant(originalPrice: 20_000_000m, salePrice: 19_000_000m);
        db.ProductVariants.Add(variant);
        await db.SaveChangesAsync();

        var service = new PricingService(db, NullLogger<PricingService>.Instance);

        // Act: Tăng giá niêm yết lên 25tr, giá bán chuẩn 23tr
        var updateDto = new UpdateBasePriceDto
        {
            NewOriginalPrice = 25_000_000m,
            NewSalePrice = 23_000_000m,
            Reason = "Tăng giá do tỷ giá ngoại tệ Q4"
        };

        var result = await service.UpdateBasePriceAsync(
            variant.Id,
            updateDto,
            actorId: Guid.NewGuid(),
            actorEmail: "admin@madkstore.vn");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(25_000_000m, result.Data!.BaseOriginalPrice);
        Assert.Equal(23_000_000m, result.Data.BaseSalePrice);

        // Kiểm tra lịch sử giá và AuditLog được ghi lại
        var history = await db.PriceSchedules.Where(s => s.VariantId == variant.Id).ToListAsync();
        Assert.Contains(history, s => s.PriceType == PriceType.Standard && s.Price == 23_000_000m);

        var audit = await db.AuditLogs.FirstOrDefaultAsync(a => a.EntityId == variant.Id.ToString() && a.Action == "UpdateBasePrice");
        Assert.NotNull(audit);
        Assert.Equal("admin@madkstore.vn", audit.UserEmail);
    }

    [Fact]
    public async Task PriceChange_PreservesPreviousOrderSnapshot_AndAppliesToNewOrders()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var variant = CreateSampleVariant(originalPrice: 20_000_000m, salePrice: 20_000_000m);
        db.ProductVariants.Add(variant);

        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = "customer@test.com",
            FullName = "Khách Hàng A"
        };
        db.Users.Add(customer);
        await db.SaveChangesAsync();

        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);
        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, inventoryService, pricingService, NullLogger<OrderService>.Instance);

        // 1. ĐƠN HÀNG 1: Đặt lúc chưa có khuyến mãi (giá gốc 20tr)
        var order1Result = await orderService.CheckoutCodAsync(
            userId: customer.Id,
            anonymousId: null,
            request: new CheckoutCodRequestDto(
                ShippingAddress: new ShippingAddressInputDto(
                    RecipientName: "Khách Hàng A",
                    PhoneNumber: "0901234567",
                    ProvinceCode: "01",
                    ProvinceName: "Hà Nội",
                    DistrictCode: "001",
                    DistrictName: "Ba Đình",
                    WardCode: "00001",
                    WardName: "Phúc Xá",
                    DetailedAddress: "123 Phố A"
                ),
                Items: new List<CheckoutItemInputDto>
                {
                    new(variant.Id, 1)
                }
            ));

        Assert.True(order1Result.IsSuccess);
        var order1Number = order1Result.Data!.OrderNumber;

        // Kiểm tra snapshot đơn hàng 1 là 20tr
        var order1Db = await db.Orders.Include(o => o.Items).FirstAsync(o => o.OrderNumber == order1Number);
        Assert.Equal(20_000_000m, order1Db.TotalAmount);
        Assert.Equal(20_000_000m, order1Db.Items.First().UnitPriceSnapshot);

        // 2. KHỞI TẠO KHUYẾN MÃI: Giảm còn 15tr (hiệu lực ngay bây giờ)
        var promoResult = await pricingService.CreatePromotionScheduleAsync(
            variant.Id,
            new CreatePriceScheduleDto
            {
                Price = 15_000_000m,
                StartDate = DateTimeOffset.UtcNow.AddMinutes(-5),
                EndDate = DateTimeOffset.UtcNow.AddDays(3),
                Reason = "Flash sale giảm sốc 15tr"
            },
            actorEmail: "admin@madkstore.vn");

        Assert.True(promoResult.IsSuccess);

        // 3. ĐƠN HÀNG 2: Đặt trong đợt khuyến mãi (phải áp dụng 15tr)
        var order2Result = await orderService.CheckoutCodAsync(
            userId: customer.Id,
            anonymousId: null,
            request: new CheckoutCodRequestDto(
                ShippingAddress: new ShippingAddressInputDto(
                    RecipientName: "Khách Hàng B",
                    PhoneNumber: "0909999999",
                    ProvinceCode: "01",
                    ProvinceName: "Hà Nội",
                    DistrictCode: "001",
                    DistrictName: "Ba Đình",
                    WardCode: "00001",
                    WardName: "Phúc Xá",
                    DetailedAddress: "456 Phố B"
                ),
                Items: new List<CheckoutItemInputDto>
                {
                    new(variant.Id, 1)
                }
            ));

        Assert.True(order2Result.IsSuccess);
        var order2Number = order2Result.Data!.OrderNumber;

        // 4. KIỂM CHỨNG BẤT BIẾN (SNAPSHOT PRESERVATION):
        // Đơn hàng mới (Order 2) tính đúng giá khuyến mãi 15tr
        var order2Db = await db.Orders.Include(o => o.Items).FirstAsync(o => o.OrderNumber == order2Number);
        Assert.Equal(15_000_000m, order2Db.TotalAmount);
        Assert.Equal(15_000_000m, order2Db.Items.First().UnitPriceSnapshot);

        // Đơn hàng cũ (Order 1) TUYỆT ĐỐI KHÔNG BỊ THAY ĐỔI, vẫn giữ nguyên snapshot 20tr!
        var order1Recheck = await db.Orders.Include(o => o.Items).FirstAsync(o => o.OrderNumber == order1Number);
        Assert.Equal(20_000_000m, order1Recheck.TotalAmount);
        Assert.Equal(20_000_000m, order1Recheck.Items.First().UnitPriceSnapshot);
    }

    [Theory]
    [InlineData(Roles.Customer, HttpStatusCode.Forbidden)]
    [InlineData(Roles.Warehouse, HttpStatusCode.Forbidden)]
    [InlineData(Roles.Sales, HttpStatusCode.Forbidden)]
    [InlineData(Roles.Admin, HttpStatusCode.OK)]
    public async Task AdminPricingApi_RolePermissions_EnforcedCorrectly(string role, HttpStatusCode expectedStatus)
    {
        // Arrange
        var client = CreateRoleClient(role);

        // Act
        var response = await client.GetAsync("/api/v1/admin/pricing/variants");

        // Assert
        Assert.Equal(expectedStatus, response.StatusCode);
    }

    [Fact]
    public async Task AdminPricingApi_Anonymous_ReturnsUnauthorized()
    {
        // Arrange
        var client = CreateRoleClient("Anonymous");

        // Act
        var response = await client.GetAsync("/api/v1/admin/pricing/variants");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
