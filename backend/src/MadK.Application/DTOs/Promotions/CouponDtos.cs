using MadK.Application.DTOs.Order;
using MadK.Domain.Enums;

namespace MadK.Application.DTOs.Promotions;

public record CouponCalculationResultDto(
    bool IsValid,
    string Code,
    CouponDiscountType DiscountType,
    decimal DiscountValue,
    decimal DiscountAmount,
    string? Description = null,
    string? ErrorMessage = null
);

public record CouponDto(
    Guid Id,
    string Code,
    string? Description,
    CouponDiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscountAmount,
    decimal MinOrderAmount,
    DateTime? StartDate,
    DateTime? EndDate,
    int? UsageLimit,
    int UsedCount,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateCouponDto(
    string Code,
    string? Description = null,
    CouponDiscountType DiscountType = CouponDiscountType.Percentage,
    decimal DiscountValue = 0m,
    decimal? MaxDiscountAmount = null,
    decimal MinOrderAmount = 0m,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int? UsageLimit = null,
    bool IsActive = true
);

public record UpdateCouponDto(
    string? Description = null,
    CouponDiscountType DiscountType = CouponDiscountType.Percentage,
    decimal DiscountValue = 0m,
    decimal? MaxDiscountAmount = null,
    decimal MinOrderAmount = 0m,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int? UsageLimit = null,
    bool IsActive = true
);

public record CouponFilterDto(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    bool? IsActive = null
);

public record ValidateCouponRequestDto(
    string Code,
    decimal SubtotalAmount
);

public record CheckoutEstimateRequestDto(
    Guid? AddressId = null,
    ShippingAddressInputDto? ShippingAddress = null,
    List<CheckoutItemInputDto>? Items = null,
    string? CouponCode = null
);

public record CheckoutEstimateResponseDto(
    decimal SubtotalAmount,
    decimal ShippingFee,
    string CarrierName,
    string EstimatedDelivery,
    bool IsFreeShipping,
    decimal DiscountAmount,
    string? CouponCode,
    string? CouponDescription,
    decimal TotalAmount,
    bool IsCouponValid,
    string? CouponErrorMessage = null
);
