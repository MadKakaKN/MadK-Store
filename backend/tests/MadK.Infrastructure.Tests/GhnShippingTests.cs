using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Shipping;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MadK.Infrastructure.Tests;

/// <summary>
/// Bộ kiểm thử toàn diện cho dịch vụ Giao Hàng Nhanh (GHN Logistics):
/// 1. Tính cước phí tự động và áp dụng chính sách Freeship toàn quốc từ 1.000.000đ.
/// 2. Tạo đơn giao hàng sang bưu cục GHN sinh mã TrackingCode (AwbCode) và link in A5.
/// 3. Tính năng Idempotency: Tạo đơn bưu cục lặp lại không tạo trùng mã.
/// 4. Webhook GHN: Shipper đi giao hàng ("delivering") tự động chuyển đơn sang OrderStatus.Shipping.
/// 5. Webhook GHN: Giao hàng thành công ("delivered") tự động chuyển đơn sang Completed và đánh dấu Paid cho đơn COD.
/// 6. Tra cứu chi tiết tiến trình vận đơn GHN.
/// </summary>
public class GhnShippingTests
{
    private readonly GhnSettings _settings = new()
    {
        ApiToken = "d94064d7-4c12-11ef-8e53-0a00184fe694",
        ShopId = "193024",
        BaseUrl = "https://dev-online-gateway.ghn.vn/shiip/public-api",
        FromDistrictId = 1442,
        FromWardCode = "20101",
        SenderName = "MadK Store",
        SenderPhone = "0901316434",
        SenderAddress = "123 Đường Công Nghệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
    };

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryGhnTests_" + Guid.NewGuid())
            .Options;

