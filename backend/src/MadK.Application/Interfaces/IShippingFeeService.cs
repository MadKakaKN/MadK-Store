using MadK.Application.Common;
using MadK.Application.DTOs.Shipping;

namespace MadK.Application.Interfaces;

/// <summary>
/// Interface trừu tượng hóa việc tính toán cước phí vận chuyển.
/// Cho phép dễ dàng thay đổi nhà cung cấp (Standard, Giao Hàng Nhanh - GHN, Viettel Post, v.v.).
/// </summary>
public interface IShippingFeeService
{
    Task<Result<ShippingCalculationResultDto>> CalculateShippingFeeAsync(
        ShippingCalculationRequestDto request,
        CancellationToken ct = default);
}
