using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Domain.Enums;

namespace MadK.Application.Interfaces;

public interface IOrderService
{
    /// <summary>
    /// Thực hiện checkout và tạo đơn hàng COD.
    /// - Server tự tính toán toàn bộ giá và tổng tiền từ DB.
    /// - Tạo Order và OrderItem chứa snapshot đầy đủ (tên, SKU, giá, thuộc tính, ảnh).
    /// - Thực hiện trong một transaction cùng với việc giữ tồn kho nguyên tử qua InventoryService.
    /// - Hỗ trợ Idempotency key để tránh click đúp sinh nhiều đơn.
    /// - Sinh mã đơn hàng dễ đọc, duy nhất.
    /// </summary>
    Task<Result<OrderDto>> CheckoutCodAsync(
        Guid? userId,
        string? anonymousId,
        CheckoutCodRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Tra cứu chi tiết đơn hàng theo mã đơn (e.g. MK-20261013-XXXXXX).
    /// Chống IDOR: Khách hàng chỉ xem được đơn của mình.
    /// </summary>
    Task<Result<OrderDto>> GetOrderByNumberAsync(
        string orderNumber,
        Guid? userId,
        bool isStaffOrAdmin = false,
        CancellationToken ct = default);

    /// <summary>
    /// Tra cứu chi tiết đơn hàng theo ID.
    /// Chống IDOR: Khách hàng chỉ xem được đơn của mình.
    /// </summary>
    Task<Result<OrderDto>> GetOrderByIdAsync(
        Guid orderId,
        Guid? userId,
        bool isStaffOrAdmin = false,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách lịch sử đơn hàng của người dùng đã đăng nhập kèm bộ lọc trạng thái.
    /// </summary>
    Task<Result<IReadOnlyList<OrderDto>>> GetMyOrdersAsync(
        Guid userId,
        OrderStatus? filterStatus = null,
        CancellationToken ct = default);

    /// <summary>
    /// Khách hàng hoặc Nhân viên hủy đơn hàng khi còn ở trạng thái cho phép.
    /// - Khách hàng chỉ được hủy khi ở Pending, Confirmed hoặc PendingPayment.
    /// - Giải phóng tồn kho đang giữ hoặc nhập lại kho tùy theo trạng thái lúc hủy.
    /// - Ghi nhận OrderStatusHistory.
    /// </summary>
    Task<Result<OrderDto>> CancelOrderAsync(
        string orderNumber,
        Guid? userId,
        CancelOrderRequestDto request,
        bool isStaffOrAdmin = false,
        CancellationToken ct = default);

    /// <summary>
    /// Chuyển trạng thái đơn hàng tuân thủ state machine theo docs/order-states.md.
    /// - Kiểm tra tính hợp lệ của bước chuyển trạng thái (chuyển sai sẽ bị từ chối).
    /// - Tác động tồn kho tương ứng (Commit khi Shipping, Restock khi Returned/Shipping Cancelled, v.v.).
    /// - Ghi nhận lịch sử OrderStatusHistory (ai, khi nào, lý do/ghi chú).
    /// </summary>
    Task<Result<OrderDto>> UpdateOrderStatusAsync(
        string orderNumber,
        Guid? staffUserId,
        string staffName,
        UpdateOrderStatusRequestDto request,
        CancellationToken ct = default);
}
