using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Inventory;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/inventory")]
public class AdminInventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IAuditLogService _auditLogService;
    private readonly IAppDbContext _dbContext;

    public AdminInventoryController(
        IInventoryService inventoryService,
        IAuditLogService auditLogService,
        IAppDbContext dbContext)
    {
        _inventoryService = inventoryService;
        _auditLogService = auditLogService;
        _dbContext = dbContext;
    }

    /// <summary>
    /// Xem thông tin tồn kho và lịch sử biến động (Quyền: inventory.view / Warehouse, Admin).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<InventoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventory([FromQuery] Guid? variantId, CancellationToken ct)
    {
        if (variantId.HasValue && variantId.Value != Guid.Empty)
        {
            var result = await _inventoryService.GetStockAsync(variantId.Value, ct);
            return Ok(result);
        }

        // Lấy danh sách tồn kho tổng quan các biến thể
        var items = await _dbContext.Inventories
            .AsNoTracking()
            .OrderByDescending(i => i.UpdatedAt ?? i.CreatedAt)
            .Take(50)
            .Select(i => new InventoryDto(
                i.Id,
                i.VariantId,
                i.OnHandQuantity,
                i.ReservedQuantity,
                i.OnHandQuantity - i.ReservedQuantity,
                i.UpdatedAt ?? i.CreatedAt))
            .ToListAsync(ct);

        return Ok(Result<IReadOnlyList<InventoryDto>>.Success(items));
    }

    /// <summary>
    /// Lấy lịch sử biến động kho của biến thể (Quyền: inventory.view / Warehouse, Admin).
    /// </summary>
    [HttpGet("{variantId:guid}/movements")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<StockMovementDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMovements(Guid variantId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var result = await _inventoryService.GetMovementsAsync(variantId, limit, ct);
        return Ok(result);
    }

    /// <summary>
    /// Nhập thêm hàng vào kho (Restock) và ghi nhận AuditLog (Quyền: inventory.manage / Warehouse, Admin).
    /// </summary>
    [HttpPost("restock")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<InventoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<InventoryDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Restock([FromBody] RestockRequestDto request, CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Staff";

        var beforeStock = await _inventoryService.GetStockAsync(request.VariantId, ct);
        var oldOnHand = beforeStock.Data?.OnHandQuantity ?? 0;

        var result = await _inventoryService.RestockAsync(request.VariantId, request.Quantity, request.Reason, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        // Ghi AuditLog
        await _auditLogService.LogAsync(
            action: "INVENTORY_RESTOCKED",
            entityName: "Inventory",
            entityId: request.VariantId.ToString(),
            oldValues: new { OnHandQuantity = oldOnHand },
            newValues: new { OnHandQuantity = result.Data!.OnHandQuantity, Added = request.Quantity, Reason = request.Reason },
            userId: staffId,
            userEmail: staffEmail,
            userRole: role,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: HttpContext.Request.Headers["User-Agent"].ToString(),
            note: $"Nhập {request.Quantity} sản phẩm cho variant {request.VariantId}. Lý do: {request.Reason}",
            ct: ct);

        return Ok(result);
    }

    /// <summary>
    /// Điều chỉnh số lượng tồn kho có lý do (Quyền: inventory.manage / Warehouse, Admin).
    /// </summary>
    [HttpPost("adjust")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<InventoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<InventoryDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AdjustStock([FromBody] AdjustStockRequestDto request, CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Staff";

        var beforeStock = await _inventoryService.GetStockAsync(request.VariantId, ct);
        var oldOnHand = beforeStock.Data?.OnHandQuantity ?? 0;

        var result = await _inventoryService.AdjustStockAsync(
            request.VariantId,
            request.QuantityChange,
            request.Reason,
            request.ReferenceType ?? "ManualAdjustment",
            request.ReferenceId,
            ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        // Ghi AuditLog
        await _auditLogService.LogAsync(
            action: "INVENTORY_ADJUSTED",
            entityName: "Inventory",
            entityId: request.VariantId.ToString(),
            oldValues: new { OnHandQuantity = oldOnHand },
            newValues: new { OnHandQuantity = result.Data!.OnHandQuantity, Change = request.QuantityChange, Reason = request.Reason },
            userId: staffId,
            userEmail: staffEmail,
            userRole: role,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: HttpContext.Request.Headers["User-Agent"].ToString(),
            note: $"Điều chỉnh {(request.QuantityChange > 0 ? "+" : "")}{request.QuantityChange} sản phẩm cho variant {request.VariantId}. Lý do: {request.Reason}",
            ct: ct);

        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách tồn kho chi tiết các biến thể (Quyền: inventory.view).
    /// </summary>
    [HttpGet("variants")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<VariantInventoryItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVariantInventories([FromQuery] string? search, CancellationToken ct)
    {
        var result = await _inventoryService.GetVariantInventoriesAsync(search, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách cảnh báo tồn kho thấp hoặc hết hàng (Quyền: inventory.view).
    /// </summary>
    [HttpGet("alerts")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<LowStockAlertDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStockAlerts([FromQuery] int threshold = 10, CancellationToken ct = default)
    {
        var result = await _inventoryService.GetLowStockAlertsAsync(threshold, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy sổ cái biến động kho toàn hệ thống kèm bộ lọc (Quyền: inventory.view).
    /// </summary>
    [HttpGet("movements")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<StockMovementDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMovementsFiltered([FromQuery] StockMovementQueryFilter filter, CancellationToken ct = default)
    {
        var result = await _inventoryService.GetMovementsFilteredAsync(filter, ct);
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
