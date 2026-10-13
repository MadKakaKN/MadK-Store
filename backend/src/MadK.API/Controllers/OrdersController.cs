using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    /// <summary>
    /// Checkout và tạo đơn hàng COD (Thanh toán khi nhận hàng).
    /// Hỗ trợ cả người dùng đã đăng nhập lẫn khách vãng lai.
    /// Chống duplicate qua header Idempotency-Key hoặc request.IdempotencyKey.
    /// </summary>
    [HttpPost("checkout/cod")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckoutCod(
        [FromBody] CheckoutCodRequestDto request,
        [FromHeader(Name = "Idempotency-Key")] string? headerIdempotencyKey,
        [FromHeader(Name = "X-Anonymous-Id")] string? headerAnonymousId,
        CancellationToken ct)
    {
        var (userId, anonymousId) = ResolveUserOrAnonymous(headerAnonymousId);

        // Header Idempotency-Key được ưu tiên nếu có
        var effectiveIdempotencyKey = !string.IsNullOrWhiteSpace(headerIdempotencyKey)
            ? headerIdempotencyKey.Trim()
            : request.IdempotencyKey;

        var effectiveRequest = request with { IdempotencyKey = effectiveIdempotencyKey };

        var result = await _orderService.CheckoutCodAsync(userId, anonymousId, effectiveRequest, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Tra cứu chi tiết đơn hàng theo mã đơn (e.g. MK-20261013-XXXXXX).
    /// </summary>
    [HttpGet("{orderNumber}")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByOrderNumber(
        [FromRoute] string orderNumber,
        CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        var result = await _orderService.GetOrderByNumberAsync(orderNumber, userId, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Tra cứu chi tiết đơn hàng theo ID.
    /// </summary>
    [HttpGet("id/{orderId:guid}")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        [FromRoute] Guid orderId,
        CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        var result = await _orderService.GetOrderByIdAsync(orderId, userId, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách lịch sử đơn hàng của người dùng hiện tại.
    /// </summary>
    [Authorize]
    [HttpGet("my-orders")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders(CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        if (!userId.HasValue)
        {
            return Unauthorized(Result<IReadOnlyList<OrderDto>>.Failure("Vui lòng đăng nhập."));
        }

        var result = await _orderService.GetMyOrdersAsync(userId.Value, ct);
        return Ok(result);
    }

    private (Guid? UserId, string? AnonymousId) ResolveUserOrAnonymous(string? headerAnonymousId)
    {
        Guid? userId = null;
        var subClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(subClaim) && Guid.TryParse(subClaim, out var parsed))
        {
            userId = parsed;
        }

        string? anonymousId = null;
        if (!userId.HasValue && !string.IsNullOrWhiteSpace(headerAnonymousId))
        {
            anonymousId = headerAnonymousId.Trim();
        }

        return (userId, anonymousId);
    }
}
