using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Order;

public record ShippingAddressInputDto(
    string RecipientName,
    string PhoneNumber,
    string ProvinceCode,
    string ProvinceName,
    string DistrictCode,
    string DistrictName,
    string WardCode,
    string WardName,
    string DetailedAddress
);

public record CheckoutItemInputDto(
    Guid VariantId,
    int Quantity,
    decimal? ClientPrice = null
);

public record CheckoutCodRequestDto(
    Guid? AddressId = null,
    ShippingAddressInputDto? ShippingAddress = null,
    List<CheckoutItemInputDto>? Items = null,
    string? CustomerNote = null,
    string? IdempotencyKey = null
);

public record OrderItemDto(
    Guid Id,
    Guid? VariantId,
    Guid? ProductId,
    string ProductName,
    string VariantName,
    string Sku,
    decimal UnitPrice,
    decimal OriginalPrice,
    int Quantity,
    decimal TotalPrice,
    string Attributes,
    string? Specifications,
    string? ThumbnailUrl
);

public record OrderStatusHistoryDto(
    Guid Id,
    Guid OrderId,
    OrderStatus? FromStatus,
    OrderStatus ToStatus,
    Guid? ChangedByUserId,
    string ChangedByName,
    string? Reason,
    string? Note,
    DateTime CreatedAt
);

public record OrderDto(
    Guid Id,
    string OrderNumber,
    Guid? UserId,
    string? CustomerEmail,
    string? CustomerPhone,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    PaymentMethod PaymentMethod,
    decimal SubtotalAmount,
    decimal DiscountAmount,
    decimal ShippingFee,
    decimal TotalAmount,
    string ShippingAddressSnapshot,
    string? CustomerNote,
    string? CancelReason,
    DateTime? CancelledAt,
    string? IdempotencyKey,
    List<OrderItemDto> Items,
    List<OrderStatusHistoryDto> StatusHistory,
    DateTime CreatedAt
);

public record CancelOrderRequestDto(
    string Reason
);

public record UpdateOrderStatusRequestDto(
    OrderStatus NewStatus,
    string? Reason = null,
    string? Note = null
);
