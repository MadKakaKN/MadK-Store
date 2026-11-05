using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho tài khoản điểm thưởng khách hàng thân thiết (MadK Rewards / Loyalty).
/// </summary>
public class LoyaltyAccount : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// Số điểm hiện có có thể sử dụng (1 điểm = 1 VNĐ).
    /// </summary>
    public int CurrentBalance { get; set; } = 0;

    /// <summary>
    /// Tổng điểm tích lũy trọn đời từ các đơn hàng.
    /// </summary>
    public int LifetimePoints { get; set; } = 0;

    /// <summary>
    /// Hạng thành viên (Bronze, Silver, Gold, Diamond).
    /// </summary>
    public LoyaltyTier Tier { get; set; } = LoyaltyTier.Bronze;

    /// <summary>
    /// Tổng số tiền tích lũy chi tiêu thực tế.
    /// </summary>
    public decimal TotalSpent { get; set; } = 0m;

    public ICollection<LoyaltyTransaction> Transactions { get; set; } = new List<LoyaltyTransaction>();
}
