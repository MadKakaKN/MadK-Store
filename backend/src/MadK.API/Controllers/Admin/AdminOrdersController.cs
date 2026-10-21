using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using MadK.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IAuditLogService _auditLogService;

    public AdminOrdersController(IOrderService orderService, IAuditLogService auditLogService)
    {
        _orderService = orderService;
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ đơn hàng trong hệ thống (Quyền: order.view / Warehouse, Sales, Admin).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = Permissions.OrderView)]
    [ProducesResponseType(typeof(Result<PagedResult<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _orderService.GetAllOrdersAsync(page, pageSize, status, fromDate, toDate, search, ct);
        return Ok(result);
    }

    /// <summary>
    /// Tra cứu thông tin chi tiết đơn hàng (Quyền: order.view / Warehouse, Sales, Admin).
    /// </summary>
    [HttpGet("{orderNumber}")]
    [Authorize(Policy = Permissions.OrderView)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderDetail(string orderNumber, CancellationToken ct)
    {
        var result = await _orderService.GetOrderByNumberAsync(orderNumber, null, isStaffOrAdmin: true, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật ghi chú nội bộ cho đơn hàng và ghi nhận AuditLog (Quyền: order.manage / Sales, Admin).
    /// </summary>
    [HttpPut("{orderNumber}/note")]
    [Authorize(Policy = Permissions.OrderManage)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrderNote(
        string orderNumber,
        [FromBody] UpdateOrderNoteRequestDto request,
        CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var staffName = User.FindFirstValue(ClaimTypes.Name) ?? staffEmail;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Staff";

        var currentOrderRes = await _orderService.GetOrderByNumberAsync(orderNumber, null, isStaffOrAdmin: true, ct);
        if (!currentOrderRes.IsSuccess)
        {
            return NotFound(currentOrderRes);
        }
        var oldNote = currentOrderRes.Data?.AdminNote;

        var result = await _orderService.UpdateOrderNoteAsync(orderNumber, request.AdminNote, staffId, staffName, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        await _auditLogService.LogAsync(
            action: "ORDER_NOTE_UPDATED",
            entityName: "Order",
            entityId: orderNumber,
            oldValues: new { AdminNote = oldNote },
            newValues: new { AdminNote = request.AdminNote },
            userId: staffId,
            userEmail: staffEmail,
            userRole: role,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: HttpContext.Request.Headers["User-Agent"].ToString(),
            note: $"Cập nhật ghi chú nội bộ đơn {orderNumber}",
            ct: ct);

        return Ok(result);
    }


    /// <summary>
    /// Cập nhật trạng thái đơn hàng theo state machine và ghi nhận AuditLog (Quyền: order.manage / Sales, Admin).
    /// </summary>
    [HttpPut("{orderNumber}/status")]
    [Authorize(Policy = Permissions.OrderManage)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateOrderStatus(
        string orderNumber,
        [FromBody] UpdateOrderStatusRequestDto request,
        CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var staffName = User.FindFirstValue(ClaimTypes.Name) ?? staffEmail;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Staff";

        // Lấy thông tin đơn trước khi đổi để ghi AuditLog
        var currentOrderRes = await _orderService.GetOrderByNumberAsync(orderNumber, null, isStaffOrAdmin: true, ct);
        var oldStatus = currentOrderRes.Data?.Status.ToString();

        var result = await _orderService.UpdateOrderStatusAsync(orderNumber, staffId, staffName, request, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        // Ghi AuditLog thao tác quan trọng
        await _auditLogService.LogAsync(
            action: "ORDER_STATUS_CHANGED",
            entityName: "Order",
            entityId: orderNumber,
            oldValues: new { Status = oldStatus },
            newValues: new { Status = request.NewStatus.ToString(), Reason = request.Reason, Note = request.Note },
            userId: staffId,
            userEmail: staffEmail,
            userRole: role,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: HttpContext.Request.Headers["User-Agent"].ToString(),
            note: $"Chuyển trạng thái đơn {orderNumber} sang {request.NewStatus}",
            ct: ct);

        return Ok(result);
    }

    /// <summary>
    /// Nhân viên hủy đơn hàng và hoàn kho (Quyền: order.manage / Sales, Admin).
    /// </summary>
    [HttpPost("{orderNumber}/cancel")]
    [Authorize(Policy = Permissions.OrderManage)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelOrder(
        string orderNumber,
        [FromBody] CancelOrderRequestDto request,
        CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Staff";

        var currentOrderRes = await _orderService.GetOrderByNumberAsync(orderNumber, null, isStaffOrAdmin: true, ct);
        var oldStatus = currentOrderRes.Data?.Status.ToString();

        var result = await _orderService.CancelOrderAsync(orderNumber, staffId, request, isStaffOrAdmin: true, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        await _auditLogService.LogAsync(
            action: "ORDER_CANCELLED_BY_STAFF",
            entityName: "Order",
            entityId: orderNumber,
            oldValues: new { Status = oldStatus },
            newValues: new { Status = OrderStatus.Cancelled.ToString(), Reason = request.Reason },
            userId: staffId,
            userEmail: staffEmail,
            userRole: role,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: HttpContext.Request.Headers["User-Agent"].ToString(),
            note: $"Nhân viên hủy đơn {orderNumber}: {request.Reason}",
            ct: ct);

        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var userId) ? userId : Guid.Empty;
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "unknown";
    }
}
