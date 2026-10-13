using System.Text.RegularExpressions;
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
/// Bộ kiểm thử tích hợp cho luồng Checkout và Tạo đơn COD:
/// 1. Server tính lại toàn bộ giá từ DB (không nhận giá client).
/// 2. Snapshot bất biến (tên, SKU, giá, thông số, ảnh) không đổi khi sản phẩm đổi giá sau đó.
/// 3. Hết hàng giữa chừng thì đơn không được tạo và không để lại dữ liệu lệch (rollback hoàn toàn).
/// 4. Idempotency key để bấm đặt hàng hai lần không tạo hai đơn hay giữ trùng tồn kho.
/// 5. Mã đơn dễ đọc, duy nhất (e.g. MK-yyyyMMdd-XXXXXX).
/// </summary>
public class OrderCheckoutTests : IAsyncLifetime
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
        decimal salePrice = 25000000m,
        int initialStock = 10)
    {
        await using var db = CreateDbContext();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"buyer_{Guid.NewGuid():N}@madk.store",
            FullName = "Nguyễn Văn Mua Hàng",
            PasswordHash = "hashed_pwd",
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Laptop Gaming " + Guid.NewGuid().ToString("N")[..6],
            Slug = "laptop-gaming-" + Guid.NewGuid().ToString("N")[..6],
            IsActive = true
        };
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "ASUS ROG " + Guid.NewGuid().ToString("N")[..6],
            Slug = "asus-rog-" + Guid.NewGuid().ToString("N")[..6],
            IsActive = true
        };
        db.Categories.Add(category);
        db.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id,
            Name = "ASUS ROG Zephyrus G16",
            Slug = "asus-rog-zephyrus-g16-" + Guid.NewGuid().ToString("N")[..6],
            BasePrice = salePrice,
            ThumbnailUrl = "https://madk.store/images/g16-thumb.jpg",
            Specifications = "{\"CPU\":\"Intel Core Ultra 9\",\"RAM\":\"32GB LPDDR5X\",\"VGA\":\"RTX 4080\"}",
            IsActive = true
        };
        db.Products.Add(product);

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "ROG-G16-U9-4080-" + Guid.NewGuid().ToString("N")[..4].ToUpperInvariant(),
            Name = "Eclipse Gray / OLED 240Hz / 32GB / 1TB",
            OriginalPrice = salePrice + 5000000m,
            SalePrice = salePrice,
            StockQuantity = initialStock,
            Attributes = "{\"Color\":\"Eclipse Gray\",\"Display\":\"OLED 2.5K 240Hz\"}",
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

    [Fact]
    public async Task CheckoutCod_ShouldCreateOrderWithImmutableSnapshots_WhenProductPriceChangesLater()
    {
        // 1. Arrange: Tạo sản phẩm giá 25.000.000đ, tồn kho 10
        decimal initialSalePrice = 25000000m;
        var (user, variant) = await CreateTestProductAndUserAsync(initialSalePrice, 10);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            AddressId: null,
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: "Lê Văn Nhận",
                PhoneNumber: "0987654321",
                ProvinceCode: "01",
                ProvinceName: "Thành phố Hà Nội",
                DistrictCode: "001",
                DistrictName: "Quận Ba Đình",
                WardCode: "00001",
                WardName: "Phường Phúc Xá",
                DetailedAddress: "Số 123 Phố Hàng Bún"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                new CheckoutItemInputDto(variant.Id, 2)
            },
            CustomerNote: "Giao hàng giờ hành chính"
        );

        // 2. Act: Thực hiện checkout COD
        var checkoutResult = await orderService.CheckoutCodAsync(user.Id, null, request);

        // 3. Assert Checkout Thành công
        checkoutResult.IsSuccess.Should().BeTrue();
        var orderDto = checkoutResult.Data!;
        orderDto.Should().NotBeNull();
        orderDto.Status.Should().Be(OrderStatus.Pending);
        orderDto.PaymentStatus.Should().Be(PaymentStatus.Pending);
        orderDto.PaymentMethod.Should().Be(PaymentMethod.COD);
        orderDto.TotalAmount.Should().Be(initialSalePrice * 2); // 50.000.000đ
        orderDto.Items.Should().HaveCount(1);

        var itemDto = orderDto.Items[0];
        itemDto.ProductName.Should().Be("ASUS ROG Zephyrus G16");
        itemDto.VariantName.Should().Be("Eclipse Gray / OLED 240Hz / 32GB / 1TB");
        itemDto.UnitPrice.Should().Be(initialSalePrice);
        itemDto.Quantity.Should().Be(2);
        itemDto.TotalPrice.Should().Be(initialSalePrice * 2);
        itemDto.ThumbnailUrl.Should().Be("https://madk.store/images/g16-thumb.jpg");
        itemDto.Specifications.Should().Contain("Intel Core Ultra 9");

        // Kiểm tra tồn kho đã được giữ (reserved) chính xác
        var stock = await invService.GetStockAsync(variant.Id);
        stock.Data!.OnHandQuantity.Should().Be(10);
        stock.Data!.ReservedQuantity.Should().Be(2);
        stock.Data!.AvailableQuantity.Should().Be(8);

        // 4. Act: Sản phẩm trong DB đổi giá tăng vọt lên 40.000.000đ và đổi cả tên
        await using (var updateDb = CreateDbContext())
        {
            var pVariant = await updateDb.ProductVariants.Include(v => v.Product).FirstAsync(v => v.Id == variant.Id);
            pVariant.SalePrice = 40000000m;
            pVariant.Product!.Name = "ASUS ROG ĐÃ ĐỔI TÊN MỚI";
            await updateDb.SaveChangesAsync();
        }

        // 5. Assert: Đọc lại đơn hàng từ DB -> Snapshot KHÔNG ĐỔI!
        await using (var queryDb = CreateDbContext())
        {
            var savedOrder = await queryDb.Orders
                .Include(o => o.Items)
                .FirstAsync(o => o.OrderNumber == orderDto.OrderNumber);

            savedOrder.TotalAmount.Should().Be(initialSalePrice * 2); // Vẫn là 50.000.000đ
            savedOrder.Items.First().UnitPriceSnapshot.Should().Be(initialSalePrice); // Vẫn là 25.000.000đ
            savedOrder.Items.First().ProductNameSnapshot.Should().Be("ASUS ROG Zephyrus G16"); // Tên cũ bất biến
        }
    }

    [Fact]
    public async Task CheckoutCod_WhenOneItemIsOutOfStock_ShouldAbortEntireOrderAndRollbackWithoutLeakingStock()
    {
        // 1. Arrange:
        // Variant A có 5 trong kho
        // Variant B có 0 trong kho (hết hàng)
        var (user, variantA) = await CreateTestProductAndUserAsync(salePrice: 10000000m, initialStock: 5);
        var (_, variantB) = await CreateTestProductAndUserAsync(salePrice: 20000000m, initialStock: 0);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            AddressId: null,
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: "Trần Thị B",
                PhoneNumber: "0912345678",
                ProvinceCode: "79",
                ProvinceName: "Thành phố Hồ Chí Minh",
                DistrictCode: "760",
                DistrictName: "Quận 1",
                WardCode: "26734",
                WardName: "Phường Bến Nghé",
                DetailedAddress: "Số 1 Lê Duẩn"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                new CheckoutItemInputDto(variantA.Id, 2), // Đủ hàng
                new CheckoutItemInputDto(variantB.Id, 1)  // HẾT HÀNG!
            }
        );

        // 2. Act: Thực hiện checkout
        var result = await orderService.CheckoutCodAsync(user.Id, null, request);

        // 3. Assert: Thất bại do hết hàng giữa chừng
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("không đủ tồn kho khả dụng");

        // 4. Assert: Không có đơn hàng nào được tạo trong DB
        await using var verifyDb = CreateDbContext();
        var ordersCount = await verifyDb.Orders.CountAsync(o => o.UserId == user.Id);
        ordersCount.Should().Be(0);

        // 5. Assert: Tồn kho của Variant A KHÔNG BỊ TRỪ/GIỮ OAN (Rollback hoàn toàn!)
        var invVerify = new InventoryService(verifyDb, NullLogger<InventoryService>.Instance);
        var stockA = await invVerify.GetStockAsync(variantA.Id);
        stockA.Data!.OnHandQuantity.Should().Be(5);
        stockA.Data!.ReservedQuantity.Should().Be(0);
        stockA.Data!.AvailableQuantity.Should().Be(5);
    }

    [Fact]
    public async Task CheckoutCod_WithSameIdempotencyKey_ShouldReturnExistingOrderAndNotDuplicateOrOverReserve()
    {
        // 1. Arrange: Tồn kho 5 món
        var (user, variant) = await CreateTestProductAndUserAsync(salePrice: 12000000m, initialStock: 5);
        string idempotencyKey = "TEST-IDEMP-" + Guid.NewGuid().ToString("N");

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            AddressId: null,
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: "Vũ Đình Đặt",
                PhoneNumber: "0909999888",
                ProvinceCode: "48",
                ProvinceName: "Thành phố Đà Nẵng",
                DistrictCode: "490",
                DistrictName: "Quận Hải Châu",
                WardCode: "20194",
                WardName: "Phường Hải Châu I",
                DetailedAddress: "45 Lê Lợi"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                new CheckoutItemInputDto(variant.Id, 2)
            },
            CustomerNote: null,
            IdempotencyKey: idempotencyKey
        );

        // 2. Act 1: Lần bấm đặt hàng đầu tiên
        var result1 = await orderService.CheckoutCodAsync(user.Id, null, request);
        result1.IsSuccess.Should().BeTrue();
        string firstOrderNumber = result1.Data!.OrderNumber;

        // Kiểm tra tồn kho sau lần 1: đã giữ 2
        var stockAfterFirst = await invService.GetStockAsync(variant.Id);
        stockAfterFirst.Data!.ReservedQuantity.Should().Be(2);
        stockAfterFirst.Data!.AvailableQuantity.Should().Be(3);

        // 3. Act 2: Bấm đặt hàng lần thứ hai với CÙNG IdempotencyKey (Double submit)
        var result2 = await orderService.CheckoutCodAsync(user.Id, null, request);
        result2.IsSuccess.Should().BeTrue();
        result2.Data!.OrderNumber.Should().Be(firstOrderNumber); // Trả về đúng đơn hàng trước đó

        // 4. Assert: Trong DB chỉ có duy nhất 1 đơn hàng với IdempotencyKey này
        await using var verifyDb = CreateDbContext();
        var orders = await verifyDb.Orders.Where(o => o.IdempotencyKey == idempotencyKey).ToListAsync();
        orders.Should().HaveCount(1);
        orders[0].OrderNumber.Should().Be(firstOrderNumber);

        // 5. Assert: Tồn kho KHÔNG BỊ TRỪ ĐÚP! Vẫn giữ 2, còn khả dụng 3 (không bị thành 4 và 1)
        var invVerify = new InventoryService(verifyDb, NullLogger<InventoryService>.Instance);
        var stockAfterSecond = await invVerify.GetStockAsync(variant.Id);
        stockAfterSecond.Data!.ReservedQuantity.Should().Be(2);
        stockAfterSecond.Data!.AvailableQuantity.Should().Be(3);
    }

    [Fact]
    public async Task CheckoutCod_ClientSuppliedPrice_ShouldBeCompletelyIgnored_AndCalculatedFromDB()
    {
        // 1. Arrange: Giá thật trong DB là 18.000.000đ
        decimal realPrice = 18000000m;
        var (user, variant) = await CreateTestProductAndUserAsync(salePrice: realPrice, initialStock: 5);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            AddressId: null,
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: "Hacker Client",
                PhoneNumber: "0900000000",
                ProvinceCode: "01",
                ProvinceName: "Thành phố Hà Nội",
                DistrictCode: "001",
                DistrictName: "Quận Ba Đình",
                WardCode: "00001",
                WardName: "Phường Phúc Xá",
                DetailedAddress: "Hack Street 1"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                // Hacker truyền giá 1.000đ để gian lận
                new CheckoutItemInputDto(variant.Id, 3, ClientPrice: 1000m)
            }
        );

        // 2. Act: Thực hiện checkout
        var result = await orderService.CheckoutCodAsync(user.Id, null, request);

        // 3. Assert: Server bỏ qua ClientPrice, tính tổng tiền = 18.000.000đ * 3 = 54.000.000đ
        result.IsSuccess.Should().BeTrue();
        result.Data!.SubtotalAmount.Should().Be(realPrice * 3);
        result.Data!.TotalAmount.Should().Be(realPrice * 3);
        result.Data!.Items.First().UnitPrice.Should().Be(realPrice);
    }

    [Fact]
    public async Task CheckoutCod_ShouldGenerateHumanReadableUniqueOrderNumber()
    {
        // Arrange
        var (user, variant) = await CreateTestProductAndUserAsync(salePrice: 5000000m, initialStock: 5);

        await using var db = CreateDbContext();
        var invService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var orderService = new OrderService(db, invService, NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            AddressId: null,
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: "Nguyễn Văn Đọc Mã",
                PhoneNumber: "0988776655",
                ProvinceCode: "01",
                ProvinceName: "Hà Nội",
                DistrictCode: "001",
                DistrictName: "Ba Đình",
                WardCode: "00001",
                WardName: "Phúc Xá",
                DetailedAddress: "10 Thụy Khuê"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                new CheckoutItemInputDto(variant.Id, 1)
            }
        );

        // Act
        var result = await orderService.CheckoutCodAsync(user.Id, null, request);

        // Assert: Mã đơn có dạng MK-yyyyMMdd-XXXXXX
        result.IsSuccess.Should().BeTrue();
        string orderNumber = result.Data!.OrderNumber;
        orderNumber.Should().StartWith("MK-");

        // Format: MK-20261013-XXXXXX (MK-8digits-6chars)
        var regex = new Regex(@"^MK-\d{8}-[A-Z0-9]{6}$");
        regex.IsMatch(orderNumber).Should().BeTrue();
    }
}
