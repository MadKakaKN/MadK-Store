namespace MadK.Domain.Enums;

/// <summary>
/// Trạng thái của giao dịch hoàn tiền cho yêu cầu đổi trả / hủy đơn.
/// </summary>
public enum RefundStatus
{
    /// <summary>
    /// Đang chờ xử lý hoàn tiền.
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Đã hoàn tiền thành công (qua cổng thanh toán hoặc chuyển khoản thủ công).
    /// </summary>
    Refunded = 2,

    /// <summary>
    /// Xử lý hoàn tiền thất bại.
    /// </summary>
    Failed = 3,

    /// <summary>
    /// Không áp dụng hoàn tiền (ví dụ yêu cầu bị từ chối hoặc đổi hàng 1-1).
    /// </summary>
    NotApplicable = 4
}
