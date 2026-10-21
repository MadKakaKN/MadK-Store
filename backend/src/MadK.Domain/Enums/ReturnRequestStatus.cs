namespace MadK.Domain.Enums;

/// <summary>
/// Trạng thái của Yêu cầu Đổi trả (Return Request).
/// </summary>
public enum ReturnRequestStatus
{
    /// <summary>
    /// Khách hàng vừa gửi yêu cầu đổi trả, chờ Sales duyệt.
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Sales đã duyệt yêu cầu, chờ khách gửi hàng và kho nhận lại.
    /// </summary>
    Approved = 2,

    /// <summary>
    /// Sales từ chối yêu cầu đổi trả (kèm lý do).
    /// </summary>
    Rejected = 3,

    /// <summary>
    /// Đã nhận lại hàng, nhập kho và hoàn tiền thành công.
    /// </summary>
    Completed = 4,

    /// <summary>
    /// Khách hàng tự hủy yêu cầu đổi trả.
    /// </summary>
    Cancelled = 5
}
