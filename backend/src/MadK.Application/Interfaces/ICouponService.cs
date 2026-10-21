using MadK.Application.Common;
using MadK.Application.DTOs.Promotions;
using MadK.Domain.Entities;

namespace MadK.Application.Interfaces;

public interface ICouponService
{
    /// <summary>
    /// Kiểm tra tính hợp lệ của mã giảm giá và tính số tiền được giảm theo giá trị đơn hàng.
    /// Không làm thay đổi lượt sử dụng (Dùng cho xem trước / kiểm tra tại checkout).
    /// </summary>
    Task<Result<CouponCalculationResultDto>> ValidateAndCalculateDiscountAsync(
        string code,
        decimal subtotalAmount,
        CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra và tăng lượt sử dụng của Coupon khi đặt hàng trong transaction.
    /// Đảm bảo kiểm soát đồng thời không vượt quá UsageLimit.
    /// </summary>
    Task<Result<(Coupon Coupon, decimal DiscountAmount)>> ClaimAndIncrementUsageAsync(
        string code,
        decimal subtotalAmount,
        CancellationToken ct = default);

    /// <summary>
    /// Danh sách coupon cho Admin (phân trang, tìm kiếm, lọc active).
    /// </summary>
    Task<Result<PagedResult<CouponDto>>> GetCouponsAsync(
        CouponFilterDto filter,
        CancellationToken ct = default);

    /// <summary>
    /// Xem chi tiết một coupon.
    /// </summary>
    Task<Result<CouponDto>> GetCouponByIdAsync(
        Guid id,
        CancellationToken ct = default);

    /// <summary>
    /// Tạo mã coupon mới (Admin).
    /// </summary>
    Task<Result<CouponDto>> CreateCouponAsync(
        CreateCouponDto dto,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default);

    /// <summary>
    /// Cập nhật mã coupon (Admin).
    /// </summary>
    Task<Result<CouponDto>> UpdateCouponAsync(
        Guid id,
        UpdateCouponDto dto,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default);

    /// <summary>
    /// Bật/tắt trạng thái kích hoạt của coupon (Admin).
    /// </summary>
    Task<Result<CouponDto>> ToggleActiveAsync(
        Guid id,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default);

    /// <summary>
    /// Xóa coupon (Admin).
    /// </summary>
    Task<Result<bool>> DeleteCouponAsync(
        Guid id,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default);
}
