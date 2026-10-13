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
