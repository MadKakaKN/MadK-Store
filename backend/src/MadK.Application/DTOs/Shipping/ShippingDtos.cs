namespace MadK.Application.DTOs.Shipping;

/// <summary>
/// Dữ liệu đầu vào để tính toán phí vận chuyển đơn hàng.
/// </summary>
public record ShippingCalculationRequestDto(
    string? ProvinceName = null,
    string? DistrictName = null,
    string? WardName = null,
    decimal SubtotalAmount = 0m,
    int TotalQuantity = 1,
    int? TotalWeightGrams = null
);

/// <summary>
/// Kết quả tính toán phí vận chuyển trả về cho client / checkout.
/// </summary>
public record ShippingCalculationResultDto(
    decimal ShippingFee,
    string CarrierName,
    string ServiceName,
    string EstimatedDelivery,
    bool IsFreeShipping,
    string? Description = null
);
