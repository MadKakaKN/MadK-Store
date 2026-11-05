namespace MadK.Domain.Enums;

/// <summary>
/// Trạng thái kiểm duyệt đánh giá sản phẩm.
/// </summary>
public enum ReviewStatus
{
    /// <summary>
    /// Chờ duyệt (nếu hệ thống bật chế độ kiểm duyệt trước).
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Đã duyệt hiển thị công khai trên trang sản phẩm.
    /// </summary>
    Approved = 1,

    /// <summary>
    /// Bị từ chối / ẩn do vi phạm tiêu chuẩn cộng đồng, ngôn từ thô tục hoặc spam.
    /// </summary>
    Rejected = 2
}
