using MadK.Application.Common;
using MadK.Application.DTOs.Returns;

namespace MadK.Application.Interfaces;

public interface IReturnService
{
    /// <summary>
    /// Khách hàng tạo yêu cầu đổi trả cho đơn hàng đã hoàn tất (Completed).
    /// </summary>
    Task<Result<ReturnRequestDto>> CreateReturnRequestAsync(
        string orderNumber,
        Guid? userId,
        CreateReturnRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy chi tiết yêu cầu đổi trả theo ID (Bảo vệ chống IDOR).
    /// </summary>
    Task<Result<ReturnRequestDto>> GetReturnRequestByIdAsync(
        Guid id,
        Guid? userId,
        bool isStaffOrAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách yêu cầu đổi trả của một đơn hàng cụ thể.
    /// </summary>
    Task<Result<IReadOnlyList<ReturnRequestDto>>> GetReturnRequestsByOrderAsync(
        string orderNumber,
        Guid? userId,
        bool isStaffOrAdmin,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách tất cả yêu cầu đổi trả phân trang (Dành cho Sales/Admin).
    /// </summary>
    Task<Result<PagedResult<ReturnRequestDto>>> GetAllReturnRequestsAsync(
        ReturnFilterDto filter,
        CancellationToken ct = default);

    /// <summary>
    /// Nhân viên Sales duyệt yêu cầu đổi trả.
    /// </summary>
    Task<Result<ReturnRequestDto>> ApproveReturnRequestAsync(
        Guid returnRequestId,
        Guid staffUserId,
        string staffName,
        string staffEmail,
        string staffRole,
        ApproveReturnRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Nhân viên Sales từ chối yêu cầu đổi trả kèm lý do bắt buộc.
    /// </summary>
    Task<Result<ReturnRequestDto>> RejectReturnRequestAsync(
        Guid returnRequestId,
        Guid staffUserId,
        string staffName,
        string staffEmail,
        string staffRole,
        RejectReturnRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Hoàn tất đổi trả: Nhập lại kho hàng đã nhận và thực hiện hoàn tiền (Sandbox/Manual).
    /// Ràng buộc: Không hoàn quá số đã thanh toán, không hoàn 2 lần cho cùng 1 yêu cầu (Idempotent).
    /// </summary>
    Task<Result<ReturnRequestDto>> CompleteReturnAndRefundAsync(
        Guid returnRequestId,
        Guid staffUserId,
        string staffName,
        string staffEmail,
        string staffRole,
        ProcessReturnRefundDto request,
        CancellationToken ct = default);
}
