using MadK.Application.Common;
using MadK.Application.DTOs.Order;

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
    /// </summary>
    Task<Result<OrderDto>> GetOrderByNumberAsync(
        string orderNumber,
        Guid? userId,
        CancellationToken ct = default);

    /// <summary>
    /// Tra cứu chi tiết đơn hàng theo ID.
    /// </summary>
    Task<Result<OrderDto>> GetOrderByIdAsync(
        Guid orderId,
        Guid? userId,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách lịch sử đơn hàng của người dùng đã đăng nhập.
    /// </summary>
    Task<Result<IReadOnlyList<OrderDto>>> GetMyOrdersAsync(
        Guid userId,
        CancellationToken ct = default);
}
