using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Inventory;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/purchasing")]
public class AdminPurchasingController : ControllerBase
{
    private readonly IPurchasingService _purchasingService;

    public AdminPurchasingController(IPurchasingService purchasingService)
    {
        _purchasingService = purchasingService;
    }

    #region Suppliers (Nhà cung cấp)

    [HttpGet("suppliers")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<SupplierDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSuppliers([FromQuery] string? search, [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await _purchasingService.GetSuppliersAsync(search, isActive, ct);
        return Ok(result);
    }

    [HttpGet("suppliers/{id:guid}")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<SupplierDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSupplierById(Guid id, CancellationToken ct)
    {
        var result = await _purchasingService.GetSupplierByIdAsync(id, ct);
        return result.IsSuccess ? Ok(result) : NotFound(result);
    }

    [HttpPost("suppliers")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<SupplierDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto, CancellationToken ct)
    {
        var result = await _purchasingService.CreateSupplierAsync(dto, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPut("suppliers/{id:guid}")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<SupplierDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateSupplier(Guid id, [FromBody] UpdateSupplierDto dto, CancellationToken ct)
    {
        var result = await _purchasingService.UpdateSupplierAsync(id, dto, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("suppliers/{id:guid}")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteSupplier(Guid id, CancellationToken ct)
    {
        var result = await _purchasingService.DeleteSupplierAsync(id, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Purchase Orders (Phiếu nhập hàng)

    [HttpGet("purchase-orders")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<PurchaseOrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPurchaseOrders([FromQuery] PurchaseOrderQueryFilter filter, CancellationToken ct)
    {
        var result = await _purchasingService.GetPurchaseOrdersAsync(filter, ct);
        return Ok(result);
    }

    [HttpGet("purchase-orders/{id:guid}")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<PurchaseOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPurchaseOrderById(Guid id, CancellationToken ct)
    {
        var result = await _purchasingService.GetPurchaseOrderByIdAsync(id, ct);
        return result.IsSuccess ? Ok(result) : NotFound(result);
    }

    [HttpPost("purchase-orders")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<PurchaseOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseOrderDto dto, CancellationToken ct)
    {
        var email = GetCurrentUserEmail();
        var result = await _purchasingService.CreatePurchaseOrderAsync(dto, email, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("purchase-orders/{id:guid}/receive")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<PurchaseOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReceivePurchaseOrder(Guid id, CancellationToken ct)
    {
        var email = GetCurrentUserEmail();
        var result = await _purchasingService.ReceivePurchaseOrderAsync(id, email, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("purchase-orders/{id:guid}/cancel")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<PurchaseOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelPurchaseOrder(Guid id, [FromQuery] string? reason, CancellationToken ct)
    {
        var result = await _purchasingService.CancelPurchaseOrderAsync(id, reason, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Inventory Audits (Kiểm kho)

    [HttpGet("audits")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<InventoryAuditDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventoryAudits(CancellationToken ct)
    {
        var result = await _purchasingService.GetInventoryAuditsAsync(ct);
        return Ok(result);
    }

    [HttpGet("audits/{id:guid}")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(Result<InventoryAuditDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventoryAuditById(Guid id, CancellationToken ct)
    {
        var result = await _purchasingService.GetInventoryAuditByIdAsync(id, ct);
        return result.IsSuccess ? Ok(result) : NotFound(result);
    }

    [HttpPost("audits")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<InventoryAuditDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateInventoryAudit([FromBody] CreateInventoryAuditDto dto, CancellationToken ct)
    {
        var email = GetCurrentUserEmail();
        var result = await _purchasingService.CreateInventoryAuditAsync(dto, email, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("audits/{id:guid}/complete")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<InventoryAuditDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CompleteInventoryAudit(Guid id, [FromBody] CompleteInventoryAuditDto dto, CancellationToken ct)
    {
        var email = GetCurrentUserEmail();
        var result = await _purchasingService.CompleteInventoryAuditAsync(id, dto, email, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("audits/{id:guid}/cancel")]
    [Authorize(Policy = Permissions.InventoryManage)]
    [ProducesResponseType(typeof(Result<InventoryAuditDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelInventoryAudit(Guid id, [FromQuery] string? reason, CancellationToken ct)
    {
        var result = await _purchasingService.CancelInventoryAuditAsync(id, reason, ct);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "warehouse@madkstore.vn";
    }
}
