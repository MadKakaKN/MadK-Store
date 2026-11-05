using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Reviews;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using MadK.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/reviews")]
[Authorize(Policy = Permissions.CatalogManage)]
public class AdminReviewsController : ControllerBase
{
    private readonly IProductReviewService _reviewService;
    private readonly IAuditLogService _auditLogService;

    public AdminReviewsController(
        IProductReviewService reviewService,
        IAuditLogService auditLogService)
    {
        _reviewService = reviewService;
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// Lấy danh sách đánh giá sản phẩm để kiểm duyệt (lọc theo trạng thái, tìm kiếm, sản phẩm).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(Result<PagedResult<AdminReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ReviewStatus? status = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _reviewService.AdminGetReviewsAsync(page, pageSize, status, productId, search, ct);
        return Ok(result);
    }

    /// <summary>
    /// Duyệt, ẩn hoặc trả lời đánh giá của khách hàng.
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(Result<AdminReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AdminReviewDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] AdminReviewStatusUpdateDto dto,
        CancellationToken ct = default)
    {
        var result = await _reviewService.AdminUpdateReviewStatusAsync(id, dto, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        var staffIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        Guid.TryParse(staffIdStr, out var staffId);
        var staffEmail = User.FindFirstValue(ClaimTypes.Email) ?? "Admin";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";

        await _auditLogService.LogAsync(
            action: "REVIEW_MODERATED",
            entityName: "ProductReview",
            entityId: id.ToString(),
            oldValues: null,
            newValues: new { Status = dto.Status.ToString(), AdminReply = dto.AdminReply },
            userId: staffId,
            userEmail: staffEmail,
            userRole: role,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: HttpContext.Request.Headers["User-Agent"].ToString(),
            ct: ct
        );

        return Ok(result);
    }

    /// <summary>
    /// Xóa mềm đánh giá sản phẩm.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteReview(Guid id, CancellationToken ct = default)
    {
        var result = await _reviewService.AdminDeleteReviewAsync(id, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        var staffIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        Guid.TryParse(staffIdStr, out var staffId);
        var staffEmail = User.FindFirstValue(ClaimTypes.Email) ?? "Admin";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";

        await _auditLogService.LogAsync(
            action: "REVIEW_DELETED",
            entityName: "ProductReview",
            entityId: id.ToString(),
            oldValues: null,
            newValues: new { IsDeleted = true },
            userId: staffId,
            userEmail: staffEmail,
            userRole: role,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: HttpContext.Request.Headers["User-Agent"].ToString(),
            ct: ct
        );

        return Ok(result);
    }
}
