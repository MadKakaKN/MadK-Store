using MadK.Application.Common;
using MadK.Application.DTOs.Loyalty;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/loyalty")]
[Authorize(Roles = "Admin")]
public class AdminLoyaltyController : ControllerBase
{
    private readonly ILoyaltyService _loyaltyService;

    public AdminLoyaltyController(ILoyaltyService loyaltyService)
    {
        _loyaltyService = loyaltyService;
    }

    /// <summary>
    /// [Admin] Tra cứu tài khoản điểm thưởng của một người dùng theo User ID.
    /// </summary>
    [HttpGet("users/{userId:guid}/account")]
    [ProducesResponseType(typeof(Result<LoyaltyAccountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserAccount(Guid userId, CancellationToken ct = default)
    {
        var account = await _loyaltyService.GetOrCreateAccountAsync(userId, ct);
        return Ok(Result<LoyaltyAccountDto>.Success(account));
    }

    /// <summary>
    /// [Admin] Tra cứu toàn bộ lịch sử biến động điểm thưởng của một khách hàng.
    /// </summary>
    [HttpGet("users/{userId:guid}/history")]
    [ProducesResponseType(typeof(Result<LoyaltyHistoryResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserHistory(
        Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var history = await _loyaltyService.GetHistoryAsync(userId, page, pageSize, ct);
        return Ok(Result<LoyaltyHistoryResponseDto>.Success(history));
    }

    /// <summary>
    /// [Admin] Điều chỉnh cộng/trừ điểm thủ công cho khách hàng (ví dụ: bồi thường, thưởng sự kiện, xử lý khiếu nại).
    /// </summary>
    [HttpPost("adjust")]
    [ProducesResponseType(typeof(Result<LoyaltyAccountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AdjustPoints(
        [FromBody] AdminAdjustPointsRequestDto request,
        CancellationToken ct = default)
    {
        if (request.Points == 0)
        {
            return BadRequest(Result.Failure("Số điểm điều chỉnh phải khác 0."));
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(Result.Failure("Vui lòng nhập lý do điều chỉnh điểm."));
        }

        try
        {
            var updated = await _loyaltyService.AdminAdjustPointsAsync(request.UserId, request.Points, request.Reason.Trim(), ct);
            return Ok(Result<LoyaltyAccountDto>.Success(updated, $"Đã {(request.Points > 0 ? "cộng" : "trừ")} {Math.Abs(request.Points):N0} điểm cho khách hàng thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Result.Failure(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, Result.Failure("Lỗi hệ thống khi điều chỉnh điểm: " + ex.Message));
        }
    }
}
