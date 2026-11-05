using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Lịch sử biến động điểm thưởng (cộng điểm từ đơn hàng, trừ điểm khi checkout, hoàn điểm khi hủy đơn).
/// </summary>
public class LoyaltyTransaction : BaseEntity
{
    public Guid LoyaltyAccountId { get; set; }
    public LoyaltyAccount LoyaltyAccount { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }

    public string? OrderNumber { get; set; }

    /// <summary>
    /// Số điểm thay đổi (+ cộng điểm, - trừ điểm).
    /// </summary>
    public int Points { get; set; }

    /// <summary>
    /// Số dư điểm khả dụng sau giao dịch.
    /// </summary>
    public int BalanceAfter { get; set; }

    public LoyaltyTransactionType Type { get; set; }

    public string Description { get; set; } = string.Empty;
}
