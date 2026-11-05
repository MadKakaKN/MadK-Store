using MadK.Application.DTOs.Loyalty;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MadK.Infrastructure.Services;

public class LoyaltyService : ILoyaltyService
{
    private readonly IAppDbContext _context;
    private readonly ILogger<LoyaltyService> _logger;
    private readonly LoyaltySettings _settings;

    public LoyaltyService(
        IAppDbContext context,
        ILogger<LoyaltyService> logger,
        IOptions<LoyaltySettings> settings)
    {
        _context = context;
        _logger = logger;
        _settings = settings.Value ?? new LoyaltySettings();
    }

    public async Task<LoyaltyAccountDto> GetOrCreateAccountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var account = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(a => a.UserId == userId, cancellationToken);

        if (account == null)
        {
            account = new LoyaltyAccount
            {
                UserId = userId,
                CurrentBalance = 0,
                LifetimePoints = 0,
                Tier = LoyaltyTier.Bronze,
                TotalSpent = 0m,
                CreatedAt = DateTime.UtcNow
            };

            _context.LoyaltyAccounts.Add(account);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Recalculate tier based on total spent
        var newTier = CalculateTier(account.TotalSpent);
        if (account.Tier != newTier)
        {
            account.Tier = newTier;
            account.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return MapToDto(account);
    }

    public async Task<LoyaltyHistoryResponseDto> GetHistoryAsync(Guid userId, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;

        var query = _context.LoyaltyTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new LoyaltyTransactionDto(
                t.Id,
                t.OrderId,
                t.OrderNumber,
                t.Points,
                t.BalanceAfter,
                t.Type.ToString(),
                t.Description,
                t.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new LoyaltyHistoryResponseDto(items, totalCount, page, pageSize);
    }

    public async Task<RedeemPointsEstimateResponseDto> EstimateRedeemPointsAsync(Guid userId, decimal subtotalAmount, int pointsToRedeem, CancellationToken cancellationToken = default)
    {
        var account = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(a => a.UserId == userId, cancellationToken);

        var balance = account?.CurrentBalance ?? 0;

        // Max points can redeem: at most MaxRedeemPercentageOfOrder of subtotal
        var maxOrderAllowanceVnd = subtotalAmount * (_settings.MaxRedeemPercentageOfOrder / 100m);
        var maxPointsByOrder = (int)Math.Floor(maxOrderAllowanceVnd / _settings.PointValueInVnd);
        var maxPointsAllowed = Math.Min(balance, Math.Max(0, maxPointsByOrder));

        if (pointsToRedeem <= 0)
        {
            return new RedeemPointsEstimateResponseDto(0, 0m, maxPointsAllowed, balance, true);
        }

        if (pointsToRedeem > balance)
        {
            return new RedeemPointsEstimateResponseDto(
                pointsToRedeem,
                0m,
                maxPointsAllowed,
                balance,
                false,
                $"Bạn chỉ có {balance:N0} điểm khả dụng."
            );
        }

        if (pointsToRedeem > maxPointsAllowed)
        {
            return new RedeemPointsEstimateResponseDto(
                pointsToRedeem,
                0m,
                maxPointsAllowed,
                balance,
                false,
                $"Số điểm quy đổi tối đa cho đơn hàng này là {maxPointsAllowed:N0} điểm (50% giá trị hàng)."
            );
        }

        var discount = pointsToRedeem * _settings.PointValueInVnd;
        return new RedeemPointsEstimateResponseDto(pointsToRedeem, discount, maxPointsAllowed, balance, true);
    }

    public async Task<(bool Success, string? Error, int PointsUsed, decimal DiscountAmount)> ValidateAndDeductPointsForOrderAsync(
        Guid userId, Order order, int pointsToRedeem, CancellationToken cancellationToken = default)
    {
        if (pointsToRedeem <= 0)
        {
            return (true, null, 0, 0m);
        }

        var account = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(a => a.UserId == userId, cancellationToken);

        if (account == null || account.CurrentBalance < pointsToRedeem)
        {
            var bal = account?.CurrentBalance ?? 0;
            return (false, $"Tài khoản không đủ điểm thưởng ({bal:N0} điểm).", 0, 0m);
        }

        var maxOrderAllowanceVnd = order.SubtotalAmount * (_settings.MaxRedeemPercentageOfOrder / 100m);
        var maxPointsByOrder = (int)Math.Floor(maxOrderAllowanceVnd / _settings.PointValueInVnd);
        var maxAllowed = Math.Min(account.CurrentBalance, Math.Max(0, maxPointsByOrder));

        if (pointsToRedeem > maxAllowed)
        {
            return (false, $"Chỉ được dùng tối đa {maxAllowed:N0} điểm (50% đơn hàng).", 0, 0m);
        }

        var discountAmount = pointsToRedeem * _settings.PointValueInVnd;

        // Deduct points
        account.CurrentBalance -= pointsToRedeem;
        account.UpdatedAt = DateTime.UtcNow;

        var transaction = new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            UserId = userId,
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            Points = -pointsToRedeem,
            BalanceAfter = account.CurrentBalance,
            Type = LoyaltyTransactionType.Redeemed,
            Description = $"Sử dụng {pointsToRedeem:N0} điểm giảm {discountAmount:N0}đ cho đơn hàng {order.OrderNumber}",
            CreatedAt = DateTime.UtcNow
        };

        _context.LoyaltyTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        order.LoyaltyPointsUsed = pointsToRedeem;
        order.LoyaltyDiscountAmount = discountAmount;

        _logger.LogInformation("Đã trừ {Points} điểm của user {UserId} cho đơn {OrderNumber}", pointsToRedeem, userId, order.OrderNumber);

        return (true, null, pointsToRedeem, discountAmount);
    }

    public async Task AwardPointsForOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        if (!order.UserId.HasValue) return;
        if (order.LoyaltyPointsEarned > 0) return; // Already earned

        var account = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(a => a.UserId == order.UserId.Value, cancellationToken);

        if (account == null)
        {
            account = new LoyaltyAccount
            {
                UserId = order.UserId.Value,
                CurrentBalance = 0,
                LifetimePoints = 0,
                Tier = LoyaltyTier.Bronze,
                TotalSpent = 0m,
                CreatedAt = DateTime.UtcNow
            };
            _context.LoyaltyAccounts.Add(account);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var earnRate = GetEarnRatePercent(account.Tier);
        var eligibleSpend = Math.Max(0m, order.SubtotalAmount - order.DiscountAmount - order.LoyaltyDiscountAmount);
        var pointsEarned = (int)Math.Floor(eligibleSpend * (earnRate / 100m));

        if (pointsEarned <= 0) return;

        account.CurrentBalance += pointsEarned;
        account.LifetimePoints += pointsEarned;
        account.TotalSpent += order.TotalAmount;
        account.Tier = CalculateTier(account.TotalSpent);
        account.UpdatedAt = DateTime.UtcNow;

        order.LoyaltyPointsEarned = pointsEarned;

        var transaction = new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            UserId = order.UserId.Value,
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            Points = pointsEarned,
            BalanceAfter = account.CurrentBalance,
            Type = LoyaltyTransactionType.Earned,
            Description = $"Tích lũy {pointsEarned:N0} điểm ({earnRate}% hạng {account.Tier}) từ đơn hàng {order.OrderNumber}",
            CreatedAt = DateTime.UtcNow
        };

        _context.LoyaltyTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Đã tích {Points} điểm cho user {UserId} từ đơn hàng {OrderNumber}", pointsEarned, order.UserId.Value, order.OrderNumber);
    }

