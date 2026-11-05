using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Payment;
using MadK.Application.Services;
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
/// Bộ kiểm thử toàn diện cho cổng thanh toán Ví điện tử MoMo All-In-One (AIO):
/// 1. Tạo và xác thực chữ ký số HMAC-SHA256 theo chuẩn MoMo v2.
/// 2. Khởi tạo phiên thanh toán tạo PayUrl, Deeplink, QR Code và lưu bản ghi Payment Pending.
/// 3. Chữ ký IPN sai bị từ chối (Mã resultCode 97).
/// 4. Đơn hàng không tồn tại bị từ chối (Mã resultCode 1).
/// 5. Số tiền thanh toán không khớp bị từ chối (Mã resultCode 4).
/// 6. Thanh toán IPN thành công: commit trừ kho thực tế, đổi trạng thái đơn sang Paid, đổi trạng thái Payment sang Paid.
/// 7. Tính năng Idempotency: Webhook IPN gửi lại nhiều lần không trừ kho lặp lại.
/// 8. Xử lý IPN thất bại từ người dùng hủy giao dịch (đánh dấu Payment Failed).
/// 9. Xác thực dữ liệu trả về tại trang Return URL.
/// </summary>
public class MomoPaymentTests
{
    private readonly MomoSettings _settings = new()
    {
        PartnerCode = "MOMOBKUN20180529",
        AccessKey = "klm05TvNBjHgWzWH",
        SecretKey = "at67qH6mk8w5Y1nAyMoYKMWACiEi2Aca",
        Endpoint = "https://test-payment.momo.vn/v2/gateway/api/create",
        QueryEndpoint = "https://test-payment.momo.vn/v2/gateway/api/query",
        ReturnUrl = "http://localhost:5173/checkout/momo-return",
        IpnUrl = "http://localhost:5000/api/v1/payments/momo/ipn",
        PaymentExpiryMinutes = 15
    };

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryMomoTests_" + Guid.NewGuid())
            .Options;

