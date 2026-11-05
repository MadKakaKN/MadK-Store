using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Loyalty;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/loyalty")]
[Authorize]
public class LoyaltyController : ControllerBase
{
    private readonly ILoyaltyService _loyaltyService;

    public LoyaltyController(ILoyaltyService loyaltyService)
    {
        _loyaltyService = loyaltyService;
    }

    /// <summary>
    /// Lấy thông tin tài khoản điểm thưởng, hạng thành viên, quyền lợi của người dùng hiện tại.
    /// </summary>
    [HttpGet("account")]
    [ProducesResponseType(typeof(Result<LoyaltyAccountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAccount(CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để xem điểm thưởng."));
        }

        var account = await _loyaltyService.GetOrCreateAccountAsync(userId, ct);
        return Ok(Result<LoyaltyAccountDto>.Success(account));
    }

    /// <summary>
    /// Lấy lịch sử biến động điểm thưởng (cộng điểm đơn hàng, trừ điểm khi checkout, hoàn điểm) phân trang.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(Result<LoyaltyHistoryResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để xem lịch sử điểm."));
        }

        var history = await _loyaltyService.GetHistoryAsync(userId, page, pageSize, ct);
        return Ok(Result<LoyaltyHistoryResponseDto>.Success(history));
    }

    /// <summary>
    /// Ước tính số tiền giảm giá và kiểm tra tính hợp lệ của số điểm muốn dùng khi checkout.
    /// </summary>
    [HttpPost("estimate-redeem")]
    [ProducesResponseType(typeof(Result<RedeemPointsEstimateResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EstimateRedeem(
        [FromBody] RedeemPointsEstimateRequestDto request,
        CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để sử dụng điểm thưởng."));
        }

        if (request.SubtotalAmount < 0)
        {
            return BadRequest(Result.Failure("Giá trị tiền hàng không hợp lệ."));
        }

        var result = await _loyaltyService.EstimateRedeemPointsAsync(
            userId, request.SubtotalAmount, request.PointsToRedeem, ct);

        if (!result.IsValid)
        {
            return BadRequest(Result<RedeemPointsEstimateResponseDto>.Failure(result.ErrorMessage ?? "Số điểm không hợp lệ."));
        }

        return Ok(Result<RedeemPointsEstimateResponseDto>.Success(result));
    }

    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return !string.IsNullOrWhiteSpace(sub) && Guid.TryParse(sub, out userId);
    }
}