    public async Task RefundPointsForOrderAsync(Order order, string reason, CancellationToken cancellationToken = default)
    {
        if (!order.UserId.HasValue || order.LoyaltyPointsRefunded) return;

        var account = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(a => a.UserId == order.UserId.Value, cancellationToken);

        if (account == null) return;

        // 1. Refund used points if any
        if (order.LoyaltyPointsUsed > 0)
        {
            account.CurrentBalance += order.LoyaltyPointsUsed;
            var refundTx = new LoyaltyTransaction
            {
                LoyaltyAccountId = account.Id,
                UserId = order.UserId.Value,
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                Points = order.LoyaltyPointsUsed,
                BalanceAfter = account.CurrentBalance,
                Type = LoyaltyTransactionType.Refunded,
                Description = $"Hoàn lại {order.LoyaltyPointsUsed:N0} điểm do đơn hàng {order.OrderNumber} bị hủy/hoàn trả ({reason})",
                CreatedAt = DateTime.UtcNow
            };
            _context.LoyaltyTransactions.Add(refundTx);
        }

        // 2. Revoke earned points if any
        if (order.LoyaltyPointsEarned > 0)
        {
            account.CurrentBalance = Math.Max(0, account.CurrentBalance - order.LoyaltyPointsEarned);
            account.TotalSpent = Math.Max(0m, account.TotalSpent - order.TotalAmount);
            account.Tier = CalculateTier(account.TotalSpent);

            var revokeTx = new LoyaltyTransaction
            {
                LoyaltyAccountId = account.Id,
                UserId = order.UserId.Value,
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                Points = -order.LoyaltyPointsEarned,
                BalanceAfter = account.CurrentBalance,
                Type = LoyaltyTransactionType.Adjusted,
                Description = $"Thu hồi {order.LoyaltyPointsEarned:N0} điểm thưởng do đơn hàng {order.OrderNumber} bị hủy/hoàn trả",
                CreatedAt = DateTime.UtcNow
            };
            _context.LoyaltyTransactions.Add(revokeTx);
        }

        order.LoyaltyPointsRefunded = true;
        account.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Đã xử lý hoàn điểm cho đơn hàng {OrderNumber}", order.OrderNumber);
    }

