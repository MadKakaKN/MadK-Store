using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Inventory;

public record InventoryDto(
    Guid Id,
    Guid VariantId,
    int OnHandQuantity,
    int ReservedQuantity,
    int AvailableQuantity,
    DateTime? UpdatedAt
);

public record StockMovementDto(
    Guid Id,
    Guid VariantId,
    StockMovementType Type,
    int Quantity,
    int OnHandBefore,
    int OnHandAfter,
    int ReservedBefore,
    int ReservedAfter,
    string? ReferenceType,
    string? ReferenceId,
    string? Reason,
    DateTime CreatedAt
);

public record ReserveStockRequestDto(
    Guid VariantId,
    int Quantity,
    string ReferenceType,
    string ReferenceId,
    string? Reason = null
);

public record ReleaseStockRequestDto(
    Guid VariantId,
    int Quantity,
    string ReferenceType,
    string ReferenceId,
    string? Reason = null
);

public record CommitStockRequestDto(
    Guid VariantId,
    int Quantity,
    string ReferenceType,
    string ReferenceId,
    string? Reason = null
);

public record RestockRequestDto(
    Guid VariantId,
    int Quantity,
    string? Reason = null
);

public record AdjustStockRequestDto(
    Guid VariantId,
    int QuantityChange,
    string Reason,
    string? ReferenceType = null,
    string? ReferenceId = null
);

public record VariantInventoryItemDto(
    Guid VariantId,
    Guid ProductId,
    string ProductName,
    string VariantName,
    string Sku,
    string? CategoryName,
    string? BrandName,
    string? ThumbnailUrl,
    decimal CostPrice,
    decimal SalePrice,
    int OnHandQuantity,
    int ReservedQuantity,
    int AvailableQuantity,
    DateTime? UpdatedAt
);

public record LowStockAlertDto(
    Guid VariantId,
    string Sku,
    string ProductName,
    string VariantName,
    string? ThumbnailUrl,
    int OnHandQuantity,
    int ReservedQuantity,
    int AvailableQuantity,
    int LowStockThreshold,
    string Status
);

public record StockMovementQueryFilter(
    Guid? VariantId = null,
    StockMovementType? Type = null,
    string? ReferenceType = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Limit = 100
);

// Supplier DTOs
public record SupplierDto(
    Guid Id,
    string Code,
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Address,
    bool IsActive,
    string? Notes,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateSupplierDto(
    string Code,
    string Name,
    string? ContactPerson = null,
    string? Phone = null,
    string? Email = null,
    string? Address = null,
    string? Notes = null
);

public record UpdateSupplierDto(
    string Name,
    string? ContactPerson = null,
    string? Phone = null,
    string? Email = null,
    string? Address = null,
    bool IsActive = true,
    string? Notes = null
);

// Purchase Order DTOs
public record PurchaseOrderItemDto(
    Guid Id,
    Guid PurchaseOrderId,
    Guid VariantId,
    string? VariantSku,
    string? VariantName,
    string? ProductName,
    int Quantity,
    decimal UnitCost,
    decimal TotalCost,
    string? Notes
);

public record PurchaseOrderDto(
    Guid Id,
    string Code,
    Guid SupplierId,
    string? SupplierName,
    PurchaseOrderStatus Status,
    decimal TotalAmount,
    string? Notes,
    string? CreatedBy,
    DateTime? ReceivedAt,
    DateTime CreatedAt,
    IReadOnlyList<PurchaseOrderItemDto> Items
);

public record CreatePurchaseOrderItemDto(
    Guid VariantId,
    int Quantity,
    decimal UnitCost,
    string? Notes = null
);

public record CreatePurchaseOrderDto(
    Guid SupplierId,
    string? Code,
    string? Notes,
    IReadOnlyList<CreatePurchaseOrderItemDto> Items
);

public record PurchaseOrderQueryFilter(
    Guid? SupplierId = null,
    PurchaseOrderStatus? Status = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 20
);

// Inventory Audit DTOs
public record InventoryAuditItemDto(
    Guid Id,
    Guid InventoryAuditId,
    Guid VariantId,
    string? VariantSku,
    string? VariantName,
    string? ProductName,
    int SystemQuantity,
    int ActualQuantity,
    int Discrepancy,
    string? Reason
);

public record InventoryAuditDto(
    Guid Id,
    string Code,
    InventoryAuditStatus Status,
    string? Notes,
    string? CreatedBy,
    DateTime? CompletedAt,
    DateTime CreatedAt,
    IReadOnlyList<InventoryAuditItemDto> Items
);

public record CreateInventoryAuditItemDto(
    Guid VariantId,
    int? ActualQuantity = null,
    string? Reason = null
);

public record CreateInventoryAuditDto(
    string? Code,
    string? Notes,
    IReadOnlyList<CreateInventoryAuditItemDto> Items
);

public record CompleteInventoryAuditItemDto(
    Guid VariantId,
    int ActualQuantity,
    string? Reason = null
);

public record CompleteInventoryAuditDto(
    IReadOnlyList<CompleteInventoryAuditItemDto>? Items = null
);

