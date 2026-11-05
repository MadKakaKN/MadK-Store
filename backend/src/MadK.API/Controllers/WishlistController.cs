using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Wishlist;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/wishlist")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlistService;

    public WishlistController(IWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    /// <summary>
    /// Lấy toàn bộ danh sách sản phẩm yêu thích của người dùng hiện tại.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(Result<IReadOnlyList<WishlistItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWishlist(CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để xem danh sách yêu thích."));
        }

        var result = await _wishlistService.GetWishlistAsync(userId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách ID sản phẩm đã thích (tối ưu hóa payload cho giao diện hiển thị icon ❤️).
    /// </summary>
    [HttpGet("ids")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<Guid>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWishlistProductIds(CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập."));
        }

        var result = await _wishlistService.GetWishlistProductIdsAsync(userId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Thêm sản phẩm vào danh sách yêu thích.
    /// </summary>
    [HttpPost("{productId:guid}")]
    [ProducesResponseType(typeof(Result<WishlistItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<WishlistItemDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddToWishlist(Guid productId, CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để thêm vào yêu thích."));
        }

        var result = await _wishlistService.AddToWishlistAsync(userId, productId, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Xóa sản phẩm khỏi danh sách yêu thích.
    /// </summary>
    [HttpDelete("{productId:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveFromWishlist(Guid productId, CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập."));
        }

        var result = await _wishlistService.RemoveFromWishlistAsync(userId, productId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Đồng bộ danh sách yêu thích từ LocalStorage của khách vãng lai sau khi đăng nhập.
    /// </summary>
    [HttpPost("sync")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<WishlistItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncWishlist([FromBody] SyncWishlistDto dto, CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để đồng bộ yêu thích."));
        }

        var result = await _wishlistService.SyncWishlistAsync(userId, dto, ct);
        return Ok(result);
    }

    /// <summary>
    /// Kiểm tra sản phẩm đã nằm trong danh sách yêu thích chưa.
    /// </summary>
    [HttpGet("{productId:guid}/check")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckIsInWishlist(Guid productId, CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập."));
        }

        var result = await _wishlistService.IsInWishlistAsync(userId, productId, ct);
        return Ok(result);
    }

    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return !string.IsNullOrWhiteSpace(sub) && Guid.TryParse(sub, out userId);
    }
}
