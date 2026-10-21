using MadK.Application.Common;
using MadK.Application.DTOs.Shipping;
using MadK.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

/// <summary>
/// Dịch vụ tính phí vận chuyển tiêu chuẩn của MadK Store:
/// - Miễn phí vận chuyển toàn quốc cho đơn hàng từ 1.000.000đ.
/// - Nội thành Hà Nội / TP.HCM: 20.000đ (1 - 2 ngày).
/// - Các tỉnh thành khác: 35.000đ (2 - 4 ngày).
/// - Phụ thu đơn hàng cồng kềnh/nhiều sản phẩm (>2000g hoặc >3 sản phẩm): +10.000đ.
/// </summary>
public class StandardShippingFeeService : IShippingFeeService
{
    public const decimal FreeShippingThreshold = 1_000_000m;
    public const decimal InnerCityBaseFee = 20_000m;
    public const decimal OuterCityBaseFee = 35_000m;
    public const decimal HeavyWeightSurcharge = 10_000m;

    private readonly ILogger<StandardShippingFeeService> _logger;

    public StandardShippingFeeService(ILogger<StandardShippingFeeService> logger)
    {
        _logger = logger;
    }

    public Task<Result<ShippingCalculationResultDto>> CalculateShippingFeeAsync(
        ShippingCalculationRequestDto request,
        CancellationToken ct = default)
    {
        // 1. Kiểm tra chính sách Miễn phí vận chuyển (Freeship)
        if (request.SubtotalAmount >= FreeShippingThreshold)
        {
            var freeResult = new ShippingCalculationResultDto(
                ShippingFee: 0m,
                CarrierName: "MadK Express",
                ServiceName: "Miễn phí vận chuyển toàn quốc",
                EstimatedDelivery: IsInnerCity(request.ProvinceName) ? "1 - 2 ngày làm việc" : "2 - 4 ngày làm việc",
                IsFreeShipping: true,
                Description: "Miễn phí vận chuyển toàn quốc cho đơn từ 1.000.000đ."
            );
            return Task.FromResult(Result<ShippingCalculationResultDto>.Success(freeResult));
        }

        // 2. Phân loại theo vùng địa lý
        bool isInner = IsInnerCity(request.ProvinceName);
        decimal baseFee = isInner ? InnerCityBaseFee : OuterCityBaseFee;
        string carrierName = isInner ? "MadK Express (Nội thành)" : "MadK Standard Carrier (Liên tỉnh)";
        string serviceName = isInner ? "Giao hàng tiêu chuẩn nội thành" : "Giao hàng tiêu chuẩn liên tỉnh";
        string estimatedDelivery = isInner ? "1 - 2 ngày làm việc" : "2 - 4 ngày làm việc";

        // 3. Phụ thu khối lượng nếu kiện hàng nặng > 2kg hoặc số lượng bàn phím > 3 món
        decimal surcharge = 0m;
        if ((request.TotalWeightGrams.HasValue && request.TotalWeightGrams.Value > 2000) || request.TotalQuantity > 3)
        {
            surcharge = HeavyWeightSurcharge;
        }

        decimal totalFee = baseFee + surcharge;
        string description = isInner
            ? "Cước nội thành Hà Nội / TP.HCM."
            : "Cước vận chuyển liên tỉnh toàn quốc.";

        if (surcharge > 0)
        {
            description += " (Bao gồm phụ phí kiện hàng nặng > 2kg).";
        }

        var result = new ShippingCalculationResultDto(
            ShippingFee: totalFee,
            CarrierName: carrierName,
            ServiceName: serviceName,
            EstimatedDelivery: estimatedDelivery,
            IsFreeShipping: false,
            Description: description
        );

        return Task.FromResult(Result<ShippingCalculationResultDto>.Success(result));
    }

    private static bool IsInnerCity(string? provinceName)
    {
        if (string.IsNullOrWhiteSpace(provinceName)) return false;

        var normalized = provinceName.Trim().ToLowerInvariant();
        return normalized.Contains("hà nội") ||
               normalized.Contains("ha noi") ||
               normalized.Contains("hồ chí minh") ||
               normalized.Contains("ho chi minh") ||
               normalized.Contains("hcm") ||
               normalized.Contains("hn");
    }
}
