using MadK.Application.Common;
using MadK.Application.DTOs.Cart;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Application.Services;

public class CartService : ICartService
{
    private readonly IAppDbContext _context;
    private readonly ILogger<CartService> _logger;
    private readonly IPricingService? _pricingService;

    public CartService(IAppDbContext context, ILogger<CartService> logger)
        : this(context, logger, null)
    {
    }

    public CartService(IAppDbContext context, ILogger<CartService> logger, IPricingService? pricingService)
    {
        _context = context;
        _logger = logger;
        _pricingService = pricingService;
    }

    public async Task<Result<CartDto>> GetCartAsync(Guid? userId, string? anonymousId, CancellationToken ct = default)
    {
        var cart = await GetCartEntityAsync(userId, anonymousId, createIfNotFound: true, ct);
        if (cart == null)
        {
            return Result<CartDto>.Success(EmptyCart(userId, anonymousId));
        }

        return Result<CartDto>.Success(MapToCartDto(cart));
    }

    public async Task<Result<CartDto>> AddItemAsync(Guid? userId, string? anonymousId, AddToCartRequestDto request, CancellationToken ct = default)
    {
        if (request.Quantity <= 0)
        {
            return Result<CartDto>.Failure("Số lượng mua phải lớn hơn 0.");
        }

        // 1. Kiểm tra biến thể trong DB
        var variant = await _context.ProductVariants
            .Include(v => v.Product)
            .Include(v => v.Images)
            .FirstOrDefaultAsync(v => v.Id == request.VariantId, ct);

        if (variant == null)
        {
            return Result<CartDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        if (!variant.IsActive)
        {
            return Result<CartDto>.Failure("Sản phẩm hiện đã ngừng kinh doanh.");
        }

        // 2. Kiểm tra tồn kho khả dụng
        if (variant.StockQuantity <= 0)
        {
            return Result<CartDto>.Failure($"Sản phẩm '{variant.Name}' hiện đã hết hàng.");
        }

        // 3. Lấy hoặc tạo giỏ hàng
        var cart = await GetCartEntityAsync(userId, anonymousId, createIfNotFound: true, ct);
        if (cart == null)
        {
            return Result<CartDto>.Failure("Không thể khởi tạo giỏ hàng.");
        }

        // 4. Tìm kiếm món hàng đã có sẵn trong giỏ
        var existingItem = cart.Items.FirstOrDefault(i => i.VariantId == request.VariantId);
        int newTotalQuantity = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (newTotalQuantity > variant.StockQuantity)
        {
            return Result<CartDto>.Failure($"Số lượng yêu cầu ({newTotalQuantity}) vượt quá tồn kho khả dụng ({variant.StockQuantity}).");
        }

        if (existingItem != null)
        {
            existingItem.Quantity = newTotalQuantity;
            existingItem.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var newItem = new CartItem
            {
                Id = Guid.NewGuid(),
                CartId = cart.Id,
                VariantId = variant.Id,
                Variant = variant,
                Quantity = request.Quantity,
                CreatedAt = DateTime.UtcNow
            };
            _context.CartItems.Add(newItem);
            if (!cart.Items.Any(i => i.Id == newItem.Id))
            {
                cart.Items.Add(newItem);
            }
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Added variant {VariantId} (qty {Qty}) to cart {CartId}. Server sale price used: {Price:N0}đ (Client price ignored: {ClientPrice})",
            variant.Id, request.Quantity, cart.Id, variant.SalePrice, request.ClientPrice);

        return Result<CartDto>.Success(MapToCartDto(cart), "Đã thêm sản phẩm vào giỏ hàng.");
    }

    public async Task<Result<CartDto>> UpdateItemQuantityAsync(Guid? userId, string? anonymousId, Guid itemId, int quantity, CancellationToken ct = default)
    {
        var cart = await GetCartEntityAsync(userId, anonymousId, createIfNotFound: false, ct);
        if (cart == null)
        {
            return Result<CartDto>.Failure("Không tìm thấy giỏ hàng.");
        }

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
        {
            return Result<CartDto>.Failure("Không tìm thấy sản phẩm trong giỏ hàng.");
        }

        if (quantity <= 0)
        {
            // Xóa món nếu số lượng <= 0
            _context.CartItems.Remove(item);
            cart.Items.Remove(item);
        }
        else
        {
            // Kiểm tra tồn kho khả dụng từ DB
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == item.VariantId, ct);
            if (variant == null)
            {
                return Result<CartDto>.Failure("Không tìm thấy biến thể sản phẩm.");
            }

            if (quantity > variant.StockQuantity)
            {
                return Result<CartDto>.Failure($"Số lượng yêu cầu ({quantity}) vượt quá tồn kho khả dụng ({variant.StockQuantity}).");
            }

            item.Quantity = quantity;
            item.UpdatedAt = DateTime.UtcNow;
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return Result<CartDto>.Success(MapToCartDto(cart), "Cập nhật số lượng thành công.");
    }

    public async Task<Result<CartDto>> RemoveItemAsync(Guid? userId, string? anonymousId, Guid itemId, CancellationToken ct = default)
    {
        var cart = await GetCartEntityAsync(userId, anonymousId, createIfNotFound: false, ct);
        if (cart == null)
        {
            return Result<CartDto>.Failure("Không tìm thấy giỏ hàng.");
        }

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
        {
            return Result<CartDto>.Failure("Không tìm thấy sản phẩm trong giỏ hàng.");
        }

        _context.CartItems.Remove(item);
        cart.Items.Remove(item);
        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return Result<CartDto>.Success(MapToCartDto(cart), "Đã xóa sản phẩm khỏi giỏ hàng.");
    }

    public async Task<Result<CartDto>> ClearCartAsync(Guid? userId, string? anonymousId, CancellationToken ct = default)
    {
        var cart = await GetCartEntityAsync(userId, anonymousId, createIfNotFound: false, ct);
        if (cart == null)
        {
            return Result<CartDto>.Success(EmptyCart(userId, anonymousId));
        }

        _context.CartItems.RemoveRange(cart.Items);
        cart.Items.Clear();
        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return Result<CartDto>.Success(MapToCartDto(cart), "Đã làm trống giỏ hàng.");
    }

    public async Task<Result<CartDto>> MergeCartAsync(Guid userId, MergeCartRequestDto request, CancellationToken ct = default)
    {
        if (userId == Guid.Empty)
        {
            return Result<CartDto>.Failure("Không xác định được phiên người dùng.");
        }

        // Lấy hoặc tạo giỏ hàng DB của tài khoản đăng nhập
        var userCart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .Include(c => c.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Images)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

        if (userCart == null)
        {
            userCart = new Cart
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Carts.Add(userCart);
            await _context.SaveChangesAsync(ct);
        }

        // Danh sách các món guest cần gộp
        var itemsToMerge = new List<MergeCartItemDto>();

        if (request.Items != null && request.Items.Count > 0)
        {
            itemsToMerge.AddRange(request.Items);
        }
        else if (!string.IsNullOrWhiteSpace(request.AnonymousId))
        {
            var guestCart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.AnonymousId == request.AnonymousId, ct);

            if (guestCart != null)
            {
                foreach (var gItem in guestCart.Items)
                {
                    itemsToMerge.Add(new MergeCartItemDto(gItem.VariantId, gItem.Quantity));
                }

                // Xóa giỏ của khách sau khi đã đọc items
                _context.Carts.Remove(guestCart);
            }
        }

        // Thực hiện gộp
        foreach (var mergeItem in itemsToMerge)
        {
            if (mergeItem.Quantity <= 0) continue;

            var variant = await _context.ProductVariants
                .Include(v => v.Product)
                .Include(v => v.Images)
                .FirstOrDefaultAsync(v => v.Id == mergeItem.VariantId, ct);

            if (variant == null || !variant.IsActive) continue;

            var existingItem = userCart.Items.FirstOrDefault(i => i.VariantId == mergeItem.VariantId);
            int combinedQuantity = (existingItem?.Quantity ?? 0) + mergeItem.Quantity;

            // Giới hạn tồn kho khả dụng nếu vượt quá
            if (combinedQuantity > variant.StockQuantity)
            {
                combinedQuantity = Math.Max(1, variant.StockQuantity);
            }

            if (existingItem != null)
            {
                existingItem.Quantity = combinedQuantity;
                existingItem.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newItem = new CartItem
                {
                    Id = Guid.NewGuid(),
                    CartId = userCart.Id,
                    VariantId = variant.Id,
                    Variant = variant,
                    Quantity = combinedQuantity,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CartItems.Add(newItem);
                if (!userCart.Items.Any(i => i.Id == newItem.Id))
                {
                    userCart.Items.Add(newItem);
                }
            }
        }

        userCart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Merged {Count} guest cart items into user {UserId} cart {CartId}",
            itemsToMerge.Count, userId, userCart.Id);

        return Result<CartDto>.Success(MapToCartDto(userCart), "Đã đồng bộ giỏ hàng sau khi đăng nhập.");
    }

