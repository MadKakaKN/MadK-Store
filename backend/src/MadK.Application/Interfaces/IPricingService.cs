using MadK.Application.Common;
using MadK.Application.DTOs.Pricing;
using MadK.Domain.Entities;

namespace MadK.Application.Interfaces;

public interface IPricingService
{
    /// <summary>
    /// Hàm tính "giá hiện hành" dùng chung cho catalog, giỏ hàng, đơn hàng.
    /// Tính giá có hiệu lực tại thời điểm xác định (mặc định là UtcNow).
    /// </summary>
    Task<CurrentPriceResult> GetCurrentPriceAsync(Guid variantId, DateTimeOffset? atTime = null, CancellationToken ct = default);

    /// <summary>
    /// Hàm tính "giá hiện hành" từ thực thể ProductVariant đã nạp sẵn danh sách PriceSchedules trong bộ nhớ.
    /// Dùng cho các luồng xử lý giỏ hàng, duyệt catalog, tạo đơn hàng để tối ưu hiệu năng không query N+1.
    /// </summary>
    CurrentPriceResult CalculateCurrentPrice(ProductVariant variant, DateTimeOffset? atTime = null);

    /// <summary>
    /// Lấy toàn bộ lịch sử và cấu hình giá theo biến thể.
    /// </summary>
    Task<Result<VariantPricingDto>> GetVariantPricingAsync(Guid variantId, CancellationToken ct = default);

    /// <summary>
    /// Tạo khoảng giá khuyến mãi theo thời gian cho biến thể.
    /// Từ chối nếu khoảng thời gian bị chồng chéo với khuyến mãi hiện có.
    /// </summary>
    Task<Result<PriceScheduleDto>> CreatePromotionScheduleAsync(
        Guid variantId,
        CreatePriceScheduleDto dto,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default);

    /// <summary>
    /// Cập nhật giá niêm yết và giá bán chuẩn của biến thể, đồng thời lưu lịch sử thay đổi.
    /// </summary>
    Task<Result<VariantPricingDto>> UpdateBasePriceAsync(
        Guid variantId,
        UpdateBasePriceDto dto,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default);

    /// <summary>
    /// Bật/tắt kích hoạt một lịch trình giá khuyến mãi.
    /// </summary>
    Task<Result<bool>> ToggleScheduleActiveAsync(
        Guid scheduleId,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default);

    /// <summary>
    /// Xóa mềm một lịch trình giá khuyến mãi.
    /// </summary>
    Task<Result<bool>> DeleteScheduleAsync(
        Guid scheduleId,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách biến thể kèm giá hiện hành và trạng thái khuyến mãi (dành cho Admin Pricing UI).
    /// </summary>
    Task<Result<PagedResult<AdminVariantPriceItemDto>>> GetAdminVariantPricesAsync(
        AdminPricingQueryParams queryParams,
        CancellationToken ct = default);
}
