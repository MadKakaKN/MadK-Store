using FluentAssertions;
using MadK.Application.DTOs.Reviews;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class ProductReviewTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateReviewAsync_WithCompletedOrder_GrantsVerifiedPurchaseBadge()
    {
        // Arrange
        var db = CreateInMemoryDbContext("ReviewTest_" + Guid.NewGuid());
        var service = new ProductReviewService(db, NullLogger<ProductReviewService>.Instance);

        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "khachhang@example.com",
            FullName = "Nguyễn Văn Khang",
            PasswordHash = "hash"
        };
        db.Users.Add(user);

        var productId = Guid.NewGuid();
        var product = new Product
        {
            Id = productId,
            Name = "Bàn phím cơ MadK Cyber 75",
            Slug = "ban-phim-co-madk-cyber-75",
            CategoryId = Guid.NewGuid(),
            BrandId = Guid.NewGuid(),
            BasePrice = 1850000m
        };
        db.Products.Add(product);

        // Tạo đơn hàng trạng thái Completed có chứa sản phẩm này
        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId,
            OrderNumber = "MK-20261105-REV01",
            UserId = userId,
            Status = OrderStatus.Completed,
            PaymentStatus = PaymentStatus.Paid,
            TotalAmount = 1850000m
        };
        var orderItem = new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = productId,
            ProductNameSnapshot = product.Name,
            UnitPriceSnapshot = 1850000m,
            Quantity = 1
        };
        db.Orders.Add(order);
        db.OrderItems.Add(orderItem);
        await db.SaveChangesAsync();

        var dto = new CreateProductReviewDto
        {
            Rating = 5,
            Title = "Bàn phím gõ rất mượt",
            Comment = "Switch êm ái, led RGB đẹp xuất sắc, kết nối không dây ổn định!",
            Images = new List<string> { "https://madk.store/uploads/review1.jpg" },
            OrderId = orderId
        };

        // Act
        var result = await service.CreateReviewAsync(userId, productId, dto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.IsVerifiedPurchase.Should().BeTrue();
        result.Value.Rating.Should().Be(5);
        result.Value.UserName.Should().Be("Nguyễn Văn Khang");
        result.Value.Images.Should().ContainSingle();

        var savedReview = await db.ProductReviews.FirstOrDefaultAsync(r => r.ProductId == productId);
        savedReview.Should().NotBeNull();
        savedReview!.IsVerifiedPurchase.Should().BeTrue();
        savedReview.Status.Should().Be(ReviewStatus.Approved);
    }

    [Fact]
    public async Task CreateReviewAsync_DuplicateReview_ReturnsFailure()
    {
        // Arrange
        var db = CreateInMemoryDbContext("ReviewTest_" + Guid.NewGuid());
        var service = new ProductReviewService(db, NullLogger<ProductReviewService>.Instance);

        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "test@madk.vn", FullName = "Tester" };
        var productId = Guid.NewGuid();
        var product = new Product { Id = productId, Name = "Chuột Gaming", Slug = "chuot-gaming" };

        db.Users.Add(user);
        db.Products.Add(product);

        // Seed 1 review đã có
        db.ProductReviews.Add(new ProductReview
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProductId = productId,
            Rating = 4,
            Comment = "Đã đánh giá lần đầu"
        });
        await db.SaveChangesAsync();

        // Act
        var result = await service.CreateReviewAsync(userId, productId, new CreateProductReviewDto
        {
            Rating = 5,
            Comment = "Cố tình đánh giá lần hai"
        });

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Bạn đã gửi đánh giá cho sản phẩm này rồi.");
    }

    [Fact]
    public async Task GetProductReviewsAsync_CalculatesRatingSummaryAccurately()
    {
        // Arrange
        var db = CreateInMemoryDbContext("ReviewTest_" + Guid.NewGuid());
        var service = new ProductReviewService(db, NullLogger<ProductReviewService>.Instance);

        var productId = Guid.NewGuid();
        var product = new Product { Id = productId, Name = "Tai nghe MadK Pro", Slug = "tai-nghe-madk-pro" };
        db.Products.Add(product);

        var user1 = new User { Id = Guid.NewGuid(), Email = "u1@test.com", FullName = "User 1" };
        var user2 = new User { Id = Guid.NewGuid(), Email = "u2@test.com", FullName = "User 2" };
        var user3 = new User { Id = Guid.NewGuid(), Email = "u3@test.com", FullName = "User 3" };
        var user4 = new User { Id = Guid.NewGuid(), Email = "u4@test.com", FullName = "User 4" };
        db.Users.AddRange(user1, user2, user3, user4);

        // 2 review 5 sao, 1 review 4 sao, 1 review 3 sao (Tổng 4 review, điểm TB = 17 / 4 = 4.25 -> làm tròn 4.3)
        db.ProductReviews.AddRange(
            new ProductReview { Id = Guid.NewGuid(), ProductId = productId, UserId = user1.Id, Rating = 5, Comment = "Đỉnh", Status = ReviewStatus.Approved },
            new ProductReview { Id = Guid.NewGuid(), ProductId = productId, UserId = user2.Id, Rating = 5, Comment = "Rất tốt", Status = ReviewStatus.Approved },
            new ProductReview { Id = Guid.NewGuid(), ProductId = productId, UserId = user3.Id, Rating = 4, Comment = "Tạm ổn", Status = ReviewStatus.Approved },
            new ProductReview { Id = Guid.NewGuid(), ProductId = productId, UserId = user4.Id, Rating = 3, Comment = "Bình thường", Status = ReviewStatus.Approved }
        );
        await db.SaveChangesAsync();

        // Act
        var result = await service.GetProductReviewsAsync(productId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var summary = result.Value!.Summary;
        summary.TotalReviews.Should().Be(4);
        summary.AverageRating.Should().Be(4.3);
        summary.RatingDistribution[5].Should().Be(2);
        summary.RatingDistribution[4].Should().Be(1);
        summary.RatingDistribution[3].Should().Be(1);
        summary.RatingPercentages[5].Should().Be(50.0);
    }

    [Fact]
    public async Task AdminModeration_CanUpdateStatusAndAddReply()
    {
        // Arrange
        var db = CreateInMemoryDbContext("ReviewTest_" + Guid.NewGuid());
        var service = new ProductReviewService(db, NullLogger<ProductReviewService>.Instance);

        var reviewId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        db.Users.Add(new User { Id = userId, Email = "customer@gmail.com", FullName = "Khách Hàng" });
        db.Products.Add(new Product { Id = productId, Name = "Sản phẩm A", Slug = "san-pham-a" });
        db.ProductReviews.Add(new ProductReview
        {
            Id = reviewId,
            ProductId = productId,
            UserId = userId,
            Rating = 5,
            Comment = "Hàng chuẩn chính hãng!",
            Status = ReviewStatus.Approved
        });
        await db.SaveChangesAsync();

        // Act - Admin phản hồi
        var updateDto = new AdminReviewStatusUpdateDto
        {
            Status = ReviewStatus.Approved,
            AdminReply = "Cảm ơn bạn đã tin tưởng ủng hộ MadK Store ạ!"
        };
        var updateResult = await service.AdminUpdateReviewStatusAsync(reviewId, updateDto);

        // Assert
        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Value!.AdminReply.Should().Be("Cảm ơn bạn đã tin tưởng ủng hộ MadK Store ạ!");
        updateResult.Value.AdminRepliedAt.Should().NotBeNull();

        // Act - Vote helpful
        var voteResult = await service.VoteHelpfulAsync(reviewId);
        voteResult.IsSuccess.Should().BeTrue();
        voteResult.Value.Should().Be(1);
    }
}