    private async Task<Cart?> GetCartEntityAsync(Guid? userId, string? anonymousId, bool createIfNotFound, CancellationToken ct)
    {
        IQueryable<Cart> query = _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .Include(c => c.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Images)
            .Include(c => c.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.PriceSchedules);

        Cart? cart = null;

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            cart = await query.FirstOrDefaultAsync(c => c.UserId == userId.Value, ct);
            if (cart == null && createIfNotFound)
            {
                cart = new Cart
                {
                    Id = Guid.NewGuid(),
                    UserId = userId.Value,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync(ct);
            }
        }
        else if (!string.IsNullOrWhiteSpace(anonymousId))
        {
            var cleanAnonId = anonymousId.Trim();
            cart = await query.FirstOrDefaultAsync(c => c.AnonymousId == cleanAnonId, ct);
            if (cart == null && createIfNotFound)
            {
                cart = new Cart
                {
                    Id = Guid.NewGuid(),
                    AnonymousId = cleanAnonId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync(ct);
            }
        }

        return cart;
    }

    private CartDto MapToCartDto(Cart cart)
    {
        var items = new List<CartItemDto>();
        decimal totalAmount = 0m;
        int totalQuantity = 0;

        foreach (var item in cart.Items.DistinctBy(i => i.Id))
        {
            var variant = item.Variant;
            if (variant == null) continue;

            // SERVER LUÔN TÍNH GIÁ HIỆN HÀNH DÙNG CHUNG TỪ PRICING SERVICE:
            var priceResult = _pricingService?.CalculateCurrentPrice(variant);
            decimal unitPrice = priceResult != null ? priceResult.CurrentPrice : variant.SalePrice;
            decimal origPrice = priceResult != null ? priceResult.OriginalPrice : variant.OriginalPrice;
            decimal lineTotal = unitPrice * item.Quantity;

            string? thumb = variant.Images?.OrderBy(img => img.DisplayOrder).FirstOrDefault()?.ImageUrl
                            ?? variant.Product?.ThumbnailUrl;

            items.Add(new CartItemDto(
                item.Id,
                cart.Id,
                variant.Id,
                variant.ProductId,
                variant.Product?.Name ?? variant.Name,
                variant.Product?.Slug ?? string.Empty,
                variant.Name,
                variant.Sku,
                variant.Attributes,
                origPrice,
                unitPrice,
                item.Quantity,
                lineTotal,
                thumb,
                variant.StockQuantity,
                variant.IsActive
            ));

            totalAmount += lineTotal;
            totalQuantity += item.Quantity;
        }

        return new CartDto(
            cart.Id,
            cart.UserId,
            cart.AnonymousId,
            items,
            totalQuantity,
            totalAmount,
            cart.UpdatedAt
        );
    }

    private static CartDto EmptyCart(Guid? userId, string? anonymousId) =>
        new(Guid.Empty, userId, anonymousId, Array.Empty<CartItemDto>(), 0, 0m, null);
}
