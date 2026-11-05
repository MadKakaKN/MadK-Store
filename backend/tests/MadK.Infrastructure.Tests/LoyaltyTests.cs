using FluentAssertions;
using MadK.Application.DTOs.Loyalty;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class LoyaltyTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    private static LoyaltyService CreateService(AppDbContext db, LoyaltySettings? settings = null)
    {
        var opt = Options.Create(settings ?? new LoyaltySettings
        {
            DefaultEarnRatePercent = 2.0m,
            PointValueInVnd = 1.0m,
            MaxRedeemPercentageOfOrder = 50.0m,
            SilverThresholdVnd = 5_000_000m,
            GoldThresholdVnd = 15_000_000m,
            DiamondThresholdVnd = 30_000_000m
        });

        return new LoyaltyService(db, NullLogger<LoyaltyService>.Instance, opt);
    }

    [Fact]
    public async Task GetOrCreateAccount_ShouldCreateBronzeAccount_WhenNewUser()
    {
        var db = CreateInMemoryDbContext(nameof(GetOrCreateAccount_ShouldCreateBronzeAccount_WhenNewUser));
        var service = CreateService(db);
        var userId = Guid.NewGuid();

        var account = await service.GetOrCreateAccountAsync(userId);

        account.Should().NotBeNull();
        account.UserId.Should().Be(userId);
        account.CurrentBalance.Should().Be(0);
        account.LifetimePoints.Should().Be(0);
        account.Tier.Should().Be("Bronze");
        account.EarnRatePercent.Should().Be(1.0m);
        account.NextTier.Should().Be("Silver");
        account.SpentNeededForNextTier.Should().Be(5_000_000m);
    }

    [Fact]
    public async Task EstimateRedeemPoints_ShouldCalculateDiscount_WhenValid()
    {
        var db = CreateInMemoryDbContext(nameof(EstimateRedeemPoints_ShouldCalculateDiscount_WhenValid));
        var service = CreateService(db);
        var userId = Guid.NewGuid();

        // Setup account with 50,000 points
        var acc = new LoyaltyAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CurrentBalance = 50_000,
            LifetimePoints = 50_000,
            Tier = LoyaltyTier.Bronze
        };
        db.LoyaltyAccounts.Add(acc);
        await db.SaveChangesAsync();

        // Subtotal = 200,000 -> Max 50% = 100,000 points allowed
        var estimate = await service.EstimateRedeemPointsAsync(userId, 200_000m, 30_000);

        estimate.IsValid.Should().BeTrue();
        estimate.PointsToRedeem.Should().Be(30_000);
        estimate.DiscountAmount.Should().Be(30_000m);
        estimate.MaximumRedeemablePoints.Should().Be(50_000); // limited by balance
    }

    [Fact]
    public async Task EstimateRedeemPoints_ShouldFail_WhenExceedsFiftyPercentOfOrder()
    {
        var db = CreateInMemoryDbContext(nameof(EstimateRedeemPoints_ShouldFail_WhenExceedsFiftyPercentOfOrder));
        var service = CreateService(db);
        var userId = Guid.NewGuid();

        var acc = new LoyaltyAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CurrentBalance = 100_000,
            LifetimePoints = 100_000
        };
        db.LoyaltyAccounts.Add(acc);
        await db.SaveChangesAsync();

        // Subtotal = 100,000 -> Max 50% = 50,000 points
        var estimate = await service.EstimateRedeemPointsAsync(userId, 100_000m, 70_000);

        estimate.IsValid.Should().BeFalse();
        estimate.ErrorMessage.Should().Contain("50%");
    }

    [Fact]
    public async Task ValidateAndDeductPoints_ShouldDeductBalanceAndCreateTx_WhenValid()
    {
        var db = CreateInMemoryDbContext(nameof(ValidateAndDeductPoints_ShouldDeductBalanceAndCreateTx_WhenValid));
        var service = CreateService(db);
        var userId = Guid.NewGuid();

        var acc = new LoyaltyAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CurrentBalance = 40_000,
            LifetimePoints = 40_000
        };
        db.LoyaltyAccounts.Add(acc);
        await db.SaveChangesAsync();

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-20261105-POINTS",
            SubtotalAmount = 200_000m,
            TotalAmount = 180_000m
        };

        var result = await service.ValidateAndDeductPointsForOrderAsync(userId, order, 20_000);

        result.Success.Should().BeTrue();
        result.PointsUsed.Should().Be(20_000);
        result.DiscountAmount.Should().Be(20_000m);

        acc.CurrentBalance.Should().Be(20_000);
        order.LoyaltyPointsUsed.Should().Be(20_000);
        order.LoyaltyDiscountAmount.Should().Be(20_000m);

        var tx = await db.LoyaltyTransactions.FirstOrDefaultAsync(t => t.UserId == userId);
        tx.Should().NotBeNull();
        tx!.Points.Should().Be(-20_000);
        tx.Type.Should().Be(LoyaltyTransactionType.Redeemed);
    }

    [Fact]
    public async Task AwardPointsForOrder_ShouldAwardPointsAndUpgradeTier_WhenCompleted()
    {
        var db = CreateInMemoryDbContext(nameof(AwardPointsForOrder_ShouldAwardPointsAndUpgradeTier_WhenCompleted));
        var service = CreateService(db);
        var userId = Guid.NewGuid();

        var acc = new LoyaltyAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CurrentBalance = 0,
            LifetimePoints = 0,
            Tier = LoyaltyTier.Bronze,
            TotalSpent = 4_500_000m // Close to Silver (5,000,000)
        };
        db.LoyaltyAccounts.Add(acc);
        await db.SaveChangesAsync();

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-20261105-UPGRADE",
            UserId = userId,
            SubtotalAmount = 1_000_000m,
            TotalAmount = 1_000_000m,
            Status = OrderStatus.Completed
        };

        await service.AwardPointsForOrderAsync(order);

        // Bronze tier awards 1% of 1,000,000 = 10,000 points
        order.LoyaltyPointsEarned.Should().Be(10_000);
        acc.CurrentBalance.Should().Be(10_000);
        acc.LifetimePoints.Should().Be(10_000);
        acc.TotalSpent.Should().Be(5_500_000m);
        acc.Tier.Should().Be(LoyaltyTier.Silver); // Upgraded to Silver!
    }

    [Fact]
    public async Task RefundPointsForOrder_ShouldRefundUsedPoints_WhenCancelled()
    {
        var db = CreateInMemoryDbContext(nameof(RefundPointsForOrder_ShouldRefundUsedPoints_WhenCancelled));
        var service = CreateService(db);
        var userId = Guid.NewGuid();

        var acc = new LoyaltyAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CurrentBalance = 10_000,
            LifetimePoints = 30_000
        };
        db.LoyaltyAccounts.Add(acc);
        await db.SaveChangesAsync();

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-20261105-CANCEL",
            UserId = userId,
            LoyaltyPointsUsed = 20_000,
            LoyaltyDiscountAmount = 20_000m,
            LoyaltyPointsRefunded = false
        };

        await service.RefundPointsForOrderAsync(order, "Khách đổi ý hủy đơn");

        order.LoyaltyPointsRefunded.Should().BeTrue();
        acc.CurrentBalance.Should().Be(30_000); // 10,000 + 20,000 refunded

        var refundTx = await db.LoyaltyTransactions
            .FirstOrDefaultAsync(t => t.Type == LoyaltyTransactionType.Refunded);
        refundTx.Should().NotBeNull();
        refundTx!.Points.Should().Be(20_000);
    }

    [Fact]
    public async Task AdminAdjustPoints_ShouldAdjustBalance_WhenValid()
    {
        var db = CreateInMemoryDbContext(nameof(AdminAdjustPoints_ShouldAdjustBalance_WhenValid));
        var service = CreateService(db);
        var userId = Guid.NewGuid();

        var acc = new LoyaltyAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CurrentBalance = 15_000,
            LifetimePoints = 15_000
        };
        db.LoyaltyAccounts.Add(acc);
        await db.SaveChangesAsync();

        // Admin awards 10,000 points bonus
        var updated = await service.AdminAdjustPointsAsync(userId, 10_000, "Thưởng thành viên tích cực");

        updated.CurrentBalance.Should().Be(25_000);
        updated.LifetimePoints.Should().Be(25_000);

        var tx = await db.LoyaltyTransactions
            .FirstOrDefaultAsync(t => t.Type == LoyaltyTransactionType.Adjusted);
        tx.Should().NotBeNull();
        tx!.Points.Should().Be(10_000);
        tx.Description.Should().Contain("Thưởng thành viên tích cực");
    }
}
