using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Cart;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    /// <summary>
    /// Lấy chi tiết giỏ hàng hiện tại của khách hàng đã đăng nhập.
    /// Tổng tiền và đơn giá được tính trực tiếp từ cơ sở dữ liệu.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCart(CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId == null)
        {
            return Unauthorized(Result<CartDto>.Failure("Vui lòng đăng nhập để xem giỏ hàng."));
        }

        var result = await _cartService.GetCartAsync(userId.Value, null, ct);
        return Ok(result);
    }

    /// <summary>
    /// Thêm sản phẩm biến thể vào giỏ hàng.
    /// Giá được server tự tra cứu và tính toán từ DB (hoàn toàn bỏ qua giá client gửi lên).
    /// Kiểm tra tồn kho khả dụng khi thêm.
    /// </summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddItem([FromBody] AddToCartRequestDto request, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId == null)
        {
            return Unauthorized(Result<CartDto>.Failure("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng."));
        }

        var result = await _cartService.AddItemAsync(userId.Value, null, request, ct);
        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Cập nhật số lượng của một dòng sản phẩm trong giỏ.
    /// Kiểm tra tồn kho khả dụng; nếu số lượng = 0 thì tự động xóa dòng sản phẩm.
    /// </summary>
    [HttpPut("items/{itemId:guid}")]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItemQuantity(Guid itemId, [FromBody] UpdateCartItemRequestDto request, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId == null)
        {
            return Unauthorized(Result<CartDto>.Failure("Vui lòng đăng nhập để thao tác giỏ hàng."));
        }

        var result = await _cartService.UpdateItemQuantityAsync(userId.Value, null, itemId, request.Quantity, ct);
        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Xóa một món hàng khỏi giỏ.
    /// </summary>
    [HttpDelete("items/{itemId:guid}")]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem(Guid itemId, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId == null)
        {
            return Unauthorized(Result<CartDto>.Failure("Vui lòng đăng nhập để thao tác giỏ hàng."));
        }

        var result = await _cartService.RemoveItemAsync(userId.Value, null, itemId, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Xóa toàn bộ giỏ hàng.
    /// </summary>
    [HttpDelete("clear")]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClearCart(CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId == null)
        {
            return Unauthorized(Result<CartDto>.Failure("Vui lòng đăng nhập để thao tác giỏ hàng."));
        }

        var result = await _cartService.ClearCartAsync(userId.Value, null, ct);
        return Ok(result);
    }

    /// <summary>
    /// Gộp giỏ hàng (tương thích ngược nếu có session).
    /// </summary>
    [HttpPost("merge")]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Result<CartDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MergeCart([FromBody] MergeCartRequestDto request, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (!userId.HasValue || userId.Value == Guid.Empty)
        {
            return Unauthorized(Result<CartDto>.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _cartService.MergeCartAsync(userId.Value, request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    private Guid? ResolveUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(sub, out var parsedId) && parsedId != Guid.Empty)
        {
            return parsedId;
        }

        return null;
    }
}
