namespace MadK.Application.DTOs.Audit;

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string? UserEmail,
    string? UserRole,
    string Action,
    string EntityName,
    string? EntityId,
    string? OldValues,
    string? NewValues,
    string? IpAddress,
    string? UserAgent,
    string? Note,
    DateTime CreatedAt
);

public class AuditLogQueryFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityName { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
