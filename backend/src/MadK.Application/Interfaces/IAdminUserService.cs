using MadK.Application.Common;
using MadK.Application.DTOs.Admin;

namespace MadK.Application.Interfaces;

public interface IAdminUserService
{
    Task<Result<PagedResult<AdminUserListItemDto>>> GetUsersAsync(UserFilterParams filter, CancellationToken ct = default);
    Task<Result<AdminUserDetailDto>> GetUserByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<AdminUserDetailDto>> UpdateUserRolesAsync(
        Guid id,
        UpdateUserRolesRequestDto request,
        Guid adminUserId,
        string adminEmail,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default);
    Task<Result<AdminUserDetailDto>> UpdateUserStatusAsync(
        Guid id,
        UpdateUserStatusRequestDto request,
        Guid adminUserId,
        string adminEmail,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default);
    Task<Result<SystemRolesAndPermissionsDto>> GetRolesAndPermissionsAsync(CancellationToken ct = default);
}
