using MadK.Application.Common;
using MadK.Application.DTOs.Shipping;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/shipping/ghn")]
public class GhnShippingController : ControllerBase
{
    private readonly IGhnShippingService _ghnService;
    private readonly ILogger<GhnShippingController> _logger;

    public GhnShippingController(IGhnShippingService ghnService, ILogger<GhnShippingController> logger)
    {
        _ghnService = ghnService;
        _logger = logger;
    }

    /// <summary>
    /// Tính phí vận chuyển thực tế từ kho MadK tới địa chỉ khách hàng qua GHN.
    /// Áp dụng chính sách Freeship toàn quốc cho đơn từ 1.000.000đ.
    /// </summary>
    [HttpPost("calculate-fee")]
    [ProducesResponseType(typeof(Result<GhnCalculateFeeResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CalculateFee(
        [FromBody] GhnCalculateFeeRequestDto request,
        CancellationToken ct)
    {
        var result = await _ghnService.CalculateShippingFeeAsync(request, ct);
        return Ok(result);
    }

    /// <summary>
    /// Tra cứu chi tiết hành trình vận chuyển của đơn hàng (Mã đơn MK-... hoặc Mã vận đơn GHN-...).
    /// </summary>
    [HttpGet("track/{orderNumberOrTrackingCode}")]
    [ProducesResponseType(typeof(Result<GhnTrackingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<GhnTrackingDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TrackOrder(
        [FromRoute] string orderNumberOrTrackingCode,
        CancellationToken ct)
    {
        var result = await _ghnService.GetTrackingDetailAsync(orderNumberOrTrackingCode, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Webhook tiếp nhận thông báo hành trình bưu phẩm từ bưu tá / máy chủ GHN.
    /// Tự động đồng bộ trạng thái đơn hàng (delivering -> Shipping, delivered -> Completed, COD -> Paid).
    /// </summary>
    [HttpPost("webhook")]
    [ProducesResponseType(typeof(GhnWebhookResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessWebhook(
        [FromBody] GhnWebhookPayloadDto payload,
        CancellationToken ct)
    {
        _logger.LogInformation("GHN Webhook received for OrderCode {OrderCode}, Status {Status}",
            payload.OrderCode, payload.Status);

        var result = await _ghnService.ProcessGhnWebhookAsync(payload, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách Tỉnh/Thành phố chuẩn GHN.
    /// </summary>
    [HttpGet("provinces")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<GhnProvinceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProvinces(CancellationToken ct)
    {
        var result = await _ghnService.GetProvincesAsync(ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách Quận/Huyện theo Tỉnh/Thành chuẩn GHN.
    /// </summary>
    [HttpGet("districts/{provinceId:int}")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<GhnDistrictDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDistricts([FromRoute] int provinceId, CancellationToken ct)
    {
        var result = await _ghnService.GetDistrictsAsync(provinceId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách Phường/Xã theo Quận/Huyện chuẩn GHN.
    /// </summary>
    [HttpGet("wards/{districtId:int}")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<GhnWardDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWards([FromRoute] int districtId, CancellationToken ct)
    {
        var result = await _ghnService.GetWardsAsync(districtId, ct);
        return Ok(result);
    }
}
