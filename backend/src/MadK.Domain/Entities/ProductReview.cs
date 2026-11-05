using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Đánh giá & Xếp hạng sao sản phẩm của khách hàng.
/// </summary>
public class ProductReview : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }

    /// <summary>
    /// Đánh giá từ 1 đến 5 sao.
    /// </summary>
    public int Rating { get; set; }

    /// <summary>
    /// Tiêu đề tóm tắt nhận xét (Ví dụ: "Hàng rất đẹp, giao nhanh").
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Nội dung đánh giá chi tiết.
    /// </summary>
    public string Comment { get; set; } = string.Empty;

    /// <summary>
    /// Mảng URL hình ảnh thực tế đính kèm (JSON format).
    /// </summary>
    public string ImagesJson { get; set; } = "[]";

    /// <summary>
    /// Đánh dấu Người mua hàng đã xác thực (đã mua sản phẩm qua đơn hàng Completed).
    /// </summary>
    public bool IsVerifiedPurchase { get; set; } = false;

    /// <summary>
    /// Trạng thái kiểm duyệt (Approved, Pending, Rejected).
    /// </summary>
    public ReviewStatus Status { get; set; } = ReviewStatus.Approved;

    /// <summary>
    /// Phản hồi chính thức từ Admin / Shop MadK.
    /// </summary>
    public string? AdminReply { get; set; }

    /// <summary>
    /// Thời gian Admin phản hồi.
    /// </summary>
    public DateTime? AdminRepliedAt { get; set; }

    /// <summary>
    /// Số lượng lượt vote hữu ích từ cộng đồng.
    /// </summary>
    public int HelpfulCount { get; set; } = 0;
}
