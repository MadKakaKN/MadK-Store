namespace MadK.Application.DTOs.Admin;

public record AdminUserListItemDto(
    Guid Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    string? AvatarUrl,
    bool IsActive,
    bool EmailConfirmed,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt
);

public record AdminUserDetailDto(
    Guid Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    string? AvatarUrl,
    bool IsActive,
    bool EmailConfirmed,
    int FailedLoginAttempts,
    DateTime? LockoutEnd,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record UpdateUserRolesRequestDto(
    IReadOnlyList<string> Roles
);

public record UpdateUserStatusRequestDto(
    bool IsActive,
    bool Unlock = false,
    int? LockoutMinutes = null,
    string? Reason = null
);

public class UserFilterParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

public record RolePermissionInfoDto(
    Guid Id,
    string Name,
    string? Description,
    IReadOnlyList<string> Permissions
);

public record PermissionInfoDto(
    Guid Id,
    string Code,
    string Module,
    string? Description
);

public record SystemRolesAndPermissionsDto(
    IReadOnlyList<RolePermissionInfoDto> Roles,
    IReadOnlyList<PermissionInfoDto> Permissions
);
