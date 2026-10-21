using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Pricing;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/pricing")]
[Authorize(Policy = Permissions.CatalogManage)]
public class AdminPricingController : ControllerBase
{
    private readonly IPricingService _pricingService;

    public AdminPricingController(IPricingService pricingService)
    {
        _pricingService = pricingService;
    }

    /// <summary>
    /// Danh sách biến thể kèm giá hiện hành, trạng thái khuyến mãi và phân trang.
    /// </summary>
    [HttpGet("variants")]
    [ProducesResponseType(typeof(Result<PagedResult<AdminVariantPriceItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVariantPrices([FromQuery] AdminPricingQueryParams queryParams, CancellationToken ct)
    {
        var result = await _pricingService.GetAdminVariantPricesAsync(queryParams, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết cấu hình giá, giá hiện hành và lịch sử thay đổi giá của một biến thể.
    /// </summary>
    [HttpGet("variants/{variantId:guid}")]
    [ProducesResponseType(typeof(Result<VariantPricingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<VariantPricingDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVariantPricing([FromRoute] Guid variantId, CancellationToken ct)
    {
        var result = await _pricingService.GetVariantPricingAsync(variantId, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Tạo khoảng giá khuyến mãi theo thời gian cho biến thể.
    /// Tự động kiểm tra và từ chối nếu bị trùng/chồng chéo khoảng thời gian với khuyến mãi khác.
    /// </summary>
    [HttpPost("variants/{variantId:guid}/promotions")]
    [ProducesResponseType(typeof(Result<PriceScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<PriceScheduleDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePromotionSchedule(
        [FromRoute] Guid variantId,
        [FromBody] CreatePriceScheduleDto dto,
        CancellationToken ct)
    {
        var (actorId, actorEmail) = GetActorInfo();
        var result = await _pricingService.CreatePromotionScheduleAsync(variantId, dto, actorId, actorEmail, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Điều chỉnh giá niêm yết (Original Price) và giá bán chuẩn (Sale Price), lưu lịch sử giá.
    /// </summary>
    [HttpPut("variants/{variantId:guid}/base-price")]
    [ProducesResponseType(typeof(Result<VariantPricingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<VariantPricingDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateBasePrice(
        [FromRoute] Guid variantId,
        [FromBody] UpdateBasePriceDto dto,
        CancellationToken ct)
    {
        var (actorId, actorEmail) = GetActorInfo();
        var result = await _pricingService.UpdateBasePriceAsync(variantId, dto, actorId, actorEmail, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Bật/tắt kích hoạt một lịch trình giá khuyến mãi.
    /// </summary>
    [HttpPost("schedules/{scheduleId:guid}/toggle-active")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleScheduleActive([FromRoute] Guid scheduleId, CancellationToken ct)
    {
        var (actorId, actorEmail) = GetActorInfo();
        var result = await _pricingService.ToggleScheduleActiveAsync(scheduleId, actorId, actorEmail, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Xóa mềm một lịch trình giá khuyến mãi.
    /// </summary>
    [HttpDelete("schedules/{scheduleId:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteSchedule([FromRoute] Guid scheduleId, CancellationToken ct)
    {
        var (actorId, actorEmail) = GetActorInfo();
        var result = await _pricingService.DeleteScheduleAsync(scheduleId, actorId, actorEmail, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    private (Guid? ActorId, string? ActorEmail) GetActorInfo()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? actorId = Guid.TryParse(idClaim, out var g) ? g : null;
        var email = User.FindFirstValue(ClaimTypes.Email);
        return (actorId, email);
    }
}
