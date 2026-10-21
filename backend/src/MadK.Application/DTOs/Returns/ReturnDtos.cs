using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Returns;

public record CreateReturnItemDto(
    Guid VariantId,
    int Quantity,
    string? Reason = null,
    string? Condition = null
);

public record CreateReturnRequestDto(
    string Reason,
    string? CustomerNote = null,
    List<CreateReturnItemDto>? Items = null
);

public record ApproveReturnRequestDto(
    string? SalesNote = null
);

public record RejectReturnRequestDto(
    string RejectionReason
);

public record ProcessReturnRefundDto(
    decimal? RefundAmount = null,
    bool RestockInventory = true,
    string? Note = null,
    string? IdempotencyKey = null
);

public record ReturnRequestItemDto(
    Guid Id,
    Guid? OrderItemId,
    Guid? VariantId,
    string ProductName,
    string VariantName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string? Reason,
    string? Condition
);

public record ReturnRequestDto(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
    Guid? UserId,
    string? CustomerName,
    string? CustomerEmail,
    string? CustomerPhone,
    ReturnRequestStatus Status,
    string Reason,
    string? CustomerNote,
    decimal RefundAmount,
    RefundStatus RefundStatus,
    string? RefundTransactionNo,
    DateTime? RefundedAt,
    string? SalesNote,
    string? RejectionReason,
    Guid? ProcessedByUserId,
    string? ProcessedByName,
    DateTime? ProcessedAt,
    bool IsRestocked,
    DateTime? RestockedAt,
    List<ReturnRequestItemDto> Items,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record ReturnFilterDto(
    int Page = 1,
    int PageSize = 20,
    ReturnRequestStatus? Status = null,
    string? Search = null
);
