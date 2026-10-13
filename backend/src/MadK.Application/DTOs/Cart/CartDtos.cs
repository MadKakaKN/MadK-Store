namespace MadK.Application.DTOs.Cart;

public record CartItemDto(
    Guid Id,
    Guid CartId,
    Guid VariantId,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string VariantName,
    string Sku,
    string Attributes,
    decimal OriginalPrice,
    decimal Price,
    int Quantity,
    decimal TotalPrice,
    string? ThumbnailUrl,
    int StockAvailable,
    bool IsActive
);

public record CartDto(
    Guid CartId,
    Guid? UserId,
    string? AnonymousId,
    IReadOnlyList<CartItemDto> Items,
    int TotalQuantity,
    decimal TotalAmount,
    DateTime? UpdatedAt
);

public record AddToCartRequestDto(
    Guid VariantId,
    int Quantity = 1,
    decimal? ClientPrice = null // Cố tình truyền giá từ client để test bảo mật: Server PHẢI bỏ qua!
);

public record UpdateCartItemRequestDto(
    int Quantity
);

public record MergeCartItemDto(
    Guid VariantId,
    int Quantity
);

public record MergeCartRequestDto(
    string? AnonymousId = null,
    IReadOnlyList<MergeCartItemDto>? Items = null
);
