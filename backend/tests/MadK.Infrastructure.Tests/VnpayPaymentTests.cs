using System.Net;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Payment;
using MadK.Application.Interfaces;
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
/// Bộ kiểm thử toàn diện cho cổng thanh toán VNPay Sandbox:
/// 1. Tạo URL thanh toán có kèm chữ ký số HMAC-SHA512.
/// 2. Chữ ký sai bị từ chối (Mã RspCode 97).
/// 3. Số tiền không khớp bị từ chối (Mã RspCode 04).
/// 4. Không tìm thấy đơn hàng (Mã RspCode 01).
/// 5. Thanh toán sandbox thành công: cập nhật trạng thái đơn (PendingPayment -> Pending, PaymentStatus: Paid).
/// 6. Idempotency: IPN gọi lặp lại không xử lý hai lần (Mã RspCode 02).
/// 7. IPN đến trước khi người dùng quay lại trang (kể cả khi người dùng đóng tab giữa chừng).
/// 8. Bảng Payment lưu mọi giao dịch và payload thô để đối soát kiểm toán.
/// 9. Thanh toán thất bại/hủy giải phóng tồn kho đang giữ và đổi trạng thái sang Cancelled.
/// </summary>
public class VnpayPaymentTests
{
    private readonly VnpaySettings _settings = new()
    {
        TmnCode = "MADKTEST",
        HashSecret = "TEST_SECRET_KEY_FOR_UNIT_TESTING_HMACSHA512_2026",
        BaseUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        ReturnUrl = "http://localhost:5173/checkout/vnpay-return",
        PaymentExpiryMinutes = 15
    };

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryVnpayTests_" + Guid.NewGuid())
            .Options;

