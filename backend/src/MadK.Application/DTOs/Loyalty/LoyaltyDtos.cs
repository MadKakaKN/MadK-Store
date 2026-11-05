using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Loyalty;

public class LoyaltySettings
{
    public const string SectionName = "LoyaltySettings";

    /// <summary>
    /// Tỷ lệ tích điểm mặc định theo phần trăm giá trị đơn hàng (mặc định 2%).
    /// </summary>
    public decimal DefaultEarnRatePercent { get; set; } = 2.0m;

    /// <summary>
    /// Giá trị quy đổi của 1 điểm sang VNĐ (mặc định 1 điểm = 1 VNĐ).
    /// </summary>
    public decimal PointValueInVnd { get; set; } = 1.0m;

    /// <summary>
    /// Tỷ lệ tối đa tiền hàng được giảm trừ bằng điểm thưởng (mặc định 50%).
    /// </summary>
    public decimal MaxRedeemPercentageOfOrder { get; set; } = 50.0m;

    /// <summary>
    /// Ngưỡng chi tiêu thăng hạng (VNĐ).
    /// </summary>
    public decimal SilverThresholdVnd { get; set; } = 5_000_000m;
    public decimal GoldThresholdVnd { get; set; } = 15_000_000m;
    public decimal DiamondThresholdVnd { get; set; } = 30_000_000m;
}

public record LoyaltyAccountDto(
    Guid UserId,
    int CurrentBalance,
    int LifetimePoints,
    string Tier,
    decimal TotalSpent,
    decimal PointsValueVnd,
    decimal EarnRatePercent,
    string? NextTier = null,
    decimal? SpentNeededForNextTier = null
);

public record LoyaltyTransactionDto(
    Guid Id,
    Guid? OrderId,
    string? OrderNumber,
    int Points,
    int BalanceAfter,
    string Type,
    string Description,
    DateTime CreatedAt
);

public record LoyaltyHistoryResponseDto(
    List<LoyaltyTransactionDto> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public record RedeemPointsEstimateRequestDto(
    decimal SubtotalAmount,
    int PointsToRedeem
);

public record RedeemPointsEstimateResponseDto(
    int PointsToRedeem,
    decimal DiscountAmount,
    int MaximumRedeemablePoints,
    int PointsBalance,
    bool IsValid,
    string? ErrorMessage = null
);

public record AdminAdjustPointsRequestDto(
    Guid UserId,
    int Points,
    string Reason
);
