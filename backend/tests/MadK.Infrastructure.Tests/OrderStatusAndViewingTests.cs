using FluentAssertions;
using MadK.Application.DTOs.Order;
using MadK.Application.Services;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

/// <summary>
/// Bộ kiểm thử cho vòng đời đơn hàng, State Machine, Tra cứu đơn và Chống IDOR:
/// 1. Chuyển trạng thái sai bị từ chối.
/// 2. Customer không xem hoặc hủy được đơn của người khác (Chống IDOR).
/// 3. Customer hủy đơn hợp lệ khi còn ở Pending/Confirmed -> Hoàn kho đúng và lưu vết lịch sử.
/// 4. Customer không thể hủy đơn khi đã vào Processing / Shipping.
/// 5. Toàn bộ vòng đời từ Mới đến Hoàn tất chạy đúng, commit tồn kho khi Shipping.
/// 6. Giao hàng thất bại từ Shipping -> Cancelled thì hoàn trả tồn OnHand.
/// </summary>
public class OrderStatusAndViewingTests : IAsyncLifetime
{
    private static readonly string ConnectionString =
        Environment.GetEnvironmentVariable("TEST_POSTGRES_CONNECTION")
        ?? "Host=127.0.0.1;Port=5433;Database=madkstore_test;Username=postgres;Include Error Detail=true;Pooling=true;Maximum Pool Size=300";

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        return new AppDbContext(options);
    }

    public async Task InitializeAsync()
    {
        await using var db = CreateDbContext();
        await db.Database.EnsureCreatedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<(User user, ProductVariant variant)> CreateTestProductAndUserAsync(
        string userEmail,
        decimal salePrice = 20000000m,
        int initialStock = 10)
    {
        await using var db = CreateDbContext();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{userEmail.Split('@')[0]}_{Guid.NewGuid():N}@madk.store",
            FullName = "Khách Hàng " + Guid.NewGuid().ToString("N")[..4],
            PasswordHash = "hashed_pwd",
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím cơ " + Guid.NewGuid().ToString("N")[..6],
            Slug = "ban-phim-co-" + Guid.NewGuid().ToString("N")[..6],
            IsActive = true
        };
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "Keychron " + Guid.NewGuid().ToString("N")[..6],
            Slug = "keychron-" + Guid.NewGuid().ToString("N")[..6],
            IsActive = true
        };
        db.Categories.Add(category);
        db.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id,
            Name = "Keychron Q1 Pro",
            Slug = "keychron-q1-pro-" + Guid.NewGuid().ToString("N")[..6],
            BasePrice = salePrice,
            ThumbnailUrl = "https://madk.store/images/q1-pro.jpg",
            Specifications = "{\"Switch\":\"Red\",\"Layout\":\"75%\",\"Wireless\":\"Bluetooth 5.1\"}",
            IsActive = true
        };
        db.Products.Add(product);

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "KC-Q1P-RED-" + Guid.NewGuid().ToString("N")[..4].ToUpperInvariant(),
            Name = "Carbon Black / Red Switch",
            OriginalPrice = salePrice + 1000000m,
            SalePrice = salePrice,
            StockQuantity = initialStock,
            Attributes = "{\"Color\":\"Carbon Black\",\"Switch\":\"Red\"}",
            IsActive = true
        };
        db.ProductVariants.Add(variant);

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = initialStock,
            ReservedQuantity = 0,
            CreatedAt = DateTime.UtcNow
        };
        db.Inventories.Add(inventory);

        await db.SaveChangesAsync();

        return (user, variant);
    }

    private async Task<OrderDto> CreateTestOrderAsync(User user, ProductVariant variant, int quantity = 2)
    {
        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            AddressId: null,
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: user.FullName,
                PhoneNumber: "0912345678",
                ProvinceCode: "01",
                ProvinceName: "Hà Nội",
                DistrictCode: "001",
                DistrictName: "Ba Đình",
                WardCode: "00001",
                WardName: "Phúc Xá",
                DetailedAddress: "123 Hoàng Hoa Thám"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                new CheckoutItemInputDto(variant.Id, quantity)
            },
            CustomerNote: "Kiểm tra kỹ trước khi giao"
        );

        var res = await orderService.CheckoutCodAsync(user.Id, null, request);
        res.IsSuccess.Should().BeTrue();
        return res.Data!;
    }

    [Fact]
    public async Task UpdateStatus_WithInvalidTransition_ShouldBeRejected()
    {
        // Arrange: Tạo đơn hàng mới ở trạng thái Pending
        var (user, variant) = await CreateTestProductAndUserAsync("user_transition@madk.store");
        var order = await CreateTestOrderAsync(user, variant, 2);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        // Act 1: Thử nhảy cóc từ Pending sang Completed (sai quy trình)
        var invalidRes1 = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber,
            Guid.NewGuid(),
            "Admin Test",
            new UpdateOrderStatusRequestDto(OrderStatus.Completed, "Nhảy cóc sang hoàn tất"));

        // Assert 1: Bị từ chối
        invalidRes1.IsSuccess.Should().BeFalse();
        invalidRes1.Error.Should().Contain("không hợp lệ theo quy tắc vòng đời đơn hàng");

        // Act 2: Thử nhảy cóc từ Pending sang Shipping (chưa qua Confirmed và Processing)
        var invalidRes2 = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber,
            Guid.NewGuid(),
            "Admin Test",
            new UpdateOrderStatusRequestDto(OrderStatus.Shipping, "Giao hàng luôn"));

        // Assert 2: Bị từ chối
        invalidRes2.IsSuccess.Should().BeFalse();
        invalidRes2.Error.Should().Contain("không hợp lệ theo quy tắc vòng đời đơn hàng");
    }

    [Fact]
    public async Task Customer_CannotViewOrCancel_AnotherUsersOrder_IDORProtection()
    {
        // Arrange: User A tạo đơn hàng
        var (userA, variantA) = await CreateTestProductAndUserAsync("userA@madk.store");
        var orderA = await CreateTestOrderAsync(userA, variantA, 2);

        // User B hoàn toàn độc lập
        var (userB, _) = await CreateTestProductAndUserAsync("userB@madk.store");

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        // Act 1: User B cố tình xem chi tiết đơn hàng của User A bằng OrderNumber
        var viewByNumberRes = await orderService.GetOrderByNumberAsync(orderA.OrderNumber, userB.Id, isStaffOrAdmin: false);
        viewByNumberRes.IsSuccess.Should().BeFalse();
        viewByNumberRes.Error.Should().Contain("Bạn không có quyền xem đơn hàng này");

        // Act 2: User B cố tình xem chi tiết đơn hàng của User A bằng OrderId
        var viewByIdRes = await orderService.GetOrderByIdAsync(orderA.Id, userB.Id, isStaffOrAdmin: false);
        viewByIdRes.IsSuccess.Should().BeFalse();
        viewByIdRes.Error.Should().Contain("Bạn không có quyền xem đơn hàng này");

        // Act 3: User B cố tình gửi lệnh hủy đơn của User A
        var cancelRes = await orderService.CancelOrderAsync(
            orderA.OrderNumber,
            userB.Id,
            new CancelOrderRequestDto("User B muốn phá đơn người khác"),
            isStaffOrAdmin: false);

        cancelRes.IsSuccess.Should().BeFalse();
        cancelRes.Error.Should().Contain("Bạn không có quyền hủy đơn hàng này");

        // Assert: Đơn của User A vẫn an toàn ở trạng thái Pending
        var verifyOrder = await db.Orders.AsNoTracking().FirstAsync(o => o.Id == orderA.Id);
        verifyOrder.Status.Should().Be(OrderStatus.Pending);
    }

    [Fact]
    public async Task Customer_CanCancelOrder_WhenInPending_AndStockIsReleased()
    {
        // 1. Arrange: Tồn ban đầu = 10. Đặt 3 chiếc -> Reserved = 3, Available = 7
        var (user, variant) = await CreateTestProductAndUserAsync("user_cancel@madk.store", initialStock: 10);
        var order = await CreateTestOrderAsync(user, variant, 3);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        // Kiểm tra tồn sau đặt hàng
        var stockBeforeCancel = await invService.GetStockAsync(variant.Id);
        stockBeforeCancel.Data!.ReservedQuantity.Should().Be(3);
        stockBeforeCancel.Data!.AvailableQuantity.Should().Be(7);

        // 2. Act: Khách hàng tự hủy đơn khi còn ở Pending
        var cancelRes = await orderService.CancelOrderAsync(
            order.OrderNumber,
            user.Id,
            new CancelOrderRequestDto("Tôi đổi ý muốn mua màu khác"),
            isStaffOrAdmin: false);

        // 3. Assert: Hủy thành công
        cancelRes.IsSuccess.Should().BeTrue(cancelRes.Error);
        var cancelledOrder = cancelRes.Data!;
        cancelledOrder.Status.Should().Be(OrderStatus.Cancelled);
        cancelledOrder.CancelReason.Should().Be("Tôi đổi ý muốn mua màu khác");
        cancelledOrder.CancelledAt.Should().NotBeNull();

        // 4. Assert: Lịch sử OrderStatusHistory được ghi nhận đầy đủ (ai, khi nào)
        cancelledOrder.StatusHistory.Should().HaveCount(2); // 1: Khởi tạo, 2: Hủy đơn
        var cancelHistory = cancelledOrder.StatusHistory.Last();
        cancelHistory.FromStatus.Should().Be(OrderStatus.Pending);
        cancelHistory.ToStatus.Should().Be(OrderStatus.Cancelled);
        cancelHistory.ChangedByName.Should().Be("Khách hàng");
        cancelHistory.ChangedByUserId.Should().Be(user.Id);
        cancelHistory.Reason.Should().Be("Tôi đổi ý muốn mua màu khác");

        // 5. Assert: Tồn kho được hoàn trả chính xác (Reserved về 0, Available trở lại 10)
        var stockAfterCancel = await invService.GetStockAsync(variant.Id);
        stockAfterCancel.Data!.OnHandQuantity.Should().Be(10);
        stockAfterCancel.Data!.ReservedQuantity.Should().Be(0);
        stockAfterCancel.Data!.AvailableQuantity.Should().Be(10);
    }

    [Fact]
    public async Task Customer_CannotCancelOrder_WhenInProcessingOrShipping()
    {
        // 1. Arrange: Tạo đơn và chuyển sang Processing
        var (user, variant) = await CreateTestProductAndUserAsync("user_proc@madk.store");
        var order = await CreateTestOrderAsync(user, variant, 1);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        // Admin chuyển Pending -> Confirmed -> Processing
        var confirmRes = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber, Guid.NewGuid(), "Sales",
            new UpdateOrderStatusRequestDto(OrderStatus.Confirmed, "Đã gọi xác nhận"));
        confirmRes.IsSuccess.Should().BeTrue(confirmRes.Error);

        var procRes = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber, Guid.NewGuid(), "Kho",
            new UpdateOrderStatusRequestDto(OrderStatus.Processing, "Đang đóng hộp"));
        procRes.IsSuccess.Should().BeTrue(procRes.Error);

        // 2. Act: Khách hàng cố hủy đơn khi kho đã đóng gói (Processing)
        var cancelRes = await orderService.CancelOrderAsync(
            order.OrderNumber,
            user.Id,
            new CancelOrderRequestDto("Hủy gấp giúp tôi"),
            isStaffOrAdmin: false);

        // 3. Assert: Bị từ chối
        cancelRes.IsSuccess.Should().BeFalse();
        cancelRes.Error.Should().Contain("Không thể hủy đơn hàng ở trạng thái 'Processing'");
    }

    [Fact]
    public async Task FullOrderLifecycle_FromPendingToCompleted_RunsSuccessfully_WithCorrectLedgerAndStock()
    {
        // 1. Khởi tạo: OnHand = 10, Đặt 2 món
        var (user, variant) = await CreateTestProductAndUserAsync("lifecycle@madk.store", initialStock: 10);
        var order = await CreateTestOrderAsync(user, variant, 2);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        // Bước 1: Pending (đang giữ 2, còn khả dụng 8)
        var stock1 = await invService.GetStockAsync(variant.Id);
        stock1.Data!.OnHandQuantity.Should().Be(10);
        stock1.Data!.ReservedQuantity.Should().Be(2);
        stock1.Data!.AvailableQuantity.Should().Be(8);

        // Bước 2: Sales xác nhận đơn (Pending -> Confirmed)
        var s2 = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber, Guid.NewGuid(), "Sales Hoa",
            new UpdateOrderStatusRequestDto(OrderStatus.Confirmed, "Khách nghe máy xác nhận"));
        s2.IsSuccess.Should().BeTrue(s2.Error);
        s2.Data!.Status.Should().Be(OrderStatus.Confirmed);

        // Bước 3: Kho in phiếu xuất và đóng gói (Confirmed -> Processing)
        var s3 = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber, Guid.NewGuid(), "Kho Nam",
            new UpdateOrderStatusRequestDto(OrderStatus.Processing, "In vận đơn GHN"));
        s3.IsSuccess.Should().BeTrue();
        s3.Data!.Status.Should().Be(OrderStatus.Processing);

        // Bước 4: Bàn giao vận chuyển (Processing -> Shipping)
        // Nghiệp vụ: Trừ kho thực tế (Commit: OnHand 10 -> 8, Reserved 2 -> 0, Available 8)
        var s4 = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber, Guid.NewGuid(), "Kho Nam",
            new UpdateOrderStatusRequestDto(OrderStatus.Shipping, "Bàn giao tài xế GHN"));
        s4.IsSuccess.Should().BeTrue();
        s4.Data!.Status.Should().Be(OrderStatus.Shipping);

        var stock4 = await invService.GetStockAsync(variant.Id);
        stock4.Data!.OnHandQuantity.Should().Be(8);     // Đã trừ thật
        stock4.Data!.ReservedQuantity.Should().Be(0);   // Không còn giữ
        stock4.Data!.AvailableQuantity.Should().Be(8);

        // Bước 5: Giao hàng thành công (Shipping -> Completed)
        // Nghiệp vụ: Đơn COD thu tiền -> PaymentStatus.Paid
        var s5 = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber, Guid.NewGuid(), "Webhook GHN",
            new UpdateOrderStatusRequestDto(OrderStatus.Completed, "Giao thành công cho người nhận"));
        s5.IsSuccess.Should().BeTrue();
        s5.Data!.Status.Should().Be(OrderStatus.Completed);
        s5.Data!.PaymentStatus.Should().Be(PaymentStatus.Paid);

        // Kiểm tra danh sách lịch sử chuyển trạng thái (ai, khi nào)
        s5.Data!.StatusHistory.Should().HaveCount(5); // Khởi tạo + 4 bước chuyển
        s5.Data!.StatusHistory.Select(h => h.ToStatus).Should().ContainInOrder(
            OrderStatus.Pending,
            OrderStatus.Confirmed,
            OrderStatus.Processing,
            OrderStatus.Shipping,
            OrderStatus.Completed
        );
    }

    [Fact]
    public async Task DeliveryFailed_WhenInShipping_RestocksOnHandInventory()
    {
        // 1. Arrange: Đưa đơn hàng tới bước Shipping (đã trừ OnHand = 10 -> 8)
        var (user, variant) = await CreateTestProductAndUserAsync("delivery_fail@madk.store", initialStock: 10);
        var order = await CreateTestOrderAsync(user, variant, 2);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        await orderService.UpdateOrderStatusAsync(order.OrderNumber, null, "Sales",
            new UpdateOrderStatusRequestDto(OrderStatus.Confirmed));
        await orderService.UpdateOrderStatusAsync(order.OrderNumber, null, "Kho",
            new UpdateOrderStatusRequestDto(OrderStatus.Processing));
        await orderService.UpdateOrderStatusAsync(order.OrderNumber, null, "Kho",
            new UpdateOrderStatusRequestDto(OrderStatus.Shipping));

        // Kiểm tra tồn khi đang shipping: OnHand = 8
        var stockShipping = await invService.GetStockAsync(variant.Id);
        stockShipping.Data!.OnHandQuantity.Should().Be(8);

        // 2. Act: Giao hàng thất bại sau 3 lần / khách bùng hàng -> Chuyển hoàn về shop (Shipping -> Cancelled)
        var failRes = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber, null, "Bưu tá GHN",
            new UpdateOrderStatusRequestDto(OrderStatus.Cancelled, "Khách không nghe máy sau 3 lần giao, chuyển hoàn"));

        // 3. Assert: Hủy thành công
        failRes.IsSuccess.Should().BeTrue();
        failRes.Data!.Status.Should().Be(OrderStatus.Cancelled);

        // 4. Assert: Tồn OnHand được nhập trả lại kho (+2 -> trở lại 10)
        var stockAfterReturn = await invService.GetStockAsync(variant.Id);
        stockAfterReturn.Data!.OnHandQuantity.Should().Be(10);
        stockAfterReturn.Data!.ReservedQuantity.Should().Be(0);
        stockAfterReturn.Data!.AvailableQuantity.Should().Be(10);
    }
}
