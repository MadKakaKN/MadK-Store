using System.Net;
using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using MadK.Application.Common;
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
/// Bộ kiểm thử nghiệp vụ Giữ tồn kho (Reserve), Khấu trừ thực tế (Commit),
/// và Quét hủy đơn quá hạn thanh toán (Order Expiration Scheduler):
/// 1. Đơn quá hạn thanh toán bị hủy tự động và hoàn trả tồn kho (Release).
/// 2. Đơn chưa đến hạn không bị hủy.
/// 3. Job nền chạy lặp an toàn và Idempotent (không hủy trùng lặp, không trừ tồn kho âm).
/// 4. Đơn thanh toán online thành công thì khấu trừ tồn kho thực tế (Commit) và xóa hạn giữ hàng.
/// 5. Xử lý IPN trễ sau khi đơn đã bị hủy: không hồi sinh đơn, không làm kẹt kho, ghi nhận cờ hoàn tiền theo docs/order-states.md.
/// 6. Xử lý IPN đến sát lúc hết hạn: thanh toán thành công chặn việc job nền hủy đơn.
/// </summary>
public class OrderExpirationTests
{
    private readonly VnpaySettings _settings = new()
    {
        TmnCode = "MADKTEST",
        HashSecret = "TEST_SECRET_KEY_FOR_ORDER_EXPIRATION_HMACSHA512_2026",
        BaseUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        ReturnUrl = "http://localhost:5173/checkout/vnpay-return",
        PaymentExpiryMinutes = 15
    };

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryOrderExpirationTests_" + Guid.NewGuid())
            .Options;