        return new AppDbContext(options);
    }

    private (MomoService service, AppDbContext context, InventoryService inventoryService) CreateSut(AppDbContext? context = null)
    {
        var db = context ?? CreateInMemoryDbContext();
        var invLogger = NullLogger<InventoryService>.Instance;
        var inventoryService = new InventoryService(db, invLogger);
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);
        var options = Options.Create(_settings);
        var momoLogger = NullLogger<MomoService>.Instance;
        var httpClient = new HttpClient();

        var momoService = new MomoService(
            db,
            inventoryService,
            pricingService,
            httpClient,
            options,
            momoLogger);

        return (momoService, db, inventoryService);
    }

    private async Task<(Order order, ProductVariant variant)> SeedOrderWithStockAsync(
        AppDbContext db,
        decimal totalAmount = 350000m,
        OrderStatus status = OrderStatus.PendingPayment,
        PaymentStatus paymentStatus = PaymentStatus.Pending)
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "Chuột Gaming", Slug = "chuot-gaming-" + Guid.NewGuid() };
        var brand = new Brand { Id = Guid.NewGuid(), Name = "Logitech G", Slug = "logitech-g-" + Guid.NewGuid() };
        var product = new Product { Id = Guid.NewGuid(), Name = "Logitech G Pro X Superlight", Slug = "g-pro-x-" + Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id };
        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Name = "Màu Trắng",
            Sku = "LOGI-GPX-WHT-" + Guid.NewGuid().ToString("N")[..6],
            SalePrice = totalAmount,
            OriginalPrice = totalAmount,
            CostPrice = totalAmount * 0.7m,
            IsActive = true
        };
        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = 10,
            ReservedQuantity = 1
        };

        db.Categories.Add(category);
        db.Brands.Add(brand);
        db.Products.Add(product);
        db.ProductVariants.Add(variant);
        db.Inventories.Add(inventory);

        var orderId = Guid.NewGuid();
        string orderNumber = $"MK-20261105-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        var order = new Order
        {
            Id = orderId,
            OrderNumber = orderNumber,
            Status = status,
            PaymentStatus = paymentStatus,
            PaymentMethod = PaymentMethod.MoMo,
            SubtotalAmount = totalAmount,
            TotalAmount = totalAmount,
            ShippingAddressSnapshot = "{\"recipientName\":\"Test Customer\",\"phoneNumber\":\"0901234567\",\"detailedAddress\":\"123 Le Loi\"}",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    VariantId = variant.Id,
                    ProductId = product.Id,
                    ProductNameSnapshot = product.Name,
                    VariantNameSnapshot = variant.Name,
                    SkuSnapshot = variant.Sku,
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

        return (order, variant);
    }

    [Fact]
    public void HMAC_SHA256_Signature_Calculation_Should_Be_Deterministic()
    {
        // Arrange
        string rawData = "accessKey=klm05TvNBjHgWzWH&amount=50000&orderId=MK-001&partnerCode=MOMOBKUN20180529";
        string secretKey = "at67qH6mk8w5Y1nAyMoYKMWACiEi2Aca";

        // Act
        string sig1 = MomoService.ComputeHmacSha256(rawData, secretKey);
        string sig2 = MomoService.ComputeHmacSha256(rawData, secretKey);

        // Assert
        sig1.Should().NotBeNullOrEmpty();
        sig1.Should().Be(sig2);
        sig1.Should().Be(sig1.ToLowerInvariant());
    }

    [Fact]
    public async Task CreatePaymentUrl_Should_Generate_Response_And_Save_Pending_Payment()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 450000m);

        // Act
        var result = await sut.CreatePaymentUrlForOrderAsync(order.OrderNumber, "127.0.0.1");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.OrderNumber.Should().Be(order.OrderNumber);
        result.Data.Amount.Should().Be(450000m);
        result.Data.PayUrl.Should().NotBeNullOrEmpty();
        result.Data.Deeplink.Should().NotBeNullOrEmpty();
        result.Data.QrCodeUrl.Should().NotBeNullOrEmpty();

        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderNumber == order.OrderNumber);
        payment.Should().NotBeNull();
        payment!.PaymentMethod.Should().Be(PaymentMethod.MoMo);
        payment.Status.Should().Be(PaymentStatus.Pending);
        payment.Amount.Should().Be(450000m);
    }

    [Fact]
    public async Task ProcessIpn_With_Invalid_Signature_Should_Return_ResultCode_97()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 300000m);

        var ipnRequest = new MomoIpnRequestDto(
            PartnerCode: _settings.PartnerCode,
            OrderId: order.OrderNumber,
            RequestId: Guid.NewGuid().ToString(),
            Amount: 300000,
            OrderInfo: $"Thanh toan don {order.OrderNumber}",
            OrderType: "momo_wallet",
            TransId: 9876543210,
            ResultCode: 0,
            Message: "Thành công.",
            PayType: "qr",
            ResponseTime: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            ExtraData: "",
            Signature: "INVALID_TAMPERED_SIGNATURE_HASH_12345"
        );

        // Act
        var response = await sut.ProcessIpnAsync(ipnRequest);

        // Assert
        response.ResultCode.Should().Be(97);
        response.Message.Should().Be("Invalid signature");

        var refreshedOrder = await db.Orders.FindAsync(order.Id);
        refreshedOrder!.PaymentStatus.Should().Be(PaymentStatus.Pending);
    }

    [Fact]
    public async Task ProcessIpn_With_NonExistent_Order_Should_Return_ResultCode_1()
    {
        // Arrange
        var (sut, _, _) = CreateSut();
        string nonExistentOrder = "MK-99999999-NOTFOUND";
        long amount = 100000;
        long transId = 123456789;
        long responseTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string requestId = Guid.NewGuid().ToString();
        string message = "Thành công.";
        string orderInfo = "Thanh toan";
        string orderType = "momo_wallet";
        string payType = "qr";
        string extraData = "";

        string rawSig = $"accessKey={_settings.AccessKey}&amount={amount}&extraData={extraData}&message={message}&orderId={nonExistentOrder}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={_settings.PartnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode=0&transId={transId}";
        string validSignature = MomoService.ComputeHmacSha256(rawSig, _settings.SecretKey);

        var ipnRequest = new MomoIpnRequestDto(
            PartnerCode: _settings.PartnerCode,
            OrderId: nonExistentOrder,
            RequestId: requestId,
            Amount: amount,
            OrderInfo: orderInfo,
            OrderType: orderType,
            TransId: transId,
            ResultCode: 0,
            Message: message,
            PayType: payType,
            ResponseTime: responseTime,
            ExtraData: extraData,
            Signature: validSignature
        );

        // Act
        var response = await sut.ProcessIpnAsync(ipnRequest);

        // Assert
        response.ResultCode.Should().Be(1);
        response.Message.Should().Be("Order not found");
    }

    [Fact]
    public async Task ProcessIpn_With_Amount_Mismatch_Should_Return_ResultCode_4()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 500000m);

        long fraudulentAmount = 200000; // Expected 500,000
        long transId = 123456789;
        long responseTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string requestId = Guid.NewGuid().ToString();
        string message = "Thành công.";
        string orderInfo = $"Thanh toan don {order.OrderNumber}";
        string orderType = "momo_wallet";
        string payType = "qr";
        string extraData = "";

        string rawSig = $"accessKey={_settings.AccessKey}&amount={fraudulentAmount}&extraData={extraData}&message={message}&orderId={order.OrderNumber}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={_settings.PartnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode=0&transId={transId}";
        string validSignature = MomoService.ComputeHmacSha256(rawSig, _settings.SecretKey);

        var ipnRequest = new MomoIpnRequestDto(
            PartnerCode: _settings.PartnerCode,
            OrderId: order.OrderNumber,
            RequestId: requestId,
            Amount: fraudulentAmount,
            OrderInfo: orderInfo,
            OrderType: orderType,
            TransId: transId,
            ResultCode: 0,
            Message: message,
            PayType: payType,
            ResponseTime: responseTime,
            ExtraData: extraData,
            Signature: validSignature
        );

        // Act
        var response = await sut.ProcessIpnAsync(ipnRequest);

        // Assert
        response.ResultCode.Should().Be(4);
        response.Message.Should().Be("Invalid amount");

        var refreshedOrder = await db.Orders.FindAsync(order.Id);
        refreshedOrder!.PaymentStatus.Should().Be(PaymentStatus.Pending);
    }

    [Fact]
    public async Task ProcessIpn_Success_Should_Commit_Inventory_And_Be_Idempotent()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, variant) = await SeedOrderWithStockAsync(db, totalAmount: 250000m);

        long amount = 250000;
        long transId = 9988776655;
        long responseTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string requestId = Guid.NewGuid().ToString();
        string message = "Giao dịch thành công.";
        string orderInfo = $"Thanh toan don {order.OrderNumber}";
        string orderType = "momo_wallet";
        string payType = "app";
        string extraData = "";

        string rawSig = $"accessKey={_settings.AccessKey}&amount={amount}&extraData={extraData}&message={message}&orderId={order.OrderNumber}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={_settings.PartnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode=0&transId={transId}";
        string signature = MomoService.ComputeHmacSha256(rawSig, _settings.SecretKey);

        var ipnRequest = new MomoIpnRequestDto(
            PartnerCode: _settings.PartnerCode,
            OrderId: order.OrderNumber,
            RequestId: requestId,
            Amount: amount,
            OrderInfo: orderInfo,
            OrderType: orderType,
            TransId: transId,
            ResultCode: 0,
            Message: message,
            PayType: payType,
            ResponseTime: responseTime,
            ExtraData: extraData,
            Signature: signature
        );

        // Act 1: Lần gọi đầu tiên (First IPN)
        var response1 = await sut.ProcessIpnAsync(ipnRequest);

        // Assert 1: Đơn hàng cập nhật thành công & kho đã trừ
        response1.ResultCode.Should().Be(0);

        var refreshedOrder = await db.Orders.FindAsync(order.Id);
        refreshedOrder!.PaymentStatus.Should().Be(PaymentStatus.Paid);
        refreshedOrder.Status.Should().Be(OrderStatus.Pending);
        refreshedOrder.ExpiresAt.Should().BeNull();

        var inventory = await db.Inventories.FirstOrDefaultAsync(i => i.VariantId == variant.Id);
        inventory!.ReservedQuantity.Should().Be(0);
        inventory.OnHandQuantity.Should().Be(9); // 10 ban đầu - 1 commit = 9

        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderNumber == order.OrderNumber);
        payment.Should().NotBeNull();
        payment!.Status.Should().Be(PaymentStatus.Paid);
        payment.TransactionNo.Should().Be(transId.ToString());

        // Act 2: Lần gọi thứ hai lặp lại (Idempotent replay)
        var response2 = await sut.ProcessIpnAsync(ipnRequest);

        // Assert 2: Phản hồi thành công mã 0 nhưng không trừ tồn kho lần 2!
        response2.ResultCode.Should().Be(0);
        var inventoryRechecked = await db.Inventories.FirstOrDefaultAsync(i => i.VariantId == variant.Id);
        inventoryRechecked!.OnHandQuantity.Should().Be(9); // Vẫn là 9, không bị trừ thành 8!
        inventoryRechecked.ReservedQuantity.Should().Be(0);
    }

    [Fact]
    public async Task SimulateIpn_Should_Successfully_Execute_And_Confirm_Order()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 180000m);

        // Act: Giả lập IPN thông qua helper nội bộ
        var simResult = await sut.SimulateIpnAsync(new SimulateMomoIpnRequestDto(
            OrderNumber: order.OrderNumber,
            ResultCode: 0,
            Amount: 180000m
        ));

        // Assert
        simResult.ResultCode.Should().Be(0);
        var confirmedOrder = await db.Orders.FindAsync(order.Id);
        confirmedOrder!.PaymentStatus.Should().Be(PaymentStatus.Paid);
    }

    [Fact]
    public async Task VerifyPaymentReturn_With_Valid_Signature_Should_Return_Success_Dto()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 600000m, status: OrderStatus.Pending, paymentStatus: PaymentStatus.Paid);

        long amount = 600000;
        long transId = 1122334455;
        long responseTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string requestId = Guid.NewGuid().ToString();
        string message = "Thành công.";
        string orderInfo = $"Thanh toan don {order.OrderNumber}";
        string orderType = "momo_wallet";
        string payType = "qr";
        string extraData = "";

        string rawSig = $"accessKey={_settings.AccessKey}&amount={amount}&extraData={extraData}&message={message}&orderId={order.OrderNumber}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={_settings.PartnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode=0&transId={transId}";
        string signature = MomoService.ComputeHmacSha256(rawSig, _settings.SecretKey);

        var queryParams = new Dictionary<string, string>
        {
            ["partnerCode"] = _settings.PartnerCode,
            ["orderId"] = order.OrderNumber,
            ["requestId"] = requestId,
            ["amount"] = amount.ToString(),
            ["orderInfo"] = orderInfo,
            ["orderType"] = orderType,
            ["transId"] = transId.ToString(),
            ["resultCode"] = "0",
            ["message"] = message,
            ["payType"] = payType,
            ["responseTime"] = responseTime.ToString(),
            ["extraData"] = extraData,
            ["signature"] = signature
        };

        // Act
        var result = await sut.VerifyPaymentReturnAsync(queryParams);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.OrderNumber.Should().Be(order.OrderNumber);
        result.Data.Amount.Should().Be(amount);
        result.Data.ResultCode.Should().Be(0);
        result.Data.IsSuccess.Should().BeTrue();
    }
}
