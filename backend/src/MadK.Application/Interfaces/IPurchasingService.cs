using MadK.Application.Common;
using MadK.Application.DTOs.Inventory;

namespace MadK.Application.Interfaces;

public interface IPurchasingService
{
    // Suppliers (Nhà cung cấp)
    Task<Result<IReadOnlyList<SupplierDto>>> GetSuppliersAsync(string? search = null, bool? isActive = null, CancellationToken ct = default);
    Task<Result<SupplierDto>> GetSupplierByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<SupplierDto>> CreateSupplierAsync(CreateSupplierDto dto, CancellationToken ct = default);
    Task<Result<SupplierDto>> UpdateSupplierAsync(Guid id, UpdateSupplierDto dto, CancellationToken ct = default);
    Task<Result<bool>> DeleteSupplierAsync(Guid id, CancellationToken ct = default);

    // Purchase Orders (Phiếu nhập hàng ghi giá vốn)
    Task<Result<IReadOnlyList<PurchaseOrderDto>>> GetPurchaseOrdersAsync(PurchaseOrderQueryFilter filter, CancellationToken ct = default);
    Task<Result<PurchaseOrderDto>> GetPurchaseOrderByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<PurchaseOrderDto>> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, string? createdBy = null, CancellationToken ct = default);
    Task<Result<PurchaseOrderDto>> ReceivePurchaseOrderAsync(Guid id, string? receivedBy = null, CancellationToken ct = default);
    Task<Result<PurchaseOrderDto>> CancelPurchaseOrderAsync(Guid id, string? reason = null, CancellationToken ct = default);

    // Inventory Audits (Kiểm kê kho & cân bằng tồn)
    Task<Result<IReadOnlyList<InventoryAuditDto>>> GetInventoryAuditsAsync(CancellationToken ct = default);
    Task<Result<InventoryAuditDto>> GetInventoryAuditByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<InventoryAuditDto>> CreateInventoryAuditAsync(CreateInventoryAuditDto dto, string? createdBy = null, CancellationToken ct = default);
    Task<Result<InventoryAuditDto>> CompleteInventoryAuditAsync(Guid id, CompleteInventoryAuditDto dto, string? completedBy = null, CancellationToken ct = default);
    Task<Result<InventoryAuditDto>> CancelInventoryAuditAsync(Guid id, string? reason = null, CancellationToken ct = default);
}