        return new AppDbContext(options);
    }

    private (OrderExpirationService expirationService, VnpayService vnpayService, InventoryService inventoryService, AppDbContext db) CreateServices(AppDbContext? context = null)
    {
        var db = context ?? CreateInMemoryDbContext();
        var invLogger = NullLogger<InventoryService>.Instance;
        var inventoryService = new InventoryService(db, invLogger);
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);
        var options = Options.Create(_settings);
        var vnpayLogger = NullLogger<VnpayService>.Instance;
        var expirationLogger = NullLogger<OrderExpirationService>.Instance;

        var vnpayService = new VnpayService(db, inventoryService, options, vnpayLogger, pricingService);
        var expirationService = new OrderExpirationService(db, inventoryService, expirationLogger);

        return (expirationService, vnpayService, inventoryService, db);
    }

    private async Task<(Order order, ProductVariant variant, Inventory inventory)> SeedOrderWithStockAsync(
        AppDbContext db,
        int onHand = 10,
        int reserved = 2,
        OrderStatus status = OrderStatus.PendingPayment,
        DateTime? expiresAt = null,
        decimal totalAmount = 500000m)
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "Chuột Gaming", Slug = "chuot-" + Guid.NewGuid() };
        var brand = new Brand { Id = Guid.NewGuid(), Name = "Logitech", Slug = "logitech-" + Guid.NewGuid() };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Logitech G Pro X Superlight",
            Slug = "g-pro-x-" + Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id
        };
        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Name = "White Edition",
            Sku = "LOGI-GPX-WHT-" + Guid.NewGuid().ToString("N")[..6],
            SalePrice = totalAmount,
            CostPrice = totalAmount * 0.7m,
            IsActive = true
        };
        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = onHand,
            ReservedQuantity = reserved
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
            PaymentStatus = PaymentStatus.Pending,
            PaymentMethod = PaymentMethod.VNPay,
            TotalAmount = totalAmount,
            SubtotalAmount = totalAmount,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow.AddMinutes(-20),
            ShippingAddressSnapshot = "{\"fullAddress\":\"123 Le Loi, Q1, TP.HCM\"}",
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
                    Quantity = reserved,
                    TotalPrice = totalAmount
                }
            }
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return (order, variant, inventory);
    }

    private Dictionary<string, string> BuildVnpayIpnPayload(string orderNumber, decimal amount, string responseCode = "00")
    {
        var rawAmount = ((long)(amount * 100m)).ToString();
        var payload = new Dictionary<string, string>
        {
            ["vnp_TmnCode"] = _settings.TmnCode,
            ["vnp_Amount"] = rawAmount,
            ["vnp_BankCode"] = "NCB",
            ["vnp_BankTranNo"] = "VNP1489999",
            ["vnp_CardType"] = "ATM",
            ["vnp_PayDate"] = DateTime.UtcNow.ToString("yyyyMMddHHmmss"),
            ["vnp_OrderInfo"] = $"Thanh toan don hang {orderNumber}",
            ["vnp_TransactionNo"] = "14899999",
            ["vnp_ResponseCode"] = responseCode,
            ["vnp_TransactionStatus"] = responseCode,
            ["vnp_TxnRef"] = orderNumber
        };

        var signData = string.Join("&", payload
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .Select(kv => $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));

        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_settings.HashSecret));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(signData));
        var secureHash = Convert.ToHexString(hashBytes).ToLowerInvariant();

        payload["vnp_SecureHash"] = secureHash;
        payload["vnp_SecureHashType"] = "HMACSHA512";

        return payload;
    }

    [Fact]
    public async Task CancelExpiredOrders_OverduePendingPaymentOrder_CancelsOrderAndReleasesStock()
    {
        // Arrange: Đơn hàng PendingPayment đã hết hạn 5 phút trước
        var (expirationService, _, _, db) = CreateServices();
        var (order, variant, inventory) = await SeedOrderWithStockAsync(
            db,
            onHand: 10,
            reserved: 2,
            status: OrderStatus.PendingPayment,
            expiresAt: DateTime.UtcNow.AddMinutes(-5));

        // Act: Kích hoạt Job quét đơn hết hạn
        var cancelledCount = await expirationService.CancelExpiredOrdersAsync();

        // Assert:
        cancelledCount.Should().Be(1);

        var updatedOrder = await db.Orders
            .Include(o => o.StatusHistories)
            .FirstAsync(o => o.Id == order.Id);

        updatedOrder.Status.Should().Be(OrderStatus.Cancelled);
        updatedOrder.CancelReason.Should().Contain("quá thời hạn thanh toán");
        updatedOrder.CancelledAt.Should().NotBeNull();
        updatedOrder.StatusHistories.Should().Contain(h => h.ToStatus == OrderStatus.Cancelled);

        // Tồn kho: ReservedQuantity phải giảm từ 2 về 0, OnHand giữ nguyên 10 -> Available = 10
        var updatedInv = await db.Inventories.FirstAsync(i => i.Id == inventory.Id);
        updatedInv.ReservedQuantity.Should().Be(0);
        updatedInv.OnHandQuantity.Should().Be(10);
        updatedInv.AvailableQuantity.Should().Be(10);

        // Ghi nhận StockMovement giải phóng kho
        var movements = await db.StockMovements.Where(m => m.VariantId == variant.Id).ToListAsync();
        movements.Should().Contain(m => m.Type == StockMovementType.Release && m.ReferenceId == order.OrderNumber);
    }

    [Fact]
    public async Task CancelExpiredOrders_NotYetExpiredOrder_RemainsPendingPaymentAndStockRemainsReserved()
    {
        // Arrange: Đơn hàng còn 10 phút nữa mới hết hạn
        var (expirationService, _, _, db) = CreateServices();
        var (order, _, inventory) = await SeedOrderWithStockAsync(
            db,
            onHand: 10,
            reserved: 3,
            status: OrderStatus.PendingPayment,
            expiresAt: DateTime.UtcNow.AddMinutes(10));

        // Act: Kích hoạt Job quét
        var cancelledCount = await expirationService.CancelExpiredOrdersAsync();

        // Assert: Không hủy đơn chưa đến hạn
        cancelledCount.Should().Be(0);

        var freshOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        freshOrder.Status.Should().Be(OrderStatus.PendingPayment);

        var freshInv = await db.Inventories.FirstAsync(i => i.Id == inventory.Id);
        freshInv.ReservedQuantity.Should().Be(3);
        freshInv.AvailableQuantity.Should().Be(7);
    }

    [Fact]
    public async Task CancelExpiredOrders_JobRunRepeatedly_IsSafeAndIdempotent()
    {
        // Arrange: 1 đơn hết hạn, 1 đơn chưa hết hạn
        var (expirationService, _, _, db) = CreateServices();
        var (expiredOrder, variant, inventory) = await SeedOrderWithStockAsync(
            db,
            onHand: 20,
            reserved: 4,
            status: OrderStatus.PendingPayment,
            expiresAt: DateTime.UtcNow.AddMinutes(-10));

        await SeedOrderWithStockAsync(
            db,
            onHand: 20,
            reserved: 2,
            status: OrderStatus.PendingPayment,
            expiresAt: DateTime.UtcNow.AddMinutes(15));

        // Act: Chạy job lặp lại 3 lần liên tiếp
        var run1 = await expirationService.CancelExpiredOrdersAsync();
        var run2 = await expirationService.CancelExpiredOrdersAsync();
        var run3 = await expirationService.CancelExpiredOrdersAsync();

        // Assert: Lần 1 hủy đúng 1 đơn, các lần sau là no-op an toàn
        run1.Should().Be(1);
        run2.Should().Be(0);
        run3.Should().Be(0);

        // Tồn kho không bị trừ lặp
        var freshInv = await db.Inventories.FirstAsync(i => i.Id == inventory.Id);
        freshInv.ReservedQuantity.Should().Be(0); // Chỉ giảm 4 đúng 1 lần
        freshInv.OnHandQuantity.Should().Be(20);
        freshInv.AvailableQuantity.Should().Be(20);
    }

    [Fact]
    public async Task OnlinePaymentSuccess_CommitsStock_AndClearsExpiresAt()
    {
        // Arrange: Đơn hàng PendingPayment còn hạn
        var (expirationService, vnpayService, _, db) = CreateServices();
        var (order, variant, inventory) = await SeedOrderWithStockAsync(
            db,
            onHand: 15,
            reserved: 3,
            status: OrderStatus.PendingPayment,
            expiresAt: DateTime.UtcNow.AddMinutes(10),
            totalAmount: 1000000m);

        var payload = BuildVnpayIpnPayload(order.OrderNumber, 1000000m, "00");

        // Act: IPN báo thanh toán thành công
        var ipnResult = await vnpayService.ProcessIpnAsync(payload);

        // Assert:
        ipnResult.RspCode.Should().Be("00");

        var freshOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        freshOrder.Status.Should().Be(OrderStatus.Pending);
        freshOrder.PaymentStatus.Should().Be(PaymentStatus.Paid);
        freshOrder.ExpiresAt.Should().BeNull("Hạn giữ hàng phải được xóa bỏ khi đã thanh toán thành công");

        // Tồn kho: Commit thực tế -> Giảm cả OnHandQuantity (-3) và ReservedQuantity (-3)
        var freshInv = await db.Inventories.FirstAsync(i => i.Id == inventory.Id);
        freshInv.OnHandQuantity.Should().Be(12);
        freshInv.ReservedQuantity.Should().Be(0);
        freshInv.AvailableQuantity.Should().Be(12);

        // Kiểm tra biến động kho có bản ghi Commit
        var movements = await db.StockMovements.Where(m => m.VariantId == variant.Id).ToListAsync();
        movements.Should().Contain(m => m.Type == StockMovementType.Commit && m.Quantity == 3);

        // Kiểm tra chạy job sau đó: không chạm vào đơn đã thanh toán
        var jobRun = await expirationService.CancelExpiredOrdersAsync();
        jobRun.Should().Be(0);
    }

    [Fact]
    public async Task LateIPN_ArrivesAfterOrderWasCancelledDueToTimeout_HandlesGracefullyWithoutCorruptingInventoryAndFlagsRefund()
    {
        // Arrange: Đơn hàng đã quá hạn
        var (expirationService, vnpayService, _, db) = CreateServices();
        var (order, variant, inventory) = await SeedOrderWithStockAsync(
            db,
            onHand: 10,
            reserved: 2,
            status: OrderStatus.PendingPayment,
            expiresAt: DateTime.UtcNow.AddMinutes(-5),
            totalAmount: 500000m);

        // Bước 1: Job nền chạy trước -> Hủy đơn và giải phóng tồn kho
        var cancelled = await expirationService.CancelExpiredOrdersAsync();
        cancelled.Should().Be(1);

        var postCancelInv = await db.Inventories.FirstAsync(i => i.Id == inventory.Id);
        postCancelInv.OnHandQuantity.Should().Be(10);
        postCancelInv.ReservedQuantity.Should().Be(0);
        postCancelInv.AvailableQuantity.Should().Be(10);

        // Bước 2: IPN trễ tới từ cổng VNPay báo thanh toán thành công (khách hàng thanh toán trễ)
        var latePayload = BuildVnpayIpnPayload(order.OrderNumber, 500000m, "00");
        var ipnResult = await vnpayService.ProcessIpnAsync(latePayload);

        // Assert:
        // Cổng VNPay nhận mã 00 để xác nhận đã tiếp nhận thông báo, không spam retry
        ipnResult.RspCode.Should().Be("00");

        var freshOrder = await db.Orders
            .Include(o => o.StatusHistories)
            .FirstAsync(o => o.Id == order.Id);

        // Đơn hàng KHÔNG được tự ý hồi sinh sang Pending vì hàng đã hoàn kho
        freshOrder.Status.Should().Be(OrderStatus.Cancelled);
        freshOrder.PaymentStatus.Should().Be(PaymentStatus.Paid);

        // Tồn kho không bị trừ thêm hay kẹt hàng (OnHand vẫn 10, Reserved vẫn 0)
        var freshInv = await db.Inventories.FirstAsync(i => i.Id == inventory.Id);
        freshInv.OnHandQuantity.Should().Be(10);
        freshInv.ReservedQuantity.Should().Be(0);
        freshInv.AvailableQuantity.Should().Be(10);

        // Lịch sử đơn hàng ghi nhận cờ báo động hoàn tiền OVERDUE_PAYMENT_NEEDS_REFUND
        freshOrder.StatusHistories.Should().Contain(h =>
            h.Note == "OVERDUE_PAYMENT_NEEDS_REFUND" &&
            h.Reason != null && h.Reason.Contains("ĐÃ BỊ HỦY QUÁ HẠN"));

        // Bản ghi Payment lưu rõ cảnh báo cần hoàn tiền
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);
        payment.Should().NotBeNull();
        payment!.Status.Should().Be(PaymentStatus.Paid);
        payment.OrderInfo.Should().Contain("Can hoan tien");
    }

    [Fact]
    public async Task NearExpiration_IPNArrivesJustBeforeTimeout_SucceedsAndPreventsCancellation()
    {
        // Arrange: Đơn hàng chỉ còn 2 giây trước khi hết hạn
        var (expirationService, vnpayService, _, db) = CreateServices();
        var (order, variant, inventory) = await SeedOrderWithStockAsync(
            db,
            onHand: 10,
            reserved: 1,
            status: OrderStatus.PendingPayment,
            expiresAt: DateTime.UtcNow.AddSeconds(2),
            totalAmount: 350000m);

        // Bước 1: IPN tới kịp trước lúc hết hạn
        var payload = BuildVnpayIpnPayload(order.OrderNumber, 350000m, "00");
        var ipnResult = await vnpayService.ProcessIpnAsync(payload);
        ipnResult.RspCode.Should().Be("00");

        // Bước 2: Giả lập thời gian trôi qua, job quét được kích hoạt
        var freshOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        freshOrder.Status.Should().Be(OrderStatus.Pending);
        freshOrder.ExpiresAt.Should().BeNull();

        var jobRun = await expirationService.CancelExpiredOrdersAsync();

        // Assert: Job quét không hủy đơn này vì đã được thanh toán và xóa hạn giữ
        jobRun.Should().Be(0);

        var finalOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        finalOrder.Status.Should().Be(OrderStatus.Pending);
        finalOrder.PaymentStatus.Should().Be(PaymentStatus.Paid);

        // Tồn kho đã được Commit chuẩn xác
        var finalInv = await db.Inventories.FirstAsync(i => i.Id == inventory.Id);
        finalInv.OnHandQuantity.Should().Be(9);
        finalInv.ReservedQuantity.Should().Be(0);
        finalInv.AvailableQuantity.Should().Be(9);
    }
}
