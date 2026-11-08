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
    string DetailedAddress,
    string? Email = null
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
    string? IdempotencyKey = null,
    string? CouponCode = null,
    string? CustomerEmail = null,
    PaymentMethod PaymentMethod = PaymentMethod.COD,
    int PointsToRedeem = 0
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
)
{
    public string ProductNameSnapshot => ProductName;
    public string VariantNameSnapshot => VariantName;
    public string SkuSnapshot => Sku;
    public decimal UnitPriceSnapshot => UnitPrice;
    public decimal OriginalPriceSnapshot => OriginalPrice;
    public string AttributesSnapshot => Attributes;
    public string? SpecificationsSnapshot => Specifications;
    public string? ThumbnailUrlSnapshot => ThumbnailUrl;
};

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
    string? AdminNote,
    string? CancelReason,
    DateTime? CancelledAt,
    string? IdempotencyKey,
    List<OrderItemDto> Items,
    List<OrderStatusHistoryDto> StatusHistory,
    DateTime CreatedAt,
    DateTime? ExpiresAt = null,
    string? CouponSnapshot = null,
    string? CarrierName = null,
    string? TrackingCode = null,
    string? ShippingStatus = null,
    string? ShippingLabelUrl = null,
    DateTime? EstimatedDeliveryDate = null,
    int LoyaltyPointsUsed = 0,
    decimal LoyaltyDiscountAmount = 0m,
    int LoyaltyPointsEarned = 0
);

public record CancelOrderRequestDto(
    string Reason
);

public record UpdateOrderStatusRequestDto(
    OrderStatus NewStatus,
    string? Reason = null,
    string? Note = null
);

public record UpdateOrderNoteRequestDto(
    string AdminNote
);

public record PosCheckoutItemDto(
    Guid VariantId,
    int Quantity
);

public record PosCheckoutRequestDto(
    List<PosCheckoutItemDto> Items,
    PaymentMethod PaymentMethod = PaymentMethod.Cash,
    decimal CashTendered = 0m,
    decimal CashChange = 0m,
    string? CustomerName = null,
    string? CustomerPhone = null,
    string? CustomerEmail = null,
    Guid? CustomerId = null,
    string? CouponCode = null,
    string? StaffNote = null
);
