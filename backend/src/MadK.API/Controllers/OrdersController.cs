using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.Interfaces;
using MadK.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IVnpayService _vnpayService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        IOrderService orderService,
        IVnpayService vnpayService,
        ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _vnpayService = vnpayService;
        _logger = logger;
    }

    /// <summary>
    /// Ước tính tạm tính, phí vận chuyển và áp dụng thử mã giảm giá trước khi đặt hàng.
    /// Không trừ tồn kho, không tăng lượt sử dụng coupon.
    /// </summary>
    [HttpPost("checkout/estimate")]
    [ProducesResponseType(typeof(Result<MadK.Application.DTOs.Promotions.CheckoutEstimateResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EstimateCheckout(
        [FromBody] MadK.Application.DTOs.Promotions.CheckoutEstimateRequestDto request,
        [FromHeader(Name = "X-Anonymous-Id")] string? headerAnonymousId,
        CancellationToken ct)
    {
        var (userId, anonymousId) = ResolveUserOrAnonymous(headerAnonymousId);
        var result = await _orderService.EstimateCheckoutAsync(userId, anonymousId, request, ct);
        return Ok(result);
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
    /// Checkout và tạo đơn hàng thanh toán trực tuyến qua VNPay Sandbox:
    /// - Tạo Order ở trạng thái PendingPayment.
    /// - Giữ kho tạm thời (15 phút).
    /// - Tạo bản ghi Payment khởi tạo.
    /// - Trả về URL thanh toán chuyển tiếp sang cổng VNPay.
    /// </summary>
    [HttpPost("checkout/vnpay")]
    [ProducesResponseType(typeof(Result<MadK.Application.DTOs.Payment.CheckoutVnpayResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<MadK.Application.DTOs.Payment.CheckoutVnpayResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckoutVnpay(
        [FromBody] CheckoutCodRequestDto request,
        [FromHeader(Name = "Idempotency-Key")] string? headerIdempotencyKey,
        [FromHeader(Name = "X-Anonymous-Id")] string? headerAnonymousId,
        CancellationToken ct)
    {
        var (userId, anonymousId) = ResolveUserOrAnonymous(headerAnonymousId);

        var effectiveIdempotencyKey = !string.IsNullOrWhiteSpace(headerIdempotencyKey)
            ? headerIdempotencyKey.Trim()
            : request.IdempotencyKey;

        var effectiveRequest = request with { IdempotencyKey = effectiveIdempotencyKey };
        string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var result = await _vnpayService.CheckoutVnpayAsync(userId, anonymousId, effectiveRequest, clientIp, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Kích hoạt quét và hủy các đơn hàng quá hạn thanh toán online.
    /// Giải phóng tồn kho đang giữ. Dùng cho background job, test, hoặc admin trigger.
    /// </summary>
    [HttpPost("process-expired")]
    [ProducesResponseType(typeof(Result<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessExpiredOrders(
        [FromServices] IOrderExpirationService expirationService,
        CancellationToken ct)
    {
        var count = await expirationService.CancelExpiredOrdersAsync(ct);
        return Ok(Result<int>.Success(count, $"Đã xử lý hủy và hoàn kho {count} đơn hàng quá hạn."));
    }


    /// <summary>
    /// Tra cứu chi tiết đơn hàng theo mã đơn (e.g. MK-20261013-XXXXXX).
    /// Chống IDOR: Khách hàng chỉ xem được đơn của mình; Admin/Staff có quyền xem mọi đơn.
    /// </summary>
    [HttpGet("{orderNumber}")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByOrderNumber(
        [FromRoute] string orderNumber,
        CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        bool isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

        var result = await _orderService.GetOrderByNumberAsync(orderNumber, userId, isStaffOrAdmin, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Tra cứu chi tiết đơn hàng theo ID.
    /// Chống IDOR: Khách hàng chỉ xem được đơn của mình; Admin/Staff có quyền xem mọi đơn.
    /// </summary>
    [HttpGet("id/{orderId:guid}")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        [FromRoute] Guid orderId,
        CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        bool isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

        var result = await _orderService.GetOrderByIdAsync(orderId, userId, isStaffOrAdmin, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách lịch sử đơn hàng của người dùng hiện tại (hỗ trợ lọc theo trạng thái).
    /// </summary>
    [Authorize]
    [HttpGet("my-orders")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] OrderStatus? status,
        CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        if (!userId.HasValue)
        {
            return Unauthorized(Result<IReadOnlyList<OrderDto>>.Failure("Vui lòng đăng nhập."));
        }

        var result = await _orderService.GetMyOrdersAsync(userId.Value, status, ct);
        return Ok(result);
    }

    /// <summary>
    /// Khách hàng tự hủy đơn hàng của mình khi đơn còn ở trạng thái cho phép (Pending, Confirmed).
    /// Tự động giải phóng tồn kho đang giữ và ghi nhận lịch sử thay đổi.
    /// </summary>
    [Authorize]
    [HttpPost("{orderNumber}/cancel")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelOrder(
        [FromRoute] string orderNumber,
        [FromBody] CancelOrderRequestDto request,
        CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        if (!userId.HasValue)
        {
            return Unauthorized(Result<OrderDto>.Failure("Vui lòng đăng nhập để thực hiện thao tác này."));
        }

        bool isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");
        var result = await _orderService.CancelOrderAsync(orderNumber, userId, request, isStaffOrAdmin, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Nhân viên / Quản trị viên cập nhật trạng thái đơn hàng tuân thủ State Machine theo docs/order-states.md.
    /// Chuyển trạng thái sai sẽ bị từ chối; hệ thống tự động cập nhật tồn kho (Commit/Restock) tương ứng.
    /// </summary>
    [Authorize(Roles = "Admin,Staff")]
    [HttpPut("{orderNumber}/status")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateOrderStatus(
        [FromRoute] string orderNumber,
        [FromBody] UpdateOrderStatusRequestDto request,
        CancellationToken ct)
    {
        var (userId, _) = ResolveUserOrAnonymous(null);
        var staffName = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? "Nhân viên";

        var result = await _orderService.UpdateOrderStatusAsync(orderNumber, userId, staffName, request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

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
