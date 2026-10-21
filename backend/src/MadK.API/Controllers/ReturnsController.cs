using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Returns;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class ReturnsController : ControllerBase
{
    private readonly IReturnService _returnService;
    private readonly ILogger<ReturnsController> _logger;

    public ReturnsController(IReturnService returnService, ILogger<ReturnsController> logger)
    {
        _returnService = returnService;
        _logger = logger;
    }

    /// <summary>
    /// Khách hàng tạo yêu cầu đổi trả cho một đơn hàng đã hoàn tất (Completed).
    /// </summary>
    [HttpPost("orders/{orderNumber}/returns")]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateReturnRequest(
        [FromRoute] string orderNumber,
        [FromBody] CreateReturnRequestDto request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _returnService.CreateReturnRequestAsync(orderNumber, userId, request, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách yêu cầu đổi trả của một đơn hàng cụ thể.
    /// </summary>
    [HttpGet("orders/{orderNumber}/returns")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<ReturnRequestDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReturnRequestsByOrder(
        [FromRoute] string orderNumber,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        bool isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Sales") || User.IsInRole("Warehouse");

        var result = await _returnService.GetReturnRequestsByOrderAsync(orderNumber, userId, isStaffOrAdmin, ct);
        return Ok(result);
    }

    /// <summary>
    /// Tra cứu chi tiết một yêu cầu đổi trả theo ID (Chống IDOR).
    /// </summary>
    [HttpGet("returns/{id:guid}")]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ReturnRequestDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReturnRequestById(
        [FromRoute] Guid id,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        bool isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Sales") || User.IsInRole("Warehouse");

        var result = await _returnService.GetReturnRequestByIdAsync(id, userId, isStaffOrAdmin, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var userId) ? userId : null;
    }
}
