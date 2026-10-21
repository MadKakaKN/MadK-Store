using MadK.Application.Common;
using MadK.Application.DTOs.Audit;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/audit-logs")]
public class AdminAuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AdminAuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// Lấy danh sách nhật ký kiểm toán (Audit Logs) có phân trang và bộ lọc thời gian/hành động (Quyền: audit.view / Admin).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = Permissions.AuditView)]
    [ProducesResponseType(typeof(Result<PagedResult<AuditLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQueryFilter filter, CancellationToken ct)
    {
        var result = await _auditLogService.GetAuditLogsAsync(filter, ct);
        return Ok(result);
    }
}
