using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Promotions;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/discounts")]
[Authorize(Policy = Permissions.DiscountManage)]
public class AdminDiscountsController : ControllerBase
{
    private readonly ICouponService _couponService;

    public AdminDiscountsController(ICouponService couponService)
    {
        _couponService = couponService;
    }

    /// <summary>
    /// Danh sách mã giảm giá khuyến mãi (Quyền: discount.manage / Sales, Admin).
    /// Hỗ trợ tìm kiếm theo mã, mô tả, lọc trạng thái hoạt động và phân trang.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(Result<PagedResult<CouponDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCoupons([FromQuery] CouponFilterDto filter, CancellationToken ct)
    {
        var result = await _couponService.GetCouponsAsync(filter, ct);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết một mã giảm giá.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCouponById(Guid id, CancellationToken ct)
    {
        var result = await _couponService.GetCouponByIdAsync(id, ct);
        if (!result.IsSuccess) return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Tạo mã giảm giá mới (Quyền: discount.manage / Sales, Admin).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponDto dto, CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();

        var result = await _couponService.CreateCouponAsync(dto, staffId, staffEmail, ct);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật thông tin mã giảm giá (Quyền: discount.manage / Sales, Admin).
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCoupon(Guid id, [FromBody] UpdateCouponDto dto, CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();

        var result = await _couponService.UpdateCouponAsync(id, dto, staffId, staffEmail, ct);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Bật/tắt trạng thái kích hoạt của mã giảm giá.
    /// </summary>
    [HttpPatch("{id:guid}/toggle-active")]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CouponDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();

        var result = await _couponService.ToggleActiveAsync(id, staffId, staffEmail, ct);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Xóa mã giảm giá (Nếu chưa có đơn hàng nào áp dụng).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteCoupon(Guid id, CancellationToken ct)
    {
        var staffId = GetCurrentUserId();
        var staffEmail = GetCurrentUserEmail();

        var result = await _couponService.DeleteCouponAsync(id, staffId, staffEmail, ct);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var userId) ? userId : Guid.Empty;
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "unknown";
    }
}
