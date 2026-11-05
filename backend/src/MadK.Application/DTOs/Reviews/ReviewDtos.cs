using System.ComponentModel.DataAnnotations;
using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Reviews;

public record ProductReviewDto(
    Guid Id,
    Guid ProductId,
    Guid UserId,
    string UserName,
    string? UserAvatar,
    Guid? OrderId,
    int Rating,
    string? Title,
    string Comment,
    IReadOnlyList<string> Images,
    bool IsVerifiedPurchase,
    ReviewStatus Status,
    string? AdminReply,
    DateTime? AdminRepliedAt,
    int HelpfulCount,
    DateTime CreatedAt
);

public record ProductReviewSummaryDto(
    double AverageRating,
    int TotalReviews,
    IReadOnlyDictionary<int, int> RatingDistribution,
    IReadOnlyDictionary<int, double> RatingPercentages
);

public record ProductReviewsPagedResultDto(
    ProductReviewSummaryDto Summary,
    IReadOnlyList<ProductReviewDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public class CreateProductReviewDto
{
    [Required(ErrorMessage = "Số sao đánh giá là bắt buộc")]
    [Range(1, 5, ErrorMessage = "Số sao phải từ 1 đến 5")]
    public int Rating { get; set; }

    [MaxLength(150, ErrorMessage = "Tiêu đề không được vượt quá 150 ký tự")]
    public string? Title { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập nội dung đánh giá")]
    [MinLength(5, ErrorMessage = "Nội dung đánh giá tối thiểu 5 ký tự")]
    [MaxLength(2000, ErrorMessage = "Nội dung đánh giá tối đa 2000 ký tự")]
    public string Comment { get; set; } = string.Empty;

    public List<string>? Images { get; set; }

    public Guid? OrderId { get; set; }
}

public record AdminReviewDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string? ProductThumbnail,
    Guid UserId,
    string UserName,
    string? UserEmail,
    Guid? OrderId,
    string? OrderNumber,
    int Rating,
    string? Title,
    string Comment,
    IReadOnlyList<string> Images,
    bool IsVerifiedPurchase,
    ReviewStatus Status,
    string? AdminReply,
    DateTime? AdminRepliedAt,
    int HelpfulCount,
    DateTime CreatedAt
);

public class AdminReviewStatusUpdateDto
{
    [Required(ErrorMessage = "Trạng thái đánh giá là bắt buộc")]
    public ReviewStatus Status { get; set; }

    [MaxLength(2000, ErrorMessage = "Phản hồi tối đa 2000 ký tự")]
    public string? AdminReply { get; set; }
}

public record CanReviewProductResultDto(
    bool CanReview,
    bool HasPurchased,
    bool AlreadyReviewed,
    string? Reason,
    Guid? EligibleOrderId
);