    public async Task<LoyaltyAccountDto> AdminAdjustPointsAsync(Guid userId, int points, string reason, CancellationToken cancellationToken = default)
    {
        if (points == 0)
        {
            throw new ArgumentException("Số điểm điều chỉnh phải khác 0.");
        }

        var account = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(a => a.UserId == userId, cancellationToken);

        if (account == null)
        {
            account = new LoyaltyAccount
            {
                UserId = userId,
                CurrentBalance = 0,
                LifetimePoints = 0,
                Tier = LoyaltyTier.Bronze,
                TotalSpent = 0m,
                CreatedAt = DateTime.UtcNow
            };
            _context.LoyaltyAccounts.Add(account);
            await _context.SaveChangesAsync(cancellationToken);
        }

        if (points < 0 && account.CurrentBalance + points < 0)
        {
            throw new InvalidOperationException($"Số dư điểm hiện tại ({account.CurrentBalance}) không đủ để trừ {Math.Abs(points)} điểm.");
        }

        account.CurrentBalance += points;
        if (points > 0)
        {
            account.LifetimePoints += points;
        }
        account.UpdatedAt = DateTime.UtcNow;

        var tx = new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            UserId = userId,
            Points = points,
            BalanceAfter = account.CurrentBalance,
            Type = LoyaltyTransactionType.Adjusted,
            Description = $"Quản trị viên điều chỉnh: {reason}",
            CreatedAt = DateTime.UtcNow
        };

        _context.LoyaltyTransactions.Add(tx);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(account);
    }

    private LoyaltyTier CalculateTier(decimal totalSpent)
    {
        if (totalSpent >= _settings.DiamondThresholdVnd) return LoyaltyTier.Diamond;
        if (totalSpent >= _settings.GoldThresholdVnd) return LoyaltyTier.Gold;
        if (totalSpent >= _settings.SilverThresholdVnd) return LoyaltyTier.Silver;
        return LoyaltyTier.Bronze;
    }

    private decimal GetEarnRatePercent(LoyaltyTier tier)
    {
        return tier switch
        {
            LoyaltyTier.Diamond => 5.0m,
            LoyaltyTier.Gold => 3.0m,
            LoyaltyTier.Silver => 2.0m,
            _ => 1.0m
        };
    }

    private LoyaltyAccountDto MapToDto(LoyaltyAccount account)
    {
        var earnRate = GetEarnRatePercent(account.Tier);
        var pointsValueVnd = account.CurrentBalance * _settings.PointValueInVnd;

        string? nextTier = null;
        decimal? spentNeeded = null;

        if (account.Tier == LoyaltyTier.Bronze)
        {
            nextTier = "Silver";
            spentNeeded = Math.Max(0m, _settings.SilverThresholdVnd - account.TotalSpent);
        }
        else if (account.Tier == LoyaltyTier.Silver)
        {
            nextTier = "Gold";
            spentNeeded = Math.Max(0m, _settings.GoldThresholdVnd - account.TotalSpent);
        }
        else if (account.Tier == LoyaltyTier.Gold)
        {
            nextTier = "Diamond";
            spentNeeded = Math.Max(0m, _settings.DiamondThresholdVnd - account.TotalSpent);
        }

        return new LoyaltyAccountDto(
            account.UserId,
            account.CurrentBalance,
            account.LifetimePoints,
            account.Tier.ToString(),
            account.TotalSpent,
            pointsValueVnd,
            earnRate,
            nextTier,
            spentNeeded
        );
    }
}
