using MadK.Application.DTOs.Loyalty;
using MadK.Domain.Entities;

namespace MadK.Application.Interfaces;

/// <summary>
/// Giao diện dịch vụ quản lý điểm thưởng khách hàng thân thiết (MadK Rewards / Loyalty).
/// </summary>
public interface ILoyaltyService
{
    /// <summary>
    /// Lấy hoặc tự động tạo tài khoản điểm cho khách hàng nếu chưa có.
    /// </summary>
    Task<LoyaltyAccountDto> GetOrCreateAccountAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy lịch sử biến động điểm thưởng phân trang.
    /// </summary>
    Task<LoyaltyHistoryResponseDto> GetHistoryAsync(Guid userId, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tính toán và kiểm tra tính hợp lệ của số điểm khách hàng muốn đổi (ước lượng giảm trừ).
    /// </summary>
    Task<RedeemPointsEstimateResponseDto> EstimateRedeemPointsAsync(Guid userId, decimal subtotalAmount, int pointsToRedeem, CancellationToken cancellationToken = default);

    /// <summary>
    /// Kiểm tra tính hợp lệ và trừ điểm khách hàng khi đặt đơn hàng.
    /// </summary>
    Task<(bool Success, string? Error, int PointsUsed, decimal DiscountAmount)> ValidateAndDeductPointsForOrderAsync(
        Guid userId, Order order, int pointsToRedeem, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cộng điểm thưởng cho khách hàng khi đơn hàng giao thành công (Completed).
    /// </summary>
    Task AwardPointsForOrderAsync(Order order, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hoàn trả điểm đã sử dụng cho khách hàng khi đơn hàng bị hủy hoặc trả hàng.
    /// Đồng thời thu hồi điểm đã cộng nếu có.
    /// </summary>
    Task RefundPointsForOrderAsync(Order order, string reason, CancellationToken cancellationToken = default);

    /// <summary>
    /// Admin điều chỉnh cộng/trừ điểm thủ công cho khách hàng kèm lý do.
    /// </summary>
    Task<LoyaltyAccountDto> AdminAdjustPointsAsync(Guid userId, int points, string reason, CancellationToken cancellationToken = default);
}
