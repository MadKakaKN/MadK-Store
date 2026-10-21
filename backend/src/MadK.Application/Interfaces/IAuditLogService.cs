using MadK.Application.Common;
using MadK.Application.DTOs.Audit;

namespace MadK.Application.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(
        string action,
        string entityName,
        string? entityId,
        object? oldValues,
        object? newValues,
        Guid? userId,
        string? userEmail,
        string? userRole,
        string? ipAddress = null,
        string? userAgent = null,
        string? note = null,
        CancellationToken ct = default);

    Task<Result<PagedResult<AuditLogDto>>> GetAuditLogsAsync(AuditLogQueryFilter filter, CancellationToken ct = default);
}