        return new AppDbContext(options);
    }

    private (VnpayService service, AppDbContext context, InventoryService inventoryService) CreateSut(AppDbContext? context = null)
    {
        var db = context ?? CreateInMemoryDbContext();
        var invLogger = NullLogger<InventoryService>.Instance;
        var inventoryService = new InventoryService(db, invLogger);
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);
        var options = Options.Create(_settings);
        var vnpayLogger = NullLogger<VnpayService>.Instance;

        var vnpayService = new VnpayService(db, inventoryService, options, vnpayLogger, pricingService);
        return (vnpayService, db, inventoryService);
    }

    private async Task<(Order order, ProductVariant variant)> SeedOrderWithStockAsync(
        AppDbContext db,
        decimal totalAmount = 500000m,
        OrderStatus status = OrderStatus.PendingPayment,
        PaymentStatus paymentStatus = PaymentStatus.Pending)
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "Bàn phím", Slug = "ban-phim-" + Guid.NewGuid() };
        var brand = new Brand { Id = Guid.NewGuid(), Name = "Keychron", Slug = "keychron-" + Guid.NewGuid() };
        var product = new Product { Id = Guid.NewGuid(), Name = "Keychron Q1 Pro", Slug = "keychron-q1-pro-" + Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id };
        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Name = "Carbon Black Switch Red",
            Sku = "KC-Q1P-RED-" + Guid.NewGuid().ToString("N")[..6],
            SalePrice = totalAmount,
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
        string orderNumber = $"MK-20261015-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        var order = new Order
        {
            Id = orderId,
            OrderNumber = orderNumber,
            Status = status,
            PaymentStatus = paymentStatus,
            PaymentMethod = PaymentMethod.VNPay,
            SubtotalAmount = totalAmount,
            TotalAmount = totalAmount,
            ShippingAddressSnapshot = "{\"recipientName\":\"Nguyen Van A\",\"phoneNumber\":\"0912345678\"}",
            CreatedAt = DateTime.UtcNow,
            Items = new List<OrderItem>
            {
                new OrderItem
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
                    TotalPrice = totalAmount
                }
            }
        };


        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return (order, variant);
    }

    [Fact]
    public void CreatePaymentUrl_GeneratesValidUrlWithHmacSha512Checksum()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-20261015-TEST01",
            TotalAmount = 750000m,
            CreatedAt = DateTime.UtcNow
        };

        // Act
        string paymentUrl = sut.CreatePaymentUrl(order, order.OrderNumber, "127.0.0.1");

        // Assert
        paymentUrl.Should().StartWith(_settings.BaseUrl);
        paymentUrl.Should().Contain("vnp_TmnCode=MADKTEST");
        paymentUrl.Should().Contain("vnp_Amount=75000000"); // 750000 * 100
        paymentUrl.Should().Contain($"vnp_TxnRef={order.OrderNumber}");
        paymentUrl.Should().Contain("vnp_SecureHash=");

        // Trích xuất parameters từ URL và kiểm tra chữ ký
        var uri = new Uri(paymentUrl);
        var queryParams = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri.Query)
            .ToDictionary(k => k.Key, v => v.Value.ToString());

        string secureHash = queryParams["vnp_SecureHash"];
        sut.ValidateSignature(queryParams, secureHash).Should().BeTrue();
    }

    [Fact]
    public async Task ProcessIpn_InvalidChecksum_Returns97_AndDoesNotUpdateOrder()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 1000000m);

        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "100000000" },
            { "vnp_BankCode", "NCB" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", order.OrderNumber },
            { "vnp_SecureHash", "invalid_tampered_signature_12345" }
        };

        // Act
        var response = await sut.ProcessIpnAsync(ipnParams);

        // Assert
        response.RspCode.Should().Be("97");
        response.Message.Should().Be("Invalid Checksum");

        // Đơn hàng KHÔNG được thay đổi trạng thái
        var updatedOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        updatedOrder.Status.Should().Be(OrderStatus.PendingPayment);
        updatedOrder.PaymentStatus.Should().Be(PaymentStatus.Pending);
    }

    [Fact]
    public async Task ProcessIpn_OrderNotFound_Returns01()
    {
        // Arrange
        var (sut, _, _) = CreateSut();
        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "50000000" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", "MK-NONEXISTENT-ORDER" }
        };
        string validHash = sut.GenerateSignature(ipnParams);
        ipnParams["vnp_SecureHash"] = validHash;

        // Act
        var response = await sut.ProcessIpnAsync(ipnParams);

        // Assert
        response.RspCode.Should().Be("01");
        response.Message.Should().Be("Order not found");
    }

    [Fact]
    public async Task ProcessIpn_AmountMismatch_Returns04_AndDoesNotUpdateOrder()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 500000m);

        // Kẻ gian cố tình gửi số tiền chỉ 10,000 VND (1000000 cent)
        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "1000000" }, // 10,000 đ != 500,000 đ
            { "vnp_BankCode", "NCB" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", order.OrderNumber }
        };
        string validHash = sut.GenerateSignature(ipnParams);
        ipnParams["vnp_SecureHash"] = validHash;

        // Act
        var response = await sut.ProcessIpnAsync(ipnParams);

        // Assert
        response.RspCode.Should().Be("04");
        response.Message.Should().Be("Invalid amount");

        var updatedOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        updatedOrder.Status.Should().Be(OrderStatus.PendingPayment);
        updatedOrder.PaymentStatus.Should().Be(PaymentStatus.Pending);
    }

    [Fact]
    public async Task ProcessIpn_Success_UpdatesOrderToPendingAndPaid_AndCreatesPaymentRecord()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 1200000m);

        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "120000000" }, // 1,200,000 * 100
            { "vnp_BankCode", "NCB" },
            { "vnp_BankTranNo", "VNP14820261015" },
            { "vnp_CardType", "ATM" },
            { "vnp_OrderInfo", $"Thanh toan don hang {order.OrderNumber}" },
            { "vnp_PayDate", "20261015143000" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "14820999" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", order.OrderNumber }
        };
        string validHash = sut.GenerateSignature(ipnParams);
        ipnParams["vnp_SecureHash"] = validHash;

        // Act
        var response = await sut.ProcessIpnAsync(ipnParams);

        // Assert
        response.RspCode.Should().Be("00");
        response.Message.Should().Be("Confirm Success");

        // 1. Kiểm tra trạng thái Order: Chuyển sang Pending (chờ Sales duyệt) và PaymentStatus: Paid
        var updatedOrder = await db.Orders
            .Include(o => o.StatusHistories)
            .FirstAsync(o => o.Id == order.Id);

        updatedOrder.Status.Should().Be(OrderStatus.Pending);
        updatedOrder.PaymentStatus.Should().Be(PaymentStatus.Paid);
        updatedOrder.StatusHistories.Should().Contain(h =>
            h.FromStatus == OrderStatus.PendingPayment &&
            h.ToStatus == OrderStatus.Pending &&
            h.ChangedByName == "VNPay IPN Gateway");

        // 2. Bảng Payment phải có bản ghi ghi nhận giao dịch thành công
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderNumber == order.OrderNumber);
        payment.Should().NotBeNull();
        payment!.Status.Should().Be(PaymentStatus.Paid);
        payment.TransactionNo.Should().Be("14820999");
        payment.BankCode.Should().Be("NCB");
        payment.Amount.Should().Be(1200000m);
        payment.RawPayload.Should().Contain("14820999");
    }

    [Fact]
    public async Task ProcessIpn_DuplicateCall_IsIdempotent_Returns02_AndDoesNotModifyTwice()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 850000m);

        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "85000000" },
            { "vnp_BankCode", "NCB" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "TXN123456" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", order.OrderNumber }
        };
        string validHash = sut.GenerateSignature(ipnParams);
        ipnParams["vnp_SecureHash"] = validHash;

        // Lần gọi 1: Thành công
        var firstResponse = await sut.ProcessIpnAsync(ipnParams);
        firstResponse.RspCode.Should().Be("00");

        var orderAfterFirst = await db.Orders.Include(o => o.StatusHistories).FirstAsync(o => o.Id == order.Id);
        int historyCountAfterFirst = orderAfterFirst.StatusHistories.Count;

        // Act - Lần gọi 2 (IPN retry lặp lại): Hệ thống phải idempotent
        var secondResponse = await sut.ProcessIpnAsync(ipnParams);

        // Assert
        secondResponse.RspCode.Should().Be("02");
        secondResponse.Message.Should().Be("Order already confirmed");

        var orderAfterSecond = await db.Orders.Include(o => o.StatusHistories).FirstAsync(o => o.Id == order.Id);
        orderAfterSecond.StatusHistories.Count.Should().Be(historyCountAfterFirst, "Không được ghi đè hay sinh thêm lịch sử");
    }

    [Fact]
    public async Task ProcessIpn_ArrivesBeforeUserReturns_OrderAlreadyMarkedPaidWhenUserVisitsReturnPage()
    {
        // Arrange - Kịch bản: Người dùng thanh toán xong nhưng đóng tab hoặc mạng chậm,
        // IPN từ máy chủ VNPay đến backend trước và cập nhật trạng thái đơn thành Paid.
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 2000000m);

        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "200000000" },
            { "vnp_BankCode", "VISA" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "VISA998877" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", order.OrderNumber }
        };
        string ipnHash = sut.GenerateSignature(ipnParams);
        ipnParams["vnp_SecureHash"] = ipnHash;

        // 1. IPN đến xử lý trước
        var ipnResponse = await sut.ProcessIpnAsync(ipnParams);
        ipnResponse.RspCode.Should().Be("00");

        // 2. Sau đó người dùng mới truy cập trang Return URL (hoặc mở lại link trả về)
        var returnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "200000000" },
            { "vnp_BankCode", "VISA" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "VISA998877" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", order.OrderNumber }
        };
        string returnHash = sut.GenerateSignature(returnParams);
        returnParams["vnp_SecureHash"] = returnHash;

        // Act
        var returnResult = await sut.VerifyPaymentReturnAsync(returnParams);

        // Assert
        returnResult.IsSuccess.Should().BeTrue();
        returnResult.Data.Should().NotBeNull();
        returnResult.Data!.IsSuccess.Should().BeTrue();
        returnResult.Data.Status.Should().Be(PaymentStatus.Paid);
        returnResult.Data.OrderStatus.Should().Be(OrderStatus.Pending);
        returnResult.Data.TransactionNo.Should().Be("VISA998877");
    }

    [Fact]
    public async Task ProcessIpn_CustomerCancelsAtGateway_UpdatesOrderToCancelled_AndReleasesStock()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, variant) = await SeedOrderWithStockAsync(db, totalAmount: 600000m);

        // Khách hàng bấm "Hủy giao dịch" tại cổng VNPay (ResponseCode = "24")
        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "60000000" },
            { "vnp_ResponseCode", "24" }, // User cancel code
            { "vnp_TransactionStatus", "02" }, // Failed
            { "vnp_TxnRef", order.OrderNumber }
        };
        string validHash = sut.GenerateSignature(ipnParams);
        ipnParams["vnp_SecureHash"] = validHash;

        // Act
        var response = await sut.ProcessIpnAsync(ipnParams);

        // Assert
        response.RspCode.Should().Be("00");

        var updatedOrder = await db.Orders.Include(o => o.StatusHistories).FirstAsync(o => o.Id == order.Id);
        updatedOrder.Status.Should().Be(OrderStatus.Cancelled);
        updatedOrder.PaymentStatus.Should().Be(PaymentStatus.Failed);
        updatedOrder.CancelReason.Should().Contain("24");

        // Kiểm tra tồn kho đã được giải phóng (ReservedQuantity giảm lại)
        var inv = await db.Inventories.FirstAsync(i => i.VariantId == variant.Id);
        inv.ReservedQuantity.Should().Be(0);
    }

    [Fact]
    public async Task RawPayload_SavedAccuratelyInPaymentTable_ForAuditAndReconciliation()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 1500000m);

        var ipnParams = new Dictionary<string, string>
        {
            { "vnp_Amount", "150000000" },
            { "vnp_BankCode", "MBBANK" },
            { "vnp_CardType", "QRCODE" },
            { "vnp_OrderInfo", "Thanh toan don hang MadK" },
            { "vnp_PayDate", "20261015150000" },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "TRAN-MB-999" },
            { "vnp_TransactionStatus", "00" },
            { "vnp_TxnRef", order.OrderNumber }
        };
        string validHash = sut.GenerateSignature(ipnParams);
        ipnParams["vnp_SecureHash"] = validHash;

        // Act
        await sut.ProcessIpnAsync(ipnParams);

        // Assert
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderNumber == order.OrderNumber);
        payment.Should().NotBeNull();
        payment!.RawPayload.Should().NotBeNullOrEmpty();

        var parsedJson = JsonSerializer.Deserialize<Dictionary<string, string>>(payment.RawPayload);
        parsedJson.Should().NotBeNull();
        parsedJson!["vnp_BankCode"].Should().Be("MBBANK");
        parsedJson["vnp_CardType"].Should().Be("QRCODE");
        parsedJson["vnp_TransactionNo"].Should().Be("TRAN-MB-999");
    }

    [Fact]
    public async Task SimulateIpn_GeneratesProperHashAndProcessesSuccessfully()
    {
        // Arrange
        var (sut, db, _) = CreateSut();
        var (order, _) = await SeedOrderWithStockAsync(db, totalAmount: 350000m);

        var simulateRequest = new SimulateIpnRequestDto(
            OrderNumber: order.OrderNumber,
            ResponseCode: "00",
            BankCode: "NCB",
            TransactionNo: "SIM-TXN-123",
            TamperSignature: false
        );

        // Act
        var result = await sut.SimulateIpnAsync(simulateRequest);

        // Assert
        result.RspCode.Should().Be("00");
        result.Message.Should().Be("Confirm Success");

        var updatedOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        updatedOrder.Status.Should().Be(OrderStatus.Pending);
        updatedOrder.PaymentStatus.Should().Be(PaymentStatus.Paid);
    }
}
