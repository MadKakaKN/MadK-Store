using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Audit;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAppDbContext _dbContext;
    private readonly ILogger<AuditLogService> _logger;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        WriteIndented = false
    };

    public AuditLogService(IAppDbContext dbContext, ILogger<AuditLogService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task LogAsync(
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
        CancellationToken ct = default)
    {
        try
        {
            var oldJson = oldValues switch
            {
                null => null,
                string s => s,
                _ => JsonSerializer.Serialize(oldValues, JsonOpts)
            };

            var newJson = newValues switch
            {
                null => null,
                string s => s,
                _ => JsonSerializer.Serialize(newValues, JsonOpts)
            };

            var log = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                UserEmail = userEmail,
                UserRole = userRole,
                Action = action.Trim().ToUpperInvariant(),
                EntityName = entityName.Trim(),
                EntityId = entityId?.Trim(),
                OldValues = oldJson,
                NewValues = newJson,
                IpAddress = ipAddress?.Trim(),
                UserAgent = userAgent?.Trim(),
                Note = note?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.AuditLogs.Add(log);
            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "[AUDIT LOG] {Action} on {EntityName}:{EntityId} by {UserEmail} ({Role})",
                log.Action, log.EntityName, log.EntityId, log.UserEmail ?? "System", log.UserRole ?? "None");
        }
        catch (Exception ex)
        {
            // Logging audit failures should not crash the main business transaction, but should log error
            _logger.LogError(ex, "Failed to write audit log for action {Action} on {EntityName}", action, entityName);
        }
    }

    public async Task<Result<PagedResult<AuditLogDto>>> GetAuditLogsAsync(AuditLogQueryFilter filter, CancellationToken ct = default)
    {
        var query = _dbContext.AuditLogs.AsNoTracking().AsQueryable();

        if (filter.UserId.HasValue)
        {
            query = query.Where(a => a.UserId == filter.UserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Action))
        {
            var actionNorm = filter.Action.Trim().ToUpperInvariant();
            query = query.Where(a => a.Action.Contains(actionNorm));
        }

        if (!string.IsNullOrWhiteSpace(filter.EntityName))
        {
            var entityNorm = filter.EntityName.Trim().ToLower();
            query = query.Where(a => a.EntityName.ToLower().Contains(entityNorm));
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= filter.ToDate.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.UserId,
                a.UserEmail,
                a.UserRole,
                a.Action,
                a.EntityName,
                a.EntityId,
                a.OldValues,
                a.NewValues,
                a.IpAddress,
                a.UserAgent,
                a.Note,
                a.CreatedAt
            ))
            .ToListAsync(ct);

        var paged = new PagedResult<AuditLogDto>(items, totalCount, page, pageSize);
        return Result<PagedResult<AuditLogDto>>.Success(paged);
    }
}
