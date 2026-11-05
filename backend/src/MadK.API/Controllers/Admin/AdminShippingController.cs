using MadK.Application.Common;
using MadK.Application.DTOs.Shipping;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin,Staff")]
[Route("api/v1/admin/shipping/ghn")]
public class AdminShippingController : ControllerBase
{
    private readonly IGhnShippingService _ghnService;
    private readonly ILogger<AdminShippingController> _logger;

    public AdminShippingController(IGhnShippingService ghnService, ILogger<AdminShippingController> logger)
    {
        _ghnService = ghnService;
        _logger = logger;
    }

    /// <summary>
    /// Tạo mã vận đơn chính thức sang bưu cục Giao Hàng Nhanh (GHN) cho một đơn hàng.
    /// Cập nhật TrackingCode, CarrierName và ShippingStatus vào Order.
    /// </summary>
    [HttpPost("create-order/{orderNumber}")]
    [ProducesResponseType(typeof(Result<GhnCreateShippingOrderResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<GhnCreateShippingOrderResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateShippingOrder(
        [FromRoute] string orderNumber,
        [FromBody] GhnCreateShippingOrderRequestDto? body,
        CancellationToken ct)
    {
        var request = body ?? new GhnCreateShippingOrderRequestDto(orderNumber);
        if (string.IsNullOrWhiteSpace(request.OrderNumber))
        {
            request = request with { OrderNumber = orderNumber };
        }

        var result = await _ghnService.CreateShippingOrderAsync(request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy liên kết in phiếu gửi hàng A5 / tem dán bưu cục từ GHN.
    /// </summary>
    [HttpGet("print/{orderCode}")]
    [ProducesResponseType(typeof(Result<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPrintUrl(
        [FromRoute] string orderCode,
        CancellationToken ct)
    {
        var result = await _ghnService.GetPrintOrderUrlAsync(orderCode, ct);
        return Ok(result);
    }

    /// <summary>
    /// Tra cứu chi tiết tiến trình vận chuyển đơn hàng từ GHN.
    /// </summary>
    [HttpGet("track/{orderNumber}")]
    [ProducesResponseType(typeof(Result<GhnTrackingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<GhnTrackingDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TrackOrder(
        [FromRoute] string orderNumber,
        CancellationToken ct)
    {
        var result = await _ghnService.GetTrackingDetailAsync(orderNumber, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }
}
