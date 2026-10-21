using MadK.Application.Common;
using MadK.Application.DTOs.Promotions;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/coupons")]
public class CouponsController : ControllerBase
{
    private readonly ICouponService _couponService;

    public CouponsController(ICouponService couponService)
    {
        _couponService = couponService;
    }

    /// <summary>
    /// Kiểm tra tính hợp lệ của mã giảm giá và tính toán số tiền giảm giá dựa trên tạm tính đơn hàng.
    /// Dùng cho người dùng kiểm tra trước khi đặt hàng tại trang Giỏ hàng / Checkout.
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(Result<CouponCalculationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CouponCalculationResultDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponRequestDto request, CancellationToken ct)
    {
        var result = await _couponService.ValidateAndCalculateDiscountAsync(request.Code, request.SubtotalAmount, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
