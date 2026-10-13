using System.Security.Cryptography;
using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Application.Services;

public class OrderService : IOrderService
{
    private readonly IAppDbContext _context;
    private readonly DbContext _efContext;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IAppDbContext context,
        IInventoryService inventoryService,
        ILogger<OrderService> logger)
    {
        _context = context;
        _efContext = (DbContext)context;
        _inventoryService = inventoryService;
        _logger = logger;
    }

    public async Task<Result<OrderDto>> CheckoutCodAsync(
        Guid? userId,
        string? anonymousId,
        CheckoutCodRequestDto request,
        CancellationToken ct = default)
    {
        // 1. Kiểm tra Idempotency Key: Nếu request đã từng được xử lý với cùng IdempotencyKey
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            var cleanKey = request.IdempotencyKey.Trim();
            var existingOrder = await _context.Orders
                .Include(o => o.Items)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.IdempotencyKey == cleanKey, ct);

            if (existingOrder != null)
            {
                _logger.LogInformation("Idempotent hit: Order {OrderNumber} already created with key {Key}",
                    existingOrder.OrderNumber, cleanKey);
                return Result<OrderDto>.Success(MapToDto(existingOrder), "Đơn hàng đã được ghi nhận trước đó (Idempotent).");
            }
        }

        // 2. Xử lý & Xác thực địa chỉ giao hàng (Lưu SNAPSHOT bất biến)
        string addressSnapshot;
        string recipientPhone;
        string? recipientEmail = null;

        if (request.AddressId.HasValue)
        {
            var address = await _context.Addresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == request.AddressId.Value, ct);

            if (address == null)
            {
                return Result<OrderDto>.Failure("Không tìm thấy địa chỉ được chọn.");
            }

            // Chống IDOR: Người dùng chỉ được chọn địa chỉ thuộc sở hữu của mình
            if (userId.HasValue && address.UserId != userId.Value)
            {
                return Result<OrderDto>.Failure("Bạn không có quyền sử dụng địa chỉ này.");
            }

            recipientPhone = address.PhoneNumber;
            addressSnapshot = JsonSerializer.Serialize(new
            {
                recipientName = address.RecipientName,
                phoneNumber = address.PhoneNumber,
                provinceCode = address.ProvinceCode,
                provinceName = address.ProvinceName,
                districtCode = address.DistrictCode,
                districtName = address.DistrictName,
                wardCode = address.WardCode,
                wardName = address.WardName,
                detailedAddress = address.DetailedAddress,
                fullAddress = $"{address.DetailedAddress}, {address.WardName}, {address.DistrictName}, {address.ProvinceName}"
            });
        }
        else if (request.ShippingAddress != null)
        {
            var addr = request.ShippingAddress;
            if (string.IsNullOrWhiteSpace(addr.RecipientName))
                return Result<OrderDto>.Failure("Vui lòng nhập tên người nhận hàng.");
            if (string.IsNullOrWhiteSpace(addr.PhoneNumber))
                return Result<OrderDto>.Failure("Vui lòng nhập số điện thoại người nhận hàng.");
            if (string.IsNullOrWhiteSpace(addr.ProvinceName) || string.IsNullOrWhiteSpace(addr.DistrictName) || string.IsNullOrWhiteSpace(addr.WardName))
                return Result<OrderDto>.Failure("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã.");
            if (string.IsNullOrWhiteSpace(addr.DetailedAddress))
                return Result<OrderDto>.Failure("Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường).");

            recipientPhone = addr.PhoneNumber.Trim();
            addressSnapshot = JsonSerializer.Serialize(new
            {
                recipientName = addr.RecipientName.Trim(),
                phoneNumber = addr.PhoneNumber.Trim(),
                provinceCode = addr.ProvinceCode,
                provinceName = addr.ProvinceName.Trim(),
                districtCode = addr.DistrictCode,
                districtName = addr.DistrictName.Trim(),
                wardCode = addr.WardCode,
                wardName = addr.WardName.Trim(),
                detailedAddress = addr.DetailedAddress.Trim(),
                fullAddress = $"{addr.DetailedAddress.Trim()}, {addr.WardName.Trim()}, {addr.DistrictName.Trim()}, {addr.ProvinceName.Trim()}"
            });
        }
        else
        {
            return Result<OrderDto>.Failure("Vui lòng cung cấp địa chỉ giao hàng hợp lệ.");
        }

        // Lấy thông tin email người dùng nếu có
        if (userId.HasValue)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
            recipientEmail = user?.Email;
        }

        // 3. Phân giải danh sách món hàng & Tính toán giá hoàn toàn từ DB
        var itemsToOrder = new List<(Guid VariantId, int Quantity)>();

        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0) continue;
                itemsToOrder.Add((item.VariantId, item.Quantity));
            }
        }
        else
        {
            // Lấy từ giỏ hàng hiện tại của user / guest
            var cart = await GetCartAsync(userId, anonymousId, ct);
            if (cart == null || cart.Items.Count == 0)
            {
                return Result<OrderDto>.Failure("Giỏ hàng của bạn đang trống, không thể thanh toán.");
            }

            foreach (var cartItem in cart.Items)
            {
                if (cartItem.Quantity > 0)
                {
                    itemsToOrder.Add((cartItem.VariantId, cartItem.Quantity));
                }
            }
        }

        if (itemsToOrder.Count == 0)
        {
            return Result<OrderDto>.Failure("Không có sản phẩm nào hợp lệ để tạo đơn hàng.");
        }

        // 4. Sinh mã đơn hàng dễ đọc, duy nhất (e.g. MK-20261013-ABC123)
        string orderNumber = GenerateOrderNumber();

        // 5. Mở TRANSACTION: Đảm bảo tạo Order, OrderItems và Giữ kho (Reserve) nguyên tử
        bool isRelational = _efContext.Database.IsRelational();
        await using var tx = isRelational ? await _efContext.Database.BeginTransactionAsync(ct) : null;

        var reservedItemsTracker = new List<(Guid VariantId, int Quantity)>();

        try
        {
            var orderId = Guid.NewGuid();
            var orderItems = new List<OrderItem>();
            decimal subtotalAmount = 0m;

            foreach (var (variantId, quantity) in itemsToOrder)
            {
                // Đọc biến thể từ DB
                var variant = await _context.ProductVariants
                    .Include(v => v.Product)
                    .Include(v => v.Images)
                    .FirstOrDefaultAsync(v => v.Id == variantId, ct);

                if (variant == null)
                {
                    throw new InvalidOperationException("Không tìm thấy một trong các sản phẩm đã chọn.");
                }

                if (!variant.IsActive)
                {
                    throw new InvalidOperationException($"Sản phẩm '{variant.Name}' hiện đã ngừng kinh doanh.");
                }

                // THAO TÁC NGUYÊN TỬ: Giữ tồn kho trước bằng InventoryService
                var reserveResult = await _inventoryService.ReserveAsync(
                    variantId: variant.Id,
                    quantity: quantity,
                    referenceType: "Order",
                    referenceId: orderNumber,
                    reason: $"Giữ hàng cho đơn {orderNumber}",
                    ct: ct
                );

                if (!reserveResult.IsSuccess)
                {
                    // HẾT HÀNG GIỮA CHỪNG: Hủy bỏ toàn bộ transaction, giải phóng các món đã giữ trước đó
                    throw new InvalidOperationException(
                        $"Sản phẩm '{variant.Product?.Name ?? variant.Name} ({variant.Name})' không đủ tồn kho khả dụng để đặt hàng.");
                }

                reservedItemsTracker.Add((variant.Id, quantity));

                // SERVER LUÔN TÍNH GIÁ TỪ DB (Bỏ qua hoàn toàn giá client)
                decimal unitPrice = variant.SalePrice;
                decimal originalPrice = variant.OriginalPrice;
                decimal lineTotal = unitPrice * quantity;
                subtotalAmount += lineTotal;

                string? thumb = variant.Images?.OrderBy(img => img.DisplayOrder).FirstOrDefault()?.ImageUrl
                                ?? variant.Product?.ThumbnailUrl;

                // TẠO SNAPSHOT ĐẦY ĐỦ CHO TỪNG DÒNG HÀNG
                var orderItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    VariantId = variant.Id,
                    ProductId = variant.ProductId,
                    ProductNameSnapshot = variant.Product?.Name ?? variant.Name,
                    VariantNameSnapshot = variant.Name,
                    SkuSnapshot = variant.Sku,
                    UnitPriceSnapshot = unitPrice,
                    OriginalPriceSnapshot = originalPrice,
                    Quantity = quantity,
                    TotalPrice = lineTotal,
                    AttributesSnapshot = variant.Attributes ?? "{}",
                    SpecificationsSnapshot = variant.Product?.Specifications,
                    ThumbnailUrlSnapshot = thumb,
                    CreatedAt = DateTime.UtcNow
                };

                orderItems.Add(orderItem);
            }

            // Tính tổng tiền đơn hàng
            decimal shippingFee = 0m; // Miễn phí giao hàng toàn quốc
            decimal discountAmount = 0m;
            decimal totalAmount = subtotalAmount - discountAmount + shippingFee;

            var order = new Order
            {
                Id = orderId,
                OrderNumber = orderNumber,
                UserId = userId,
                CustomerEmail = recipientEmail,
                CustomerPhone = recipientPhone,
                Status = OrderStatus.Pending,       // Theo docs/order-states.md: COD khởi tạo là Pending (chờ duyệt)
                PaymentStatus = PaymentStatus.Pending, // COD: Chưa thanh toán
                PaymentMethod = PaymentMethod.COD,
                SubtotalAmount = subtotalAmount,
                DiscountAmount = discountAmount,
                ShippingFee = shippingFee,
                TotalAmount = totalAmount,
                ShippingAddressSnapshot = addressSnapshot,
                CustomerNote = request.CustomerNote,
                IdempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? null : request.IdempotencyKey.Trim(),
                CreatedAt = DateTime.UtcNow,
                Items = orderItems
            };

            _context.Orders.Add(order);

            // Dọn dẹp giỏ hàng sau khi đã đặt hàng thành công
            await CleanupOrderedItemsFromCartAsync(userId, anonymousId, itemsToOrder.Select(i => i.VariantId).ToList(), ct);

            await _context.SaveChangesAsync(ct);

            if (tx != null)
            {
                await tx.CommitAsync(ct);
            }

            _logger.LogInformation("Successfully created COD order {OrderNumber} for user {UserId}. Total: {Total:N0}đ",
                orderNumber, userId, totalAmount);

            return Result<OrderDto>.Success(MapToDto(order), "Đặt hàng COD thành công.");
        }
        catch (Exception ex)
        {
            if (tx != null)
            {
                await tx.RollbackAsync(ct);
            }
            else
            {
                // Fallback cho môi trường không có transaction (InMemory): giải phóng thủ công
                foreach (var (vId, q) in reservedItemsTracker)
                {
                    try
                    {
                        await _inventoryService.ReleaseAsync(vId, q, "Order", orderNumber, "Hủy giữ hàng do lỗi tạo đơn", CancellationToken.None);
                    }
                    catch
                    {
                        // ignore secondary release error
                    }
                }
            }

            _logger.LogWarning(ex, "Failed to create COD order {OrderNumber}: {Msg}", orderNumber, ex.Message);
            return Result<OrderDto>.Failure(ex.Message);
        }
    }

    public async Task<Result<OrderDto>> GetOrderByNumberAsync(
        string orderNumber,
        Guid? userId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return Result<OrderDto>.Failure("Mã đơn hàng không hợp lệ.");
        }

        var order = await _context.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim().ToUpper(), ct);

        if (order == null)
        {
            return Result<OrderDto>.Failure("Không tìm thấy đơn hàng.");
        }

        // Chống IDOR: Nếu đơn thuộc user cụ thể, chỉ user đó hoặc admin mới xem được
        if (userId.HasValue && order.UserId.HasValue && order.UserId != userId.Value)
        {
            return Result<OrderDto>.Failure("Bạn không có quyền xem đơn hàng này.");
        }

        return Result<OrderDto>.Success(MapToDto(order));
    }

    public async Task<Result<OrderDto>> GetOrderByIdAsync(
        Guid orderId,
        Guid? userId,
        CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
        {
            return Result<OrderDto>.Failure("Không tìm thấy đơn hàng.");
        }

        if (userId.HasValue && order.UserId.HasValue && order.UserId != userId.Value)
        {
            return Result<OrderDto>.Failure("Bạn không có quyền xem đơn hàng này.");
        }

        return Result<OrderDto>.Success(MapToDto(order));
    }

    public async Task<Result<IReadOnlyList<OrderDto>>> GetMyOrdersAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        var dtos = orders.Select(MapToDto).ToList();
        return Result<IReadOnlyList<OrderDto>>.Success(dtos);
    }

    private static string GenerateOrderNumber()
    {
        // Định dạng mã đơn: MK-yyyyMMdd-XXXXXX (e.g. MK-20261013-9A4B2C)
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Convert.ToHexString(RandomNumberGenerator.GetBytes(3)).ToUpper();
        return $"MK-{datePart}-{randomPart}";
    }

    private async Task<Cart?> GetCartAsync(Guid? userId, string? anonymousId, CancellationToken ct)
    {
        if (userId.HasValue)
        {
            return await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value, ct);
        }

        if (!string.IsNullOrWhiteSpace(anonymousId))
        {
            return await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.AnonymousId == anonymousId.Trim(), ct);
        }

        return null;
    }

    private async Task CleanupOrderedItemsFromCartAsync(
        Guid? userId,
        string? anonymousId,
        List<Guid> orderedVariantIds,
        CancellationToken ct)
    {
        var cart = await GetCartAsync(userId, anonymousId, ct);
        if (cart == null) return;

        var itemsToRemove = cart.Items.Where(i => orderedVariantIds.Contains(i.VariantId)).ToList();
        foreach (var item in itemsToRemove)
        {
            cart.Items.Remove(item);
            _context.CartItems.Remove(item);
        }

        cart.UpdatedAt = DateTime.UtcNow;
    }

    private static OrderDto MapToDto(Order order) =>
        new(
            order.Id,
            order.OrderNumber,
            order.UserId,
            order.CustomerEmail,
            order.CustomerPhone,
            order.Status,
            order.PaymentStatus,
            order.PaymentMethod,
            order.SubtotalAmount,
            order.DiscountAmount,
            order.ShippingFee,
            order.TotalAmount,
            order.ShippingAddressSnapshot,
            order.CustomerNote,
            order.IdempotencyKey,
            order.Items.Select(i => new OrderItemDto(
                i.Id,
                i.VariantId,
                i.ProductId,
                i.ProductNameSnapshot,
                i.VariantNameSnapshot,
                i.SkuSnapshot,
                i.UnitPriceSnapshot,
                i.OriginalPriceSnapshot,
                i.Quantity,
                i.TotalPrice,
                i.AttributesSnapshot,
                i.SpecificationsSnapshot,
                i.ThumbnailUrlSnapshot
            )).ToList(),
            order.CreatedAt
        );
}
