using FluentAssertions;
using MadK.Application.DTOs.Cart;
using MadK.Application.Services;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace MadK.Infrastructure.Tests;

public class CartServiceTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<(CartService service, AppDbContext context, User user, ProductVariant variant1, ProductVariant variant2)> CreateTestSetupAsync()
    {
        var db = CreateInMemoryDbContext("CartTest_" + Guid.NewGuid());

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "buyer@example.com",
            FullName = "Khách Hàng Mua Sắm",
            PasswordHash = "hashed",
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Điện thoại",
            Slug = "dien-thoai",
            IsActive = true
        };
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "Apple",
            Slug = "apple",
            IsActive = true
        };
        db.Categories.Add(category);
        db.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id,
            Name = "iPhone 16 Pro",
            Slug = "iphone-16-pro",
            BasePrice = 28990000m,
            IsActive = true
        };
        db.Products.Add(product);

        var variant1 = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "IP16P-128-NAT",
            Name = "Titan Tự Nhiên - 128GB",
            OriginalPrice = 30000000m,
            SalePrice = 28990000m, // Giá chuẩn trong DB
            StockQuantity = 10,    // Tồn kho khả dụng: 10
            IsActive = true
        };

        var variant2 = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "IP16P-256-BLK",
            Name = "Titan Đen - 256GB",
            OriginalPrice = 33000000m,
            SalePrice = 31990000m, // Giá chuẩn trong DB
            StockQuantity = 5,     // Tồn kho khả dụng: 5
            IsActive = true
        };

        db.ProductVariants.AddRange(variant1, variant2);
        await db.SaveChangesAsync();

        var service = new CartService(db, NullLogger<CartService>.Instance);
        return (service, db, user, variant1, variant2);
    }

    [Fact]
    public async Task AddItemAsync_ClientSuppliedPrice_ShouldBeCompletelyIgnored_AndCalculatedFromDB()
    {
        // Arrange
        var (service, _, user, variant1, _) = await CreateTestSetupAsync();

        // Client hacker cố tình gửi giá ClientPrice = 500 đồng thay vì 28,990,000đ trong DB
        var maliciousRequest = new AddToCartRequestDto(
            VariantId: variant1.Id,
            Quantity: 2,
            ClientPrice: 500m
        );

        // Act
        var result = await service.AddItemAsync(user.Id, null, maliciousRequest);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().ContainSingle();

        var item = result.Data.Items.Single();
        item.Price.Should().Be(28990000m, "Server phải dùng giá SalePrice từ DB, không nhận giá từ client");
        item.Quantity.Should().Be(2);
        item.TotalPrice.Should().Be(2 * 28990000m, "Tổng tiền dòng phải tính theo giá DB: 2 * 28,990,000đ");
        result.Data.TotalAmount.Should().Be(57980000m, "Tổng tiền giỏ phải được tính toán hoàn toàn trên server");
    }

    [Fact]
    public async Task AddItemAsync_WhenRequestedQuantityExceedsAvailableStock_ShouldReturnFailure()
    {
        // Arrange: variant2 có tồn kho là 5
        var (service, _, user, _, variant2) = await CreateTestSetupAsync();

        var request = new AddToCartRequestDto(
            VariantId: variant2.Id,
            Quantity: 6 // Vượt quá tồn kho 5
        );

        // Act
        var result = await service.AddItemAsync(user.Id, null, request);

        // Assert: Báo lỗi vượt quá tồn kho khả dụng
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("vượt quá tồn kho khả dụng");
    }

    [Fact]
    public async Task UpdateItemQuantityAsync_WhenRequestedQuantityExceedsAvailableStock_ShouldReturnFailure()
    {
        // Arrange
        var (service, _, user, _, variant2) = await CreateTestSetupAsync();
        var addResult = await service.AddItemAsync(user.Id, null, new AddToCartRequestDto(variant2.Id, 2));
        var itemId = addResult.Data!.Items.Single().Id;

        // Act: Cập nhật thành 8 (trong khi tồn kho chỉ có 5)
        var updateResult = await service.UpdateItemQuantityAsync(user.Id, null, itemId, 8);

        // Assert
        updateResult.IsSuccess.Should().BeFalse();
        updateResult.Error.Should().Contain("vượt quá tồn kho khả dụng");
    }

    [Fact]
    public async Task UpdateItemQuantityAsync_WhenQuantityIsZero_ShouldRemoveItemFromCart()
    {
        // Arrange
        var (service, _, user, variant1, _) = await CreateTestSetupAsync();
        var addResult = await service.AddItemAsync(user.Id, null, new AddToCartRequestDto(variant1.Id, 1));
        var itemId = addResult.Data!.Items.Single().Id;

        // Act: Cập nhật số lượng về 0
        var updateResult = await service.UpdateItemQuantityAsync(user.Id, null, itemId, 0);

        // Assert
        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Data!.Items.Should().BeEmpty();
        updateResult.Data.TotalAmount.Should().Be(0m);
    }

    [Fact]
    public async Task RemoveItemAsync_ShouldRemoveItemSuccessfully()
    {
        // Arrange
        var (service, _, user, variant1, variant2) = await CreateTestSetupAsync();
        await service.AddItemAsync(user.Id, null, new AddToCartRequestDto(variant1.Id, 1));
        var add2 = await service.AddItemAsync(user.Id, null, new AddToCartRequestDto(variant2.Id, 1));
        var item2Id = add2.Data!.Items.First(i => i.VariantId == variant2.Id).Id;

        // Act
        var removeResult = await service.RemoveItemAsync(user.Id, null, item2Id);

        // Assert
        removeResult.IsSuccess.Should().BeTrue();
        removeResult.Data!.Items.Should().ContainSingle(i => i.VariantId == variant1.Id);
        removeResult.Data.TotalAmount.Should().Be(variant1.SalePrice);
    }

    [Fact]
    public async Task ClearCartAsync_ShouldClearAllItems()
    {
        // Arrange
        var (service, _, user, variant1, variant2) = await CreateTestSetupAsync();
        await service.AddItemAsync(user.Id, null, new AddToCartRequestDto(variant1.Id, 1));
        await service.AddItemAsync(user.Id, null, new AddToCartRequestDto(variant2.Id, 1));

        // Act
        var clearResult = await service.ClearCartAsync(user.Id, null);

        // Assert
        clearResult.IsSuccess.Should().BeTrue();
        clearResult.Data!.Items.Should().BeEmpty();
        clearResult.Data.TotalAmount.Should().Be(0m);
        clearResult.Data.TotalQuantity.Should().Be(0);
    }

    [Fact]
    public async Task MergeCartAsync_AfterLogin_ShouldCombineQuantitiesAndSyncWithUserDBCart()
    {
        // Arrange:
        // 1. Giỏ hàng DB của User đã có sẵn 1x variant1
        var (service, _, user, variant1, variant2) = await CreateTestSetupAsync();
        await service.AddItemAsync(user.Id, null, new AddToCartRequestDto(variant1.Id, 1));

        // 2. Khách vãng lai thao tác ngoài frontend (localStorage / anonymous session):
        //    Có 2x variant1 và 1x variant2
        var guestMergeRequest = new MergeCartRequestDto(
            AnonymousId: null,
            Items: new List<MergeCartItemDto>
            {
                new(variant1.Id, 2),
                new(variant2.Id, 1)
            }
        );

        // Act: Đăng nhập thành công -> gọi gộp giỏ hàng vào tài khoản DB
        var mergeResult = await service.MergeCartAsync(user.Id, guestMergeRequest);

        // Assert:
        mergeResult.IsSuccess.Should().BeTrue();
        mergeResult.Data.Should().NotBeNull();
        mergeResult.Data!.Items.Should().HaveCount(2);

        // variant1: 1 (có sẵn) + 2 (từ khách) = 3
        var mergedItem1 = mergeResult.Data.Items.First(i => i.VariantId == variant1.Id);
        mergedItem1.Quantity.Should().Be(3);
        mergedItem1.Price.Should().Be(variant1.SalePrice);
        mergedItem1.TotalPrice.Should().Be(3 * variant1.SalePrice);

        // variant2: món mới thêm vào = 1
        var mergedItem2 = mergeResult.Data.Items.First(i => i.VariantId == variant2.Id);
        mergedItem2.Quantity.Should().Be(1);
        mergedItem2.Price.Should().Be(variant2.SalePrice);

        // Tổng tiền được server tính lại toàn bộ: (3 * 28.990.000) + (1 * 31.990.000)
        decimal expectedTotal = (3 * 28990000m) + (1 * 31990000m);
        mergeResult.Data.TotalAmount.Should().Be(expectedTotal);
        mergeResult.Data.TotalQuantity.Should().Be(4);
    }

    [Fact]
    public async Task AnonymousGuestCart_ShouldOperateIndependently_AndNotInterfereWithUserCart()
    {
        // Arrange
        var (service, _, user, variant1, variant2) = await CreateTestSetupAsync();
        string guestSessionId = "guest-session-" + Guid.NewGuid();

        // Act: Guest thêm sản phẩm qua session anonymous
        var guestAddResult = await service.AddItemAsync(null, guestSessionId, new AddToCartRequestDto(variant2.Id, 2));

        // User lấy giỏ hàng riêng của mình
        var userCartResult = await service.GetCartAsync(user.Id, null);

        // Assert: Giỏ hàng khách vãng lai và giỏ hàng user hoàn toàn độc lập
        guestAddResult.Data!.Items.Should().ContainSingle(i => i.VariantId == variant2.Id);
        guestAddResult.Data.AnonymousId.Should().Be(guestSessionId);

        userCartResult.Data!.Items.Should().BeEmpty();
    }
}
