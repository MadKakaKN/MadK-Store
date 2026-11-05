using FluentAssertions;
using MadK.Application.DTOs.Wishlist;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class WishlistTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task AddToWishlistAsync_ValidProduct_AddsSuccessfully()
    {
        // Arrange
        var db = CreateInMemoryDbContext("WishlistTest_" + Guid.NewGuid());
        var service = new WishlistService(db, NullLogger<WishlistService>.Instance);

        var userId = Guid.NewGuid();
        var category = new Category { Id = Guid.NewGuid(), Name = "Bàn phím", Slug = "ban-phim" };
        var brand = new Brand { Id = Guid.NewGuid(), Name = "MadK", Slug = "madk" };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím không dây MadK",
            Slug = "ban-phim-khong-day-madk",
            CategoryId = category.Id,
            Category = category,
            BrandId = brand.Id,
            Brand = brand,
            BasePrice = 1200000m
        };

        db.Categories.Add(category);
        db.Brands.Add(brand);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Act
        var result = await service.AddToWishlistAsync(userId, product.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.ProductId.Should().Be(product.Id);
        result.Value.ProductName.Should().Be(product.Name);
        result.Value.CategoryName.Should().Be("Bàn phím");

        var inDb = await db.WishlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == product.Id);
        inDb.Should().NotBeNull();
    }

    [Fact]
    public async Task AddToWishlistAsync_DuplicateProduct_IsIdempotent()
    {
        // Arrange
        var db = CreateInMemoryDbContext("WishlistTest_" + Guid.NewGuid());
        var service = new WishlistService(db, NullLogger<WishlistService>.Instance);

        var userId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Chuột Gaming",
            Slug = "chuot-gaming",
            Category = new Category { Id = Guid.NewGuid(), Name = "Chuột", Slug = "chuot" },
            Brand = new Brand { Id = Guid.NewGuid(), Name = "Logitech", Slug = "logitech" }
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Act - Thêm lần 1
        var res1 = await service.AddToWishlistAsync(userId, product.Id);
        // Act - Thêm lần 2
        var res2 = await service.AddToWishlistAsync(userId, product.Id);

        // Assert
        res1.IsSuccess.Should().BeTrue();
        res2.IsSuccess.Should().BeTrue();
        var count = await db.WishlistItems.CountAsync(w => w.UserId == userId && w.ProductId == product.Id);
        count.Should().Be(1);
    }

    [Fact]
    public async Task RemoveFromWishlistAsync_RemovesItemFromDatabase()
    {
        // Arrange
        var db = CreateInMemoryDbContext("WishlistTest_" + Guid.NewGuid());
        var service = new WishlistService(db, NullLogger<WishlistService>.Instance);

        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        db.WishlistItems.Add(new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProductId = productId,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        // Act
        var result = await service.RemoveFromWishlistAsync(userId, productId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var inDb = await db.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId);
        inDb.Should().BeFalse();
    }

    [Fact]
    public async Task SyncWishlistAsync_MergesAnonymousItemsSuccessfully()
    {
        // Arrange
        var db = CreateInMemoryDbContext("WishlistTest_" + Guid.NewGuid());
        var service = new WishlistService(db, NullLogger<WishlistService>.Instance);

        var userId = Guid.NewGuid();
        var cat = new Category { Id = Guid.NewGuid(), Name = "Phụ kiện", Slug = "phu-kien" };
        var brand = new Brand { Id = Guid.NewGuid(), Name = "Apple", Slug = "apple" };

        var prod1 = new Product { Id = Guid.NewGuid(), Name = "Món 1", Slug = "mon-1", Category = cat, Brand = brand };
        var prod2 = new Product { Id = Guid.NewGuid(), Name = "Món 2", Slug = "mon-2", Category = cat, Brand = brand };
        var prod3 = new Product { Id = Guid.NewGuid(), Name = "Món 3", Slug = "mon-3", Category = cat, Brand = brand };

        db.Products.AddRange(prod1, prod2, prod3);

        // User đã thích trước món 1 trong DB
        db.WishlistItems.Add(new WishlistItem { Id = Guid.NewGuid(), UserId = userId, ProductId = prod1.Id });
        await db.SaveChangesAsync();

        // Khách vãng lai trước khi login có thích món 1, món 2, món 3 trong LocalStorage
        var syncDto = new SyncWishlistDto
        {
            ProductIds = new List<Guid> { prod1.Id, prod2.Id, prod3.Id }
        };

        // Act
        var result = await service.SyncWishlistAsync(userId, syncDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(3);
        var inDb = await db.WishlistItems.Where(w => w.UserId == userId).ToListAsync();
        inDb.Should().HaveCount(3);
    }
}
