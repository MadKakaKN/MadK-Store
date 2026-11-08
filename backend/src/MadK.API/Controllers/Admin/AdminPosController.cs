using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MadK.API.Controllers.Admin;

/// <summary>
/// API Phân hệ Bán hàng tại quầy (Point of Sale - POS)
/// Dành cho Nhân viên bán hàng (Sales) và Quản trị viên (Admin).
/// </summary>
[ApiController]
[Route("api/v1/admin/pos")]
[Authorize(Roles = "Admin,SuperAdmin,Sales")]
public class AdminPosController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly AppDbContext _context;
    private readonly IPricingService _pricingService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AdminPosController> _logger;

    public AdminPosController(
        IOrderService orderService,
        AppDbContext context,
        IPricingService pricingService,
        IAuditLogService auditLogService,
        ILogger<AdminPosController> logger)
    {
        _orderService = orderService;
        _context = context;
        _pricingService = pricingService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// Thực hiện thanh toán và chốt hóa đơn trực tiếp tại quầy POS.
    /// </summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> PosCheckout([FromBody] PosCheckoutRequestDto request, CancellationToken ct)
    {
        var staffUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        Guid.TryParse(staffUserIdStr, out var staffUserId);

        var staffName = User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue("fullName")
            ?? User.FindFirstValue("email")
            ?? "Thu ngân";

        var staffEmail = User.FindFirstValue(ClaimTypes.Email) ?? "staff@madk.local";
        var staffRole = User.FindFirstValue(ClaimTypes.Role) ?? "Sales";

        var result = await _orderService.CheckoutPosAsync(
            staffUserId == Guid.Empty ? null : staffUserId,
            staffName,
            request,
            ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        // Ghi Audit Log cho giao dịch bán hàng tại quầy
        _ = _auditLogService.LogAsync(
            action: "POS_CHECKOUT",
            entityName: "Order",
            entityId: result.Data?.Id.ToString(),
            oldValues: null,
            newValues: new { result.Data?.OrderNumber, result.Data?.TotalAmount, request.PaymentMethod },
            userId: staffUserId == Guid.Empty ? null : staffUserId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            note: $"Bán hàng tại quầy POS đơn {result.Data?.OrderNumber} bởi {staffName}. Tổng tiền: {result.Data?.TotalAmount:N0} đ",
            ct: ct);

        return Ok(result);
    }

    /// <summary>
    /// Lấy danh mục sản phẩm và biến thể phục vụ màn hình POS & máy quét Barcode.
    /// </summary>
    [HttpGet("products")]
    public async Task<IActionResult> GetPosProducts(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        CancellationToken ct)
    {
        var query = _context.ProductVariants
            .Include(v => v.Product)
            .Include(v => v.Images)
            .Include(v => v.PriceSchedules)
            .Where(v => v.IsActive && (v.Product == null || v.Product.IsActive))
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(v =>
                v.Sku.ToLower().Contains(cleanSearch) ||
                v.Name.ToLower().Contains(cleanSearch) ||
                (v.Product != null && v.Product.Name.ToLower().Contains(cleanSearch)));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(v => v.Product != null && v.Product.CategoryId == categoryId.Value);
        }

        var now = DateTime.UtcNow;
        var variants = await query
            .OrderByDescending(v => v.UpdatedAt)
            .Take(60)
            .ToListAsync(ct);

        var posProducts = variants.Select(v =>
        {
            var priceResult = _pricingService.CalculateCurrentPrice(v, now);
            var currentPrice = priceResult?.CurrentPrice ?? v.SalePrice;
            var thumb = v.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl
                ?? v.Product?.ThumbnailUrl;

            return new
            {
                variantId = v.Id,
                productId = v.ProductId,
                productName = v.Product?.Name ?? v.Name,
                variantName = v.Name,
                sku = v.Sku,
                stockQuantity = v.StockQuantity,
                originalPrice = v.OriginalPrice,
                salePrice = currentPrice,
                hasDiscount = currentPrice < v.OriginalPrice,
                discountPercent = v.OriginalPrice > 0 ? Math.Round((v.OriginalPrice - currentPrice) / v.OriginalPrice * 100) : 0,
                thumbnailUrl = thumb,
                categoryId = v.Product?.CategoryId
            };
        });

        return Ok(Result<object>.Success(posProducts, "Lấy danh sách sản phẩm POS thành công."));
    }

    /// <summary>
    /// Tìm kiếm khách hàng theo Tên, Số điện thoại hoặc Email để tích điểm thưởng và in hóa đơn.
    /// </summary>
    [HttpGet("customers")]
    public async Task<IActionResult> SearchCustomers([FromQuery] string query, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            return Ok(Result<object>.Success(Array.Empty<object>(), "Nhập ít nhất 2 ký tự để tìm khách hàng."));
        }

        var clean = query.Trim().ToLower();
        var customers = await (from u in _context.Users
                               where u.IsActive && (
                                   (u.PhoneNumber != null && u.PhoneNumber.ToLower().Contains(clean)) ||
                                   u.FullName.ToLower().Contains(clean) ||
                                   u.Email.ToLower().Contains(clean))
                               join l in _context.LoyaltyAccounts on u.Id equals l.UserId into loyaltyJoin
                               from l in loyaltyJoin.DefaultIfEmpty()
                               select new
                               {
                                   id = u.Id,
                                   fullName = u.FullName,
                                   phoneNumber = u.PhoneNumber ?? "",
                                   email = u.Email,
                                   loyaltyTier = l != null ? l.Tier.ToString() : "Bronze",
                                   loyaltyPoints = l != null ? l.CurrentBalance : 0
                               })
                               .Take(10)
                               .ToListAsync(ct);

        return Ok(Result<object>.Success(customers, "Tìm kiếm khách hàng thành công."));
    }
}