        return new AppDbContext(options);
    }

    private (GhnShippingService service, AppDbContext context) CreateSut(AppDbContext? context = null)
    {
        var db = context ?? CreateInMemoryDbContext();
        var options = Options.Create(_settings);
        var logger = NullLogger<GhnShippingService>.Instance;
        var httpClient = new HttpClient();

        var service = new GhnShippingService(db, httpClient, options, logger);
        return (service, db);
    }

    private async Task<Order> SeedOrderAsync(
        AppDbContext db,
        decimal totalAmount = 500000m,
        PaymentMethod paymentMethod = PaymentMethod.COD,
        PaymentStatus paymentStatus = PaymentStatus.Pending,
        OrderStatus status = OrderStatus.Processing)
    {
        var orderId = Guid.NewGuid();
        string orderNumber = $"MK-20261105-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var order = new Order
        {
            Id = orderId,
            OrderNumber = orderNumber,
            Status = status,
            PaymentStatus = paymentStatus,
            PaymentMethod = paymentMethod,
            SubtotalAmount = totalAmount,
            TotalAmount = totalAmount,
            ShippingFee = 30000m,
            CustomerPhone = "0901234567",
            ShippingAddressSnapshot = "{\"recipientName\":\"Nguyễn Văn Khách\",\"phoneNumber\":\"0901234567\",\"provinceName\":\"TP Hồ Chí Minh\",\"districtName\":\"Quận 1\",\"wardName\":\"Phường Bến Nghé\",\"fullAddress\":\"123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh\"}",
            CreatedAt = DateTime.UtcNow,
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductNameSnapshot = "Bàn phím cơ MadK Cyber 75",
                    VariantNameSnapshot = "Switch Blue",
                    SkuSnapshot = "MK-CYB-BLU",
                    UnitPriceSnapshot = totalAmount,
                    OriginalPriceSnapshot = totalAmount,
                    Quantity = 1,
                    TotalPrice = totalAmount,
                    AttributesSnapshot = "{}",
                    CreatedAt = DateTime.UtcNow
                }
            }
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order;
    }

    [Fact]
    public async Task CalculateShippingFee_With_Subtotal_Gte_1M_Should_Return_FreeShipping()
    {
        // Arrange
        var (sut, _) = CreateSut();
        var request = new GhnCalculateFeeRequestDto(
            ProvinceName: "TP Hồ Chí Minh",
            DistrictName: "Quận 1",
            SubtotalAmount: 1500000m, // >= 1,000,000đ
            TotalQuantity: 2
        );

        // Act
        var result = await sut.CalculateShippingFeeAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.IsFreeShipping.Should().BeTrue();
        result.Data.TotalFee.Should().Be(0m);
    }

    [Fact]
    public async Task CalculateShippingFee_Under_1M_Should_Calculate_Valid_Fee()
    {
        // Arrange
        var (sut, _) = CreateSut();
        var request = new GhnCalculateFeeRequestDto(
            ProvinceName: "Đà Nẵng",
            DistrictName: "Quận Hải Châu",
            SubtotalAmount: 350000m, // < 1,000,000đ
            TotalQuantity: 1
        );

        // Act
        var result = await sut.CalculateShippingFeeAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.IsFreeShipping.Should().BeFalse();
        result.Data.TotalFee.Should().BeGreaterThan(0m);
        result.Data.ExpectedDeliveryTime.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task CreateShippingOrder_Should_Generate_TrackingCode_And_Update_Order()
    {
        // Arrange
        var (sut, db) = CreateSut();
        var order = await SeedOrderAsync(db, totalAmount: 450000m);

        var request = new GhnCreateShippingOrderRequestDto(order.OrderNumber);

        // Act
        var result = await sut.CreateShippingOrderAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.OrderNumber.Should().Be(order.OrderNumber);
        result.Data.TrackingCode.Should().StartWith("GHN-");
        result.Data.PrintUrl.Should().NotBeNullOrEmpty();

        var refreshed = await db.Orders.FindAsync(order.Id);
        refreshed!.CarrierName.Should().Be("GHN");
        refreshed.TrackingCode.Should().Be(result.Data.TrackingCode);
        refreshed.ShippingStatus.Should().Be("ready_to_pick");
        refreshed.ShippingLabelUrl.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task CreateShippingOrder_When_Already_Exists_Should_Be_Idempotent()
    {
        // Arrange
        var (sut, db) = CreateSut();
        var order = await SeedOrderAsync(db, totalAmount: 600000m);
        var request = new GhnCreateShippingOrderRequestDto(order.OrderNumber);

        // Act 1: Lần tạo thứ nhất
        var firstResult = await sut.CreateShippingOrderAsync(request);
        firstResult.IsSuccess.Should().BeTrue();
        string firstTracking = firstResult.Data.TrackingCode;

        // Act 2: Lần tạo thứ hai
        var secondResult = await sut.CreateShippingOrderAsync(request);

        // Assert 2: Phản hồi thành công với cùng mã vận đơn, không sinh mã mới
        secondResult.IsSuccess.Should().BeTrue();
        secondResult.Data.TrackingCode.Should().Be(firstTracking);
    }

    [Fact]
    public async Task ProcessGhnWebhook_Delivering_Should_Advance_Order_To_Shipping()
    {
        // Arrange
        var (sut, db) = CreateSut();
        var order = await SeedOrderAsync(db, totalAmount: 700000m, status: OrderStatus.Processing);
        order.TrackingCode = "GHN-TEST-12345";
        await db.SaveChangesAsync();

        var payload = new GhnWebhookPayloadDto(
            OrderCode: "GHN-TEST-12345",
            ClientOrderCode: order.OrderNumber,
            Status: "delivering",
            Time: DateTime.UtcNow,
            Description: "Shipper đang giao kiện hàng",
            Reason: null,
            ReasonCode: null,
            ShipperName: "Nguyễn Văn Shipper",
            ShipperPhone: "0987654321",
            Warehouse: "Bưu cục GHN Quận 1"
        );

        // Act
        var response = await sut.ProcessGhnWebhookAsync(payload);

        // Assert
        response.Success.Should().BeTrue();
        var refreshed = await db.Orders.FindAsync(order.Id);
        refreshed!.Status.Should().Be(OrderStatus.Shipping);
        refreshed.ShippingStatus.Should().Be("delivering");
    }

    [Fact]
    public async Task ProcessGhnWebhook_Delivered_With_COD_Should_Advance_To_Completed_And_Mark_Paid()
    {
        // Arrange
        var (sut, db) = CreateSut();
        var order = await SeedOrderAsync(db, totalAmount: 850000m, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.Pending, status: OrderStatus.Shipping);
        order.TrackingCode = "GHN-COD-998877";
        await db.SaveChangesAsync();

        var payload = new GhnWebhookPayloadDto(
            OrderCode: "GHN-COD-998877",
            ClientOrderCode: order.OrderNumber,
            Status: "delivered",
            Time: DateTime.UtcNow,
            Description: "Giao hàng thành công",
            Reason: null,
            ReasonCode: null,
            ShipperName: "Trần Shipper",
            ShipperPhone: "0911223344",
            Warehouse: "Bưu cục GHN"
        );

        // Act
        var response = await sut.ProcessGhnWebhookAsync(payload);

        // Assert
        response.Success.Should().BeTrue();
        var refreshed = await db.Orders.FindAsync(order.Id);
        refreshed!.Status.Should().Be(OrderStatus.Completed);
        refreshed.PaymentStatus.Should().Be(PaymentStatus.Paid); // Shipper đã thu COD -> Đã thanh toán!
        refreshed.ShippingStatus.Should().Be("delivered");
    }

    [Fact]
    public async Task GetTrackingDetail_Should_Return_Tracking_Info_And_Logs()
    {
        // Arrange
        var (sut, db) = CreateSut();
        var order = await SeedOrderAsync(db, totalAmount: 500000m);
        order.TrackingCode = "GHN-TRACK-111";
        order.ShippingStatus = "delivering";
        await db.SaveChangesAsync();

        // Act
        var result = await sut.GetTrackingDetailAsync(order.OrderNumber);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.TrackingCode.Should().Be("GHN-TRACK-111");
        result.Data.Status.Should().Be("delivering");
        result.Data.StatusDescription.Should().NotBeNullOrEmpty();
        result.Data.Logs.Should().NotBeEmpty();
    }
}
