using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Admin;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;

    public AdminUsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    /// <summary>
    /// Lấy danh sách người dùng hệ thống có phân trang, tìm kiếm và lọc theo vai trò (Quyền: user.view / Admin).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = Permissions.UserView)]
    [ProducesResponseType(typeof(Result<PagedResult<AdminUserListItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterParams filter, CancellationToken ct)
    {
        var result = await _adminUserService.GetUsersAsync(filter, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết thông tin người dùng kèm vai trò và quyền hạn (Quyền: user.view / Admin).
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = Permissions.UserView)]
    [ProducesResponseType(typeof(Result<AdminUserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AdminUserDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(Guid id, CancellationToken ct)
    {
        var result = await _adminUserService.GetUserByIdAsync(id, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Phân quyền và gán vai trò (Roles) cho người dùng. Tự động ghi nhận AuditLog (Quyền: user.manage / Admin).
    /// </summary>
    [HttpPut("{id:guid}/roles")]
    [Authorize(Policy = Permissions.UserManage)]
    [ProducesResponseType(typeof(Result<AdminUserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AdminUserDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUserRoles(
        Guid id,
        [FromBody] UpdateUserRolesRequestDto request,
        CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        var adminEmail = GetCurrentUserEmail();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        var result = await _adminUserService.UpdateUserRolesAsync(
            id, request, adminId, adminEmail, ipAddress, userAgent, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Khóa / Mở khóa hoặc vô hiệu hóa tài khoản người dùng. Tự động ghi nhận AuditLog (Quyền: user.manage / Admin).
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Policy = Permissions.UserManage)]
    [ProducesResponseType(typeof(Result<AdminUserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AdminUserDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUserStatus(
        Guid id,
        [FromBody] UpdateUserStatusRequestDto request,
        CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        var adminEmail = GetCurrentUserEmail();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        var result = await _adminUserService.UpdateUserStatusAsync(
            id, request, adminId, adminEmail, ipAddress, userAgent, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách toàn bộ vai trò và quyền hạn trong hệ thống để phục vụ giao diện gán quyền (Quyền: user.view / Admin).
    /// </summary>
    [HttpGet("roles-permissions")]
    [Authorize(Policy = Permissions.UserView)]
    [ProducesResponseType(typeof(Result<SystemRolesAndPermissionsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRolesAndPermissions(CancellationToken ct)
    {
        var result = await _adminUserService.GetRolesAndPermissionsAsync(ct);
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
