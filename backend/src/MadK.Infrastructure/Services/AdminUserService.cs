using MadK.Application.Common;
using MadK.Application.DTOs.Admin;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IAppDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(
        IAppDbContext dbContext,
        IAuditLogService auditLogService,
        ILogger<AdminUserService> logger)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<Result<PagedResult<AdminUserListItemDto>>> GetUsersAsync(UserFilterParams filter, CancellationToken ct = default)
    {
        var query = _dbContext.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(search) ||
                u.FullName.ToLower().Contains(search) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
            var roleNorm = filter.Role.Trim().ToLower();
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == roleNorm));
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == filter.IsActive.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserListItemDto(
                u.Id,
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.AvatarUrl,
                u.IsActive,
                u.EmailConfirmed,
                u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                u.CreatedAt
            ))
            .ToListAsync(ct);

        var paged = new PagedResult<AdminUserListItemDto>(items, totalCount, page, pageSize);
        return Result<PagedResult<AdminUserListItemDto>>.Success(paged);
    }

    public async Task<Result<AdminUserDetailDto>> GetUserByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null)
        {
            return Result<AdminUserDetailDto>.Failure("Không tìm thấy người dùng.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .OrderBy(p => p)
            .ToList();

        var dto = new AdminUserDetailDto(
            user.Id,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.AvatarUrl,
            user.IsActive,
            user.EmailConfirmed,
            user.FailedLoginAttempts,
            user.LockoutEnd,
            roles,
            permissions,
            user.CreatedAt,
            user.UpdatedAt
        );

        return Result<AdminUserDetailDto>.Success(dto);
    }

    public async Task<Result<AdminUserDetailDto>> UpdateUserRolesAsync(
        Guid id,
        UpdateUserRolesRequestDto request,
        Guid adminUserId,
        string adminEmail,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null)
        {
            return Result<AdminUserDetailDto>.Failure("Không tìm thấy người dùng để phân quyền.");
        }

        // An toàn hệ thống: Quản trị viên không thể tự tước quyền Admin của chính mình
        if (id == adminUserId && !request.Roles.Contains(Roles.Admin, StringComparer.OrdinalIgnoreCase))
        {
            return Result<AdminUserDetailDto>.Failure("Không thể tự gỡ vai trò Quản trị viên (Admin) của chính tài khoản đang đăng nhập.");
        }

        var oldRoles = user.UserRoles.Select(ur => ur.Role.Name).OrderBy(r => r).ToList();

        // Kiểm tra tính hợp lệ của các role được chỉ định
        var requestedRoleNames = request.Roles.Select(r => r.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var matchedRoles = await _dbContext.Roles
            .Where(r => requestedRoleNames.Contains(r.Name))
            .ToListAsync(ct);

        if (matchedRoles.Count != requestedRoleNames.Count)
        {
            var matchedNames = matchedRoles.Select(r => r.Name).ToList();
            var invalidNames = requestedRoleNames.Where(r => !matchedNames.Contains(r, StringComparer.OrdinalIgnoreCase));
            return Result<AdminUserDetailDto>.Failure($"Một hoặc nhiều vai trò không tồn tại: {string.Join(", ", invalidNames)}");
        }

        // Xóa roles cũ và gán roles mới
        user.UserRoles.Clear();
        foreach (var r in matchedRoles)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = r.Id,
                User = user,
                Role = r
            });
        }

        user.UpdatedAt = DateTime.UtcNow;

        // Thu hồi toàn bộ refresh token cũ của user để bắt buộc cấp lại claim mới khi đăng nhập lại
        var refreshTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var rt in refreshTokens)
        {
            rt.RevokedAt = DateTime.UtcNow;
            rt.ReplacedByToken = "REVOKED_DUE_TO_ROLE_CHANGE";
        }

        await _dbContext.SaveChangesAsync(ct);

        var newRoles = matchedRoles.Select(r => r.Name).OrderBy(r => r).ToList();

        // Ghi AuditLog thao tác quan trọng
        await _auditLogService.LogAsync(
            action: "USER_ROLE_ASSIGNED",
            entityName: "User",
            entityId: user.Id.ToString(),
            oldValues: new { Roles = oldRoles },
            newValues: new { Roles = newRoles },
            userId: adminUserId,
            userEmail: adminEmail,
            userRole: Roles.Admin,
            ipAddress: ipAddress,
            userAgent: userAgent,
            note: $"Gán lại vai trò cho người dùng '{user.Email}'",
            ct: ct);

        return await GetUserByIdAsync(id, ct);
    }

    public async Task<Result<AdminUserDetailDto>> UpdateUserStatusAsync(
        Guid id,
        UpdateUserStatusRequestDto request,
        Guid adminUserId,
        string adminEmail,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null)
        {
            return Result<AdminUserDetailDto>.Failure("Không tìm thấy người dùng.");
        }

        // Không thể tự vô hiệu hóa tài khoản của chính mình
        if (id == adminUserId && !request.IsActive)
        {
            return Result<AdminUserDetailDto>.Failure("Không thể tự vô hiệu hóa tài khoản đang thao tác.");
        }

        var oldState = new
        {
            user.IsActive,
            user.FailedLoginAttempts,
            user.LockoutEnd
        };

        user.IsActive = request.IsActive;

        if (request.Unlock)
        {
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
        }
        else if (request.LockoutMinutes.HasValue && request.LockoutMinutes.Value > 0)
        {
            user.LockoutEnd = DateTime.UtcNow.AddMinutes(request.LockoutMinutes.Value);
        }

        user.UpdatedAt = DateTime.UtcNow;

        // Nếu vô hiệu hóa hoặc khóa tài khoản, thu hồi toàn bộ token đăng nhập
        if (!user.IsActive || user.LockoutEnd.HasValue)
        {
            var refreshTokens = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                .ToListAsync(ct);

            foreach (var rt in refreshTokens)
            {
                rt.RevokedAt = DateTime.UtcNow;
                rt.ReplacedByToken = "REVOKED_DUE_TO_USER_LOCK";
            }
        }

        await _dbContext.SaveChangesAsync(ct);

        var newState = new
        {
            user.IsActive,
            user.FailedLoginAttempts,
            user.LockoutEnd
        };

        // Ghi AuditLog
        await _auditLogService.LogAsync(
            action: "USER_STATUS_UPDATED",
            entityName: "User",
            entityId: user.Id.ToString(),
            oldValues: oldState,
            newValues: newState,
            userId: adminUserId,
            userEmail: adminEmail,
            userRole: Roles.Admin,
            ipAddress: ipAddress,
            userAgent: userAgent,
            note: request.Reason ?? (request.IsActive ? "Kích hoạt tài khoản" : "Khóa/vô hiệu hóa tài khoản"),
            ct: ct);

        return await GetUserByIdAsync(id, ct);
    }

    public async Task<Result<SystemRolesAndPermissionsDto>> GetRolesAndPermissionsAsync(CancellationToken ct = default)
    {
        var roles = await _dbContext.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .OrderBy(r => r.Name)
            .Select(r => new RolePermissionInfoDto(
                r.Id,
                r.Name,
                r.Description,
                r.RolePermissions.Select(rp => rp.Permission.Code).OrderBy(c => c).ToList()
            ))
            .ToListAsync(ct);

        var permissions = await _dbContext.Permissions
            .AsNoTracking()
            .OrderBy(p => p.Module)
                .ThenBy(p => p.Code)
            .Select(p => new PermissionInfoDto(
                p.Id,
                p.Code,
                p.Module,
                p.Description
            ))
            .ToListAsync(ct);

        return Result<SystemRolesAndPermissionsDto>.Success(new SystemRolesAndPermissionsDto(roles, permissions));
    }
}
