using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Yêu cầu Đổi trả hàng từ khách hàng theo docs/order-states.md.
/// </summary>
public class ReturnRequest : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }

    /// <summary>
    /// Trạng thái yêu cầu: Pending (Chờ duyệt), Approved (Đã duyệt), Rejected (Từ chối), Completed (Hoàn tất), Cancelled.
    /// </summary>
    public ReturnRequestStatus Status { get; set; } = ReturnRequestStatus.Pending;

    /// <summary>
    /// Lý do đổi trả do khách cung cấp (Lỗi nhà sản xuất, Giao sai hàng, Bể vỡ, Đổi ý...).
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Ghi chú chi tiết từ khách hàng.
    /// </summary>
    public string? CustomerNote { get; set; }

    /// <summary>
    /// Số tiền cần hoàn cho khách.
    /// </summary>
    public decimal RefundAmount { get; set; }

    /// <summary>
    /// Trạng thái hoàn tiền: Pending, Refunded, Failed, NotApplicable.
    /// </summary>
    public RefundStatus RefundStatus { get; set; } = RefundStatus.Pending;

    /// <summary>
    /// Mã giao dịch hoàn tiền (từ cổng thanh toán hoặc mã đối soát ngân hàng).
    /// </summary>
    public string? RefundTransactionNo { get; set; }

    /// <summary>
    /// Thời điểm hoàn tiền thành công.
    /// </summary>
    public DateTime? RefundedAt { get; set; }

    /// <summary>
    /// Hướng dẫn gửi hàng hoặc ghi chú của nhân viên Sales khi duyệt yêu cầu.
    /// </summary>
    public string? SalesNote { get; set; }

    /// <summary>
    /// Lý do từ chối nếu Sales không chấp nhận đổi trả.
    /// </summary>
    public string? RejectionReason { get; set; }

    /// <summary>
    /// Nhân viên Sales / Admin phụ trách xử lý yêu cầu.
    /// </summary>
    public Guid? ProcessedByUserId { get; set; }
    public string? ProcessedByName { get; set; }
    public DateTime? ProcessedAt { get; set; }

    /// <summary>
    /// Đánh dấu hàng trả về đã được kiểm tra và nhập lại kho hay chưa.
    /// </summary>
    public bool IsRestocked { get; set; } = false;
    public DateTime? RestockedAt { get; set; }

    /// <summary>
    /// Khóa Idempotency tránh hoàn tiền 2 lần cho cùng một yêu cầu đổi trả.
    /// </summary>
    public string? IdempotencyKey { get; set; }

    /// <summary>
    /// Danh sách các sản phẩm và số lượng yêu cầu đổi trả.
    /// </summary>
    public ICollection<ReturnRequestItem> Items { get; set; } = new List<ReturnRequestItem>();
}
