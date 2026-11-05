using MadK.Application.Common;
using MadK.Application.DTOs.Reviews;
using MadK.Domain.Enums;

namespace MadK.Application.Interfaces;

/// <summary>
/// Giao diện xử lý nghiệp vụ Đánh giá & Xếp hạng sản phẩm.
/// </summary>
public interface IProductReviewService
{
    /// <summary>
    /// Lấy danh sách đánh giá công khai (đã duyệt) của sản phẩm kèm tóm tắt số sao và phân bổ.
    /// </summary>
    Task<Result<ProductReviewsPagedResultDto>> GetProductReviewsAsync(
        Guid productId,
        int page = 1,
        int pageSize = 10,
        int? ratingFilter = null,
        CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra quyền đánh giá của khách hàng (đã mua hàng thành công chưa, đã đánh giá chưa).
    /// </summary>
    Task<Result<CanReviewProductResultDto>> CanUserReviewProductAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default);

    /// <summary>
    /// Khách hàng gửi đánh giá mới cho sản phẩm.
    /// </summary>
    Task<Result<ProductReviewDto>> CreateReviewAsync(
        Guid userId,
        Guid productId,
        CreateProductReviewDto dto,
        CancellationToken ct = default);

    /// <summary>
    /// Quản trị viên lấy danh sách đánh giá để kiểm duyệt.
    /// </summary>
    Task<Result<PagedResult<AdminReviewDto>>> AdminGetReviewsAsync(
        int page = 1,
        int pageSize = 20,
        ReviewStatus? status = null,
        Guid? productId = null,
        string? search = null,
        CancellationToken ct = default);

    /// <summary>
    /// Quản trị viên phê duyệt, ẩn hoặc trả lời đánh giá.
    /// </summary>
    Task<Result<AdminReviewDto>> AdminUpdateReviewStatusAsync(
        Guid reviewId,
        AdminReviewStatusUpdateDto dto,
        CancellationToken ct = default);

    /// <summary>
    /// Quản trị viên xóa (soft delete) đánh giá.
    /// </summary>
    Task<Result<bool>> AdminDeleteReviewAsync(
        Guid reviewId,
        CancellationToken ct = default);

    /// <summary>
    /// Người dùng vote "Đánh giá hữu ích".
    /// </summary>
    Task<Result<int>> VoteHelpfulAsync(
        Guid reviewId,
        CancellationToken ct = default);
}
