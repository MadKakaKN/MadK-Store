using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Returns;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using MadK.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/returns")]
public class AdminReturnsController : ControllerBase
{
    private readonly IReturnService _returnService;
    private readonly ILogger<AdminReturnsController> _logger;

    public AdminReturnsController(IReturnService returnService, ILogger<AdminReturnsController> logger)
    {
        _returnService = returnService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ yêu cầu đổi trả (Quyền: order.view / Sales, Admin).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = Permissions.OrderView)]
    [ProducesResponseType(typeof(Result<PagedResult<ReturnRequestDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllReturnRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ReturnRequestStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var filter = new ReturnFilterDto(page, pageSize, status, search);
        var result = await _returnService.GetAllReturnRequestsAsync(filter, ct);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết yêu cầu đổi trả (Quyền: order.view / Sales, Admin).
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = Permissions.OrderView)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReturnRequestById(
        [FromRoute] Guid id,
        CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var result = await _returnService.GetReturnRequestByIdAsync(id, staffId, isStaffOrAdmin: true, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Nhân viên Sales / Admin duyệt yêu cầu đổi trả (Quyền: order.manage / Sales, Admin).
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = Permissions.OrderManage)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveReturnRequest(
        [FromRoute] Guid id,
        [FromBody] ApproveReturnRequestDto request,
        CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var staffName = User.FindFirstValue(ClaimTypes.Name) ?? staffEmail;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Sales";

        var result = await _returnService.ApproveReturnRequestAsync(id, staffId, staffName, staffEmail, role, request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Nhân viên Sales / Admin từ chối yêu cầu đổi trả kèm lý do (Quyền: order.manage / Sales, Admin).
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = Permissions.OrderManage)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectReturnRequest(
        [FromRoute] Guid id,
        [FromBody] RejectReturnRequestDto request,
        CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var staffName = User.FindFirstValue(ClaimTypes.Name) ?? staffEmail;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Sales";

        var result = await _returnService.RejectReturnRequestAsync(id, staffId, staffName, staffEmail, role, request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Hoàn tất đổi trả: Nhập lại kho hàng đã nhận và thực hiện hoàn tiền (Quyền: order.refund / Sales, Admin).
    /// Kiểm tra: Không hoàn quá số đã thanh toán, không hoàn 2 lần (Idempotent).
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [Authorize(Policy = Permissions.OrderRefund)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteReturnAndRefund(
        [FromRoute] Guid id,
        [FromBody] ProcessReturnRefundDto request,
        CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var staffName = User.FindFirstValue(ClaimTypes.Name) ?? staffEmail;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Sales";

        var result = await _returnService.CompleteReturnAndRefundAsync(id, staffId, staffName, staffEmail, role, request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var userId) ? userId : Guid.Empty;
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "staff@madkstore.local";
    }
}
