using System.Text.Json;
using FluentAssertions;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Promotions;
using MadK.Application.DTOs.Shipping;
using MadK.Application.Services;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class CouponAndShippingTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task ValidateAndCalculate_ExpiredCoupon_ShouldReturnFailure()
    {
        var dbName = "CouponTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "EXPIRED2026",
            Description = "Mã hết hạn",
            DiscountType = CouponDiscountType.FixedAmount,
            DiscountValue = 50_000m,
            MinOrderAmount = 100_000m,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(-1),
            UsageLimit = 100,
            UsedCount = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync();

        var couponService = new CouponService(db, null!, NullLogger<CouponService>.Instance);
        var result = await couponService.ValidateAndCalculateDiscountAsync("EXPIRED2026", 200_000m);

        result.IsSuccess.Should().BeFalse();
        (result.Error ?? result.Message).Should().Contain("hết hạn");
    }

    [Fact]
    public async Task ValidateAndCalculate_ExhaustedUsageLimit_ShouldReturnFailure()
    {
        var dbName = "CouponTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "MAXEDOUT",
            Description = "Mã đã hết lượt",
            DiscountType = CouponDiscountType.Percentage,
            DiscountValue = 20m,
            MinOrderAmount = 100_000m,
            StartDate = DateTime.UtcNow.AddDays(-1),
            EndDate = DateTime.UtcNow.AddDays(10),
            UsageLimit = 5,
            UsedCount = 5,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync();

        var couponService = new CouponService(db, null!, NullLogger<CouponService>.Instance);
        var result = await couponService.ValidateAndCalculateDiscountAsync("MAXEDOUT", 200_000m);

        result.IsSuccess.Should().BeFalse();
        (result.Error ?? result.Message).Should().Contain("hết lượt");
    }

    [Fact]
    public async Task ValidateAndCalculate_UnmetMinOrderAmount_ShouldReturnFailure()
    {
        var dbName = "CouponTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "MIN500K",
            Description = "Đơn tối thiểu 500k",
            DiscountType = CouponDiscountType.FixedAmount,
            DiscountValue = 50_000m,
            MinOrderAmount = 500_000m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync();

        var couponService = new CouponService(db, null!, NullLogger<CouponService>.Instance);
        var result = await couponService.ValidateAndCalculateDiscountAsync("MIN500K", 300_000m);

        result.IsSuccess.Should().BeFalse();
        (result.Error ?? result.Message).Should().Contain("tối thiểu");
    }

    [Fact]
    public async Task ValidateAndCalculate_PercentageDiscount_WithMaxCap_ShouldCalculateCorrectly()
    {
        var dbName = "CouponTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "SALE10PERCENT",
            Description = "Giảm 10% tối đa 50k",
            DiscountType = CouponDiscountType.Percentage,
            DiscountValue = 10m,
            MaxDiscountAmount = 50_000m,
            MinOrderAmount = 200_000m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync();

        var couponService = new CouponService(db, null!, NullLogger<CouponService>.Instance);

        // Đơn 300.000đ -> 10% = 30.000đ (< 50k)
        var result1 = await couponService.ValidateAndCalculateDiscountAsync("SALE10PERCENT", 300_000m);
        result1.IsSuccess.Should().BeTrue();
        result1.Data!.DiscountAmount.Should().Be(30_000m);

        // Đơn 1.000.000đ -> 10% = 100.000đ (bị chặn trần 50k)
        var result2 = await couponService.ValidateAndCalculateDiscountAsync("SALE10PERCENT", 1_000_000m);
        result2.IsSuccess.Should().BeTrue();
        result2.Data!.DiscountAmount.Should().Be(50_000m);
    }

    [Fact]
    public async Task StandardShipping_HanoiAndHcm_ShouldCharge20k()
    {
        var service = new StandardShippingFeeService(NullLogger<StandardShippingFeeService>.Instance);

        var reqHanoi = new ShippingCalculationRequestDto(
            ProvinceName: "Thành phố Hà Nội",
            SubtotalAmount: 500_000m,
            TotalQuantity: 1
        );
        var resHanoi = await service.CalculateShippingFeeAsync(reqHanoi);
        resHanoi.IsSuccess.Should().BeTrue();
        resHanoi.Data!.ShippingFee.Should().Be(20_000m);
        resHanoi.Data.IsFreeShipping.Should().BeFalse();

        var reqHcm = new ShippingCalculationRequestDto(
            ProvinceName: "TP. Hồ Chí Minh",
            SubtotalAmount: 500_000m,
            TotalQuantity: 1
        );
        var resHcm = await service.CalculateShippingFeeAsync(reqHcm);
        resHcm.IsSuccess.Should().BeTrue();
        resHcm.Data!.ShippingFee.Should().Be(20_000m);
    }

    [Fact]
    public async Task StandardShipping_OuterProvinces_ShouldCharge35k()
    {
        var service = new StandardShippingFeeService(NullLogger<StandardShippingFeeService>.Instance);

        var req = new ShippingCalculationRequestDto(
            ProvinceName: "Tỉnh Quảng Nam",
            SubtotalAmount: 400_000m,
            TotalQuantity: 1
        );
        var res = await service.CalculateShippingFeeAsync(req);
        res.IsSuccess.Should().BeTrue();
        res.Data!.ShippingFee.Should().Be(35_000m);
        res.Data.IsFreeShipping.Should().BeFalse();
    }

    [Fact]
    public async Task StandardShipping_SubtotalOver1M_ShouldBeFreeShipping()
    {
        var service = new StandardShippingFeeService(NullLogger<StandardShippingFeeService>.Instance);

        var req = new ShippingCalculationRequestDto(
            ProvinceName: "Tỉnh Cà Mau",
            SubtotalAmount: 1_200_000m,
            TotalQuantity: 1
        );
        var res = await service.CalculateShippingFeeAsync(req);
        res.IsSuccess.Should().BeTrue();
        res.Data!.ShippingFee.Should().Be(0m);
        res.Data.IsFreeShipping.Should().BeTrue();
    }

    [Fact]
    public async Task StandardShipping_QuantityOver3_ShouldAddSurcharge()
    {
        var service = new StandardShippingFeeService(NullLogger<StandardShippingFeeService>.Instance);

        var req = new ShippingCalculationRequestDto(
            ProvinceName: "Hà Nội",
            SubtotalAmount: 400_000m,
            TotalQuantity: 4
        );
        var res = await service.CalculateShippingFeeAsync(req);
        res.IsSuccess.Should().BeTrue();
        // 20.000đ base + 10.000đ phụ thu = 30.000đ
        res.Data!.ShippingFee.Should().Be(30_000m);
    }

    [Fact]
    public async Task ConcurrentUsage_WhenOnlyOneSlotLeft_ShouldNotExceedUsageLimit()
    {
        var dbName = "ConcurrentCouponTest_" + Guid.NewGuid();
        // 1. Tạo coupon có đúng 1 slot còn lại (UsageLimit = 10, UsedCount = 9)
        await using (var seedDb = CreateInMemoryDbContext(dbName))
        {
            var coupon = new Coupon
            {
                Id = Guid.NewGuid(),
                Code = "FLASH1SLOT",
                Description = "Chỉ còn 1 suất cuối",
                DiscountType = CouponDiscountType.FixedAmount,
                DiscountValue = 100_000m,
                MinOrderAmount = 200_000m,
                UsageLimit = 10,
                UsedCount = 9,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            seedDb.Coupons.Add(coupon);
            await seedDb.SaveChangesAsync();
        }

        // 2. 5 luồng đồng thời tranh nhau nhận suất cuối cùng
        int concurrentCount = 5;
        var tasks = Enumerable.Range(0, concurrentCount).Select(async i =>
        {
            await using var db = CreateInMemoryDbContext(dbName);
            var service = new CouponService(db, null!, NullLogger<CouponService>.Instance);
            try
            {
                var claimResult = await service.ClaimAndIncrementUsageAsync("FLASH1SLOT", 300_000m);
                if (claimResult.IsSuccess)
                {
                    await db.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (DbUpdateConcurrencyException)
            {
                return false;
            }
        });

        var results = await Task.WhenAll(tasks);
        int successCount = results.Count(r => r);

        // 3. Khẳng định: Chính xác 1 luồng thành công
        successCount.Should().Be(1);

        // 4. Kiểm tra lại dữ liệu trong DB: UsedCount đúng bằng UsageLimit (10), không bao giờ vượt quá
        await using (var verifyDb = CreateInMemoryDbContext(dbName))
        {
            var c = await verifyDb.Coupons.AsNoTracking().FirstAsync(x => x.Code == "FLASH1SLOT");
            c.UsedCount.Should().Be(10);
        }
    }

    [Fact]
    public async Task OrderCheckout_WithValidCouponAndShipping_ShouldSnapshotAccurately()
    {
        var dbName = "OrderCheckoutCouponTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        // 1. Tạo sản phẩm & Tồn kho
        var category = new Category { Id = Guid.NewGuid(), Name = "Bàn phím cơ", Slug = "ban-phim", IsActive = true };
        var brand = new Brand { Id = Guid.NewGuid(), Name = "MadK Custom", Slug = "madk-custom", IsActive = true };
        db.Categories.Add(category);
        db.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím cơ MadK Pro",
            Slug = "ban-phim-co-madk-pro",
            CategoryId = category.Id,
            BrandId = brand.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Product = product,
            Name = "MadK Pro RGB White",
            Sku = "MK-PRO-RGB-W",
            SalePrice = 500_000m,
            OriginalPrice = 600_000m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.ProductVariants.Add(variant);

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = 20,
            ReservedQuantity = 0
        };
        db.Inventories.Add(inventory);

        // 2. Tạo Coupon hợp lệ
        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "WELCOME50K",
            Description = "Giảm 50k cho đơn từ 300k",
            DiscountType = CouponDiscountType.FixedAmount,
            DiscountValue = 50_000m,
            MinOrderAmount = 300_000m,
            UsageLimit = 100,
            UsedCount = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync();

        // 3. Khởi tạo OrderService với CouponService & ShippingFeeService
        var invLogger = NullLogger<InventoryService>.Instance;
        var invService = new InventoryService(db, invLogger);
        var couponService = new CouponService(db, null!, NullLogger<CouponService>.Instance);
        var shippingService = new StandardShippingFeeService(NullLogger<StandardShippingFeeService>.Instance);
        var orderLogger = NullLogger<OrderService>.Instance;

        var orderService = new OrderService(
            db,
            invService,
            pricingService: null,
            couponService: couponService,
            shippingFeeService: shippingService,
            logger: orderLogger);

        // 4. Thực hiện Checkout COD (1 sản phẩm x 500.000đ = 500.000đ, ship Hà Nội = 20.000đ, coupon = 50.000đ, total = 470.000đ)
        var shippingAddress = new ShippingAddressInputDto(
            RecipientName: "Lê Văn Test",
            PhoneNumber: "0987654321",
            ProvinceCode: "01",
            ProvinceName: "Thành phố Hà Nội",
            DistrictCode: "005",
            DistrictName: "Quận Cầu Giấy",
            WardCode: "00169",
            WardName: "Phường Dịch Vọng",
            DetailedAddress: "Số 10 Phạm Văn Đồng"
        );

        var checkoutRequest = new CheckoutCodRequestDto(
            AddressId: null,
            ShippingAddress: shippingAddress,
            Items: new List<CheckoutItemInputDto>
            {
                new(variant.Id, 1)
            },
            CouponCode: "WELCOME50K"
        );

        var checkoutRes = await orderService.CheckoutCodAsync(null, "guest_session_1", checkoutRequest);

        // 5. Khẳng định kết quả đơn hàng
        checkoutRes.IsSuccess.Should().BeTrue();
        var orderDto = checkoutRes.Data!;
        orderDto.SubtotalAmount.Should().Be(500_000m);
        orderDto.ShippingFee.Should().Be(20_000m);
        orderDto.DiscountAmount.Should().Be(50_000m);
        orderDto.TotalAmount.Should().Be(470_000m);
        orderDto.CouponSnapshot.Should().NotBeNullOrWhiteSpace();
        orderDto.CouponSnapshot.Should().Contain("WELCOME50K");
        orderDto.CouponSnapshot.Should().Contain("50000");

        // 6. Kiểm tra lượt dùng của coupon đã tăng lên 1
        var updatedCoupon = await db.Coupons.FirstAsync(c => c.Code == "WELCOME50K");
        updatedCoupon.UsedCount.Should().Be(1);

        // 7. Thử tính năng EstimateCheckout
        var estimateReq = new CheckoutEstimateRequestDto(
            ShippingAddress: checkoutRequest.ShippingAddress,
            Items: checkoutRequest.Items,
            CouponCode: "WELCOME50K"
        );
        var estimateRes = await orderService.EstimateCheckoutAsync(null, "guest_session_1", estimateReq);
        estimateRes.IsSuccess.Should().BeTrue();
        estimateRes.Data!.SubtotalAmount.Should().Be(500_000m);
        estimateRes.Data.ShippingFee.Should().Be(20_000m);
        estimateRes.Data.DiscountAmount.Should().Be(50_000m);
        estimateRes.Data.TotalAmount.Should().Be(470_000m);
        estimateRes.Data.IsCouponValid.Should().BeTrue();
    }
}
