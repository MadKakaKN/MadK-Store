using System.Security.Cryptography;
using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Notifications;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Promotions;
using MadK.Application.DTOs.Shipping;
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
    private readonly IPricingService? _pricingService;
    private readonly ICouponService? _couponService;
    private readonly IShippingFeeService? _shippingFeeService;
    private readonly IEmailSender? _emailSender;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IAppDbContext context,
        IInventoryService inventoryService,
        ILogger<OrderService> logger)
        : this(context, inventoryService, null, null, null, null, logger)
    {
    }

    public OrderService(
        IAppDbContext context,
        IInventoryService inventoryService,
        IPricingService? pricingService,
        ILogger<OrderService> logger)
        : this(context, inventoryService, pricingService, null, null, null, logger)
    {
    }

    public OrderService(
        IAppDbContext context,
        IInventoryService inventoryService,
        IPricingService? pricingService,
        ICouponService? couponService,
        IShippingFeeService? shippingFeeService,
        ILogger<OrderService> logger)
        : this(context, inventoryService, pricingService, couponService, shippingFeeService, null, logger)
    {
    }

    public OrderService(
        IAppDbContext context,
        IInventoryService inventoryService,
        IPricingService? pricingService,
        ICouponService? couponService,
        IShippingFeeService? shippingFeeService,
        IEmailSender? emailSender,
        ILogger<OrderService> logger)
    {
        _context = context;
        _efContext = (DbContext)context;
        _inventoryService = inventoryService;
        _pricingService = pricingService;
        _couponService = couponService;
        _shippingFeeService = shippingFeeService;
        _emailSender = emailSender;
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
                .Include(o => o.StatusHistories)
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
        string recipientName = "Khách hàng";
        string? recipientEmail = !string.IsNullOrWhiteSpace(request.CustomerEmail) ? request.CustomerEmail.Trim() : null;
        string? provinceName = null;
        string? districtName = null;
        string? wardName = null;
        string fullAddressDisplay = "";

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

            recipientName = address.RecipientName;
            recipientPhone = address.PhoneNumber;
            provinceName = address.ProvinceName;
            districtName = address.DistrictName;
            wardName = address.WardName;
            fullAddressDisplay = $"{address.DetailedAddress}, {address.WardName}, {address.DistrictName}, {address.ProvinceName}";
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
                fullAddress = fullAddressDisplay
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

            recipientName = addr.RecipientName.Trim();
            recipientPhone = addr.PhoneNumber.Trim();
            provinceName = addr.ProvinceName.Trim();
            districtName = addr.DistrictName.Trim();
            wardName = addr.WardName.Trim();
            if (string.IsNullOrWhiteSpace(recipientEmail) && !string.IsNullOrWhiteSpace(addr.Email))
            {
                recipientEmail = addr.Email.Trim();
            }
            fullAddressDisplay = $"{addr.DetailedAddress.Trim()}, {addr.WardName.Trim()}, {addr.DistrictName.Trim()}, {addr.ProvinceName.Trim()}";
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
                fullAddress = fullAddressDisplay
            });
        }
        else
        {
            return Result<OrderDto>.Failure("Vui lòng cung cấp địa chỉ giao hàng hợp lệ.");
        }

        // Lấy thông tin email người dùng nếu có
        if (string.IsNullOrWhiteSpace(recipientEmail) && userId.HasValue)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
            recipientEmail = user?.Email;
            if (recipientName == "Khách hàng" && !string.IsNullOrWhiteSpace(user?.FullName))
            {
                recipientName = user.FullName;
            }
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

        // 5. Mở TRANSACTION: Đảm bảo tạo Order, OrderItems, OrderStatusHistory và Giữ kho (Reserve) nguyên tử
        // Hỗ trợ NpgsqlRetryingExecutionStrategy qua CreateExecutionStrategy
        var strategy = _efContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            bool isRelational = _efContext.Database.IsRelational();
            await using var tx = isRelational ? await _efContext.Database.BeginTransactionAsync(ct) : null;
            var reservedItemsTracker = new List<(Guid VariantId, int Quantity)>();

            try
            {
                var orderId = Guid.NewGuid();
                var orderItems = new List<OrderItem>();
                decimal subtotalAmount = 0m;
                DateTime now = DateTime.UtcNow;

                foreach (var (variantId, quantity) in itemsToOrder)
                {
                    // Đọc biến thể từ DB kèm cấu hình giá
                    var variant = await _context.ProductVariants
                        .Include(v => v.Product)
                        .Include(v => v.Images)
                        .Include(v => v.PriceSchedules)
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

                    // SERVER LUÔN TÍNH GIÁ HIỆN HÀNH DÙNG CHUNG TỪ PRICING SERVICE (Bỏ qua hoàn toàn giá client):
                    var priceResult = _pricingService?.CalculateCurrentPrice(variant, now);
                    decimal unitPrice = priceResult != null ? priceResult.CurrentPrice : variant.SalePrice;
                    decimal originalPrice = priceResult != null ? priceResult.OriginalPrice : variant.OriginalPrice;
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
                        CreatedAt = now
                    };

                    orderItems.Add(orderItem);
                }

                // Tính phí vận chuyển qua IShippingFeeService
                decimal shippingFee = 0m;
                if (_shippingFeeService != null)
                {
                    int totalQuantity = itemsToOrder.Sum(i => i.Quantity);
                    var shippingCalc = await _shippingFeeService.CalculateShippingFeeAsync(
                        new ShippingCalculationRequestDto(
                            ProvinceName: provinceName,
                            DistrictName: districtName,
                            WardName: wardName,
                            SubtotalAmount: subtotalAmount,
                            TotalQuantity: totalQuantity
                        ), ct);
                    if (shippingCalc.IsSuccess)
                    {
                        shippingFee = shippingCalc.Data.ShippingFee;
                    }
                }

                // Xử lý áp dụng mã coupon nếu có
                decimal discountAmount = 0m;
                string? couponSnapshot = null;
                if (!string.IsNullOrWhiteSpace(request.CouponCode))
                {
                    if (_couponService == null)
                    {
                        throw new InvalidOperationException("Hệ thống khuyến mãi tạm thời không khả dụng.");
                    }

                    var claimResult = await _couponService.ClaimAndIncrementUsageAsync(request.CouponCode, subtotalAmount, ct);
                    if (!claimResult.IsSuccess)
                    {
                        throw new InvalidOperationException(claimResult.Error ?? claimResult.Message ?? "Mã giảm giá không hợp lệ hoặc không đủ điều kiện.");
                    }

                    var claimedCoupon = claimResult.Data.Coupon;
                    discountAmount = claimResult.Data.DiscountAmount;
                    couponSnapshot = JsonSerializer.Serialize(new
                    {
                        couponId = claimedCoupon.Id,
                        code = claimedCoupon.Code,
                        discountType = claimedCoupon.DiscountType.ToString(),
                        discountValue = claimedCoupon.DiscountValue,
                        discountAmount = discountAmount,
                        maxDiscountAmount = claimedCoupon.MaxDiscountAmount,
                        minOrderAmount = claimedCoupon.MinOrderAmount
                    });
                }

                decimal totalAmount = Math.Max(0m, subtotalAmount - discountAmount + shippingFee);

                var initialHistory = new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    FromStatus = null,
                    ToStatus = OrderStatus.Pending,
                    ChangedByUserId = userId,
                    ChangedByName = userId.HasValue ? "Khách hàng" : "Khách vãng lai",
                    Reason = "Khởi tạo đơn hàng COD",
                    CreatedAt = now
                };

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
                    CouponSnapshot = couponSnapshot,
                    TotalAmount = totalAmount,
                    ShippingAddressSnapshot = addressSnapshot,
                    CustomerNote = request.CustomerNote,
                    IdempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? null : request.IdempotencyKey.Trim(),
                    CreatedAt = now,
                    Items = orderItems,
                    StatusHistories = new List<OrderStatusHistory> { initialHistory }
                };

                _context.Orders.Add(order);

                // Dọn dẹp giỏ hàng sau khi đã đặt hàng thành công
                await CleanupOrderedItemsFromCartAsync(userId, anonymousId, itemsToOrder.Select(i => i.VariantId).ToList(), ct);

                await _context.SaveChangesAsync(ct);

                if (tx != null)
                {
                    await tx.CommitAsync(ct);
                }

                _logger.LogInformation("Successfully created COD order {OrderNumber} for user {UserId}. Subtotal: {Subtotal:N0}đ, Shipping: {Shipping:N0}đ, Discount: {Discount:N0}đ, Total: {Total:N0}đ",
                    orderNumber, userId, subtotalAmount, shippingFee, discountAmount, totalAmount);

                // Gửi email xác nhận đặt hàng qua hàng đợi (non-blocking, lỗi gửi không làm hỏng đơn)
                if (_emailSender != null && !string.IsNullOrWhiteSpace(recipientEmail))
                {
                    try
                    {
                        var emailItems = order.Items.Select(oi => new OrderItemEmailDto(
                            oi.ProductNameSnapshot,
                            oi.VariantNameSnapshot,
                            oi.SkuSnapshot,
                            oi.Quantity,
                            oi.UnitPriceSnapshot,
                            oi.TotalPrice,
                            oi.ThumbnailUrlSnapshot
                        )).ToList();

                        var confirmDto = new OrderConfirmationEmailDto(
                            OrderNumber: order.OrderNumber,
                            RecipientEmail: recipientEmail,
                            RecipientName: recipientName,
                            RecipientPhone: recipientPhone,
                            ShippingAddress: fullAddressDisplay,
                            PaymentMethod: "Thanh toán khi nhận hàng (COD)",
                            SubtotalAmount: subtotalAmount,
                            ShippingFee: shippingFee,
                            DiscountAmount: discountAmount,
                            TotalAmount: totalAmount,
                            CouponCode: request.CouponCode,
                            CustomerNote: request.CustomerNote,
                            CreatedAt: now,
                            Items: emailItems
                        );

                        await _emailSender.SendOrderConfirmationAsync(confirmDto, ct);
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(emailEx, "Lỗi khi đưa email xác nhận đơn {OrderNumber} vào hàng đợi", orderNumber);
                    }
                }

                return Result<OrderDto>.Success(MapToDto(order), "Đặt hàng COD thành công.");
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (tx != null)
                {
                    await tx.RollbackAsync(ct);
                }
                else
                {
                    foreach (var (vId, q) in reservedItemsTracker)
                    {
                        try
                        {
                            await _inventoryService.ReleaseAsync(vId, q, "Order", orderNumber, "Hủy giữ hàng do xung đột số lượng coupon", CancellationToken.None);
                        }
                        catch { }
                    }
                }

                _logger.LogWarning(ex, "Concurrency conflict during order creation {OrderNumber}", orderNumber);
                return Result<OrderDto>.Failure("Mã giảm giá đã hết lượt sử dụng do có nhiều người cùng đặt hàng. Vui lòng thử lại với mã khác.");
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
        });
    }

    public async Task<Result<CheckoutEstimateResponseDto>> EstimateCheckoutAsync(
        Guid? userId,
        string? anonymousId,
        CheckoutEstimateRequestDto request,
        CancellationToken ct = default)
    {
        // 1. Lấy thông tin địa chỉ nếu có
        string? provinceName = null;
        string? districtName = null;
        string? wardName = null;

        if (request.AddressId.HasValue)
        {
            var address = await _context.Addresses.AsNoTracking().FirstOrDefaultAsync(a => a.Id == request.AddressId.Value, ct);
            if (address != null)
            {
                provinceName = address.ProvinceName;
                districtName = address.DistrictName;
                wardName = address.WardName;
            }
        }
        else if (request.ShippingAddress != null)
        {
            provinceName = request.ShippingAddress.ProvinceName?.Trim();
            districtName = request.ShippingAddress.DistrictName?.Trim();
            wardName = request.ShippingAddress.WardName?.Trim();
        }

        // 2. Lấy danh sách món hàng & tính subtotal
        var itemsToEstimate = new List<(Guid VariantId, int Quantity)>();
        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                if (item.Quantity > 0) itemsToEstimate.Add((item.VariantId, item.Quantity));
            }
        }
        else
        {
            var cart = await GetCartAsync(userId, anonymousId, ct);
            if (cart != null && cart.Items.Count > 0)
            {
                foreach (var cartItem in cart.Items)
                {
                    if (cartItem.Quantity > 0) itemsToEstimate.Add((cartItem.VariantId, cartItem.Quantity));
                }
            }
        }

        decimal subtotalAmount = 0m;
        int totalQuantity = 0;
        DateTime now = DateTime.UtcNow;

        foreach (var (variantId, quantity) in itemsToEstimate)
        {
            var variant = await _context.ProductVariants
                .Include(v => v.PriceSchedules)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == variantId, ct);

            if (variant != null && variant.IsActive)
            {
                var priceResult = _pricingService?.CalculateCurrentPrice(variant, now);
                decimal unitPrice = priceResult != null ? priceResult.CurrentPrice : variant.SalePrice;
                subtotalAmount += unitPrice * quantity;
                totalQuantity += quantity;
            }
        }

        // 3. Tính phí vận chuyển
        decimal shippingFee = 0m;
        string carrierName = "MadK Express";
        string estimatedDelivery = "1 - 3 ngày làm việc";
        bool isFreeShipping = false;

        if (_shippingFeeService != null)
        {
            var shippingCalc = await _shippingFeeService.CalculateShippingFeeAsync(
                new ShippingCalculationRequestDto(
                    ProvinceName: provinceName,
                    DistrictName: districtName,
                    WardName: wardName,
                    SubtotalAmount: subtotalAmount,
                    TotalQuantity: Math.Max(1, totalQuantity)
                ), ct);

            if (shippingCalc.IsSuccess)
            {
                shippingFee = shippingCalc.Data.ShippingFee;
                carrierName = shippingCalc.Data.CarrierName;
                estimatedDelivery = shippingCalc.Data.EstimatedDelivery;
                isFreeShipping = shippingCalc.Data.IsFreeShipping;
            }
        }

        // 4. Áp dụng mã giảm giá
        decimal discountAmount = 0m;
        bool isCouponValid = false;
        string? couponCode = null;
        string? couponDesc = null;
        string? couponError = null;

        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            couponCode = request.CouponCode.Trim().ToUpperInvariant();
            if (_couponService != null)
            {
                var couponCalc = await _couponService.ValidateAndCalculateDiscountAsync(couponCode, subtotalAmount, ct);
                if (couponCalc.IsSuccess)
                {
                    isCouponValid = true;
                    discountAmount = couponCalc.Data.DiscountAmount;
                    couponDesc = couponCalc.Data.Description;
                }
                else
                {
                    isCouponValid = false;
                    couponError = couponCalc.Error ?? couponCalc.Message;
                }
            }
            else
            {
                couponError = "Hệ thống khuyến mãi chưa sẵn sàng.";
            }
        }

        decimal totalAmount = Math.Max(0m, subtotalAmount - discountAmount + shippingFee);

        var response = new CheckoutEstimateResponseDto(
            SubtotalAmount: subtotalAmount,
            ShippingFee: shippingFee,
            CarrierName: carrierName,
            EstimatedDelivery: estimatedDelivery,
            IsFreeShipping: isFreeShipping,
            DiscountAmount: discountAmount,
            CouponCode: couponCode,
            CouponDescription: couponDesc,
            TotalAmount: totalAmount,
            IsCouponValid: isCouponValid,
            CouponErrorMessage: couponError
        );

        return Result<CheckoutEstimateResponseDto>.Success(response);
    }

    public async Task<Result<OrderDto>> GetOrderByNumberAsync(
        string orderNumber,
        Guid? userId,
        bool isStaffOrAdmin = false,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return Result<OrderDto>.Failure("Mã đơn hàng không hợp lệ.");
        }

        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim().ToUpper(), ct);

        if (order == null)
        {
            return Result<OrderDto>.Failure("Không tìm thấy đơn hàng.");
        }

        // Chống IDOR: Nếu đơn thuộc user cụ thể, chỉ user đó hoặc admin/staff mới xem được
        if (order.UserId.HasValue && !isStaffOrAdmin)
        {
            if (!userId.HasValue || order.UserId.Value != userId.Value)
            {
                return Result<OrderDto>.Failure("Bạn không có quyền xem đơn hàng này.");
            }
        }

        return Result<OrderDto>.Success(MapToDto(order));
    }

    public async Task<Result<OrderDto>> GetOrderByIdAsync(
        Guid orderId,
        Guid? userId,
        bool isStaffOrAdmin = false,
        CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
        {
            return Result<OrderDto>.Failure("Không tìm thấy đơn hàng.");
        }

        // Chống IDOR
        if (order.UserId.HasValue && !isStaffOrAdmin)
        {
            if (!userId.HasValue || order.UserId.Value != userId.Value)
            {
                return Result<OrderDto>.Failure("Bạn không có quyền xem đơn hàng này.");
            }
        }

        return Result<OrderDto>.Success(MapToDto(order));
    }

    public async Task<Result<IReadOnlyList<OrderDto>>> GetMyOrdersAsync(
        Guid userId,
        OrderStatus? filterStatus = null,
        CancellationToken ct = default)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .AsNoTracking()
            .Where(o => o.UserId == userId);

        if (filterStatus.HasValue)
        {
            query = query.Where(o => o.Status == filterStatus.Value);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        var dtos = orders.Select(MapToDto).ToList();
        return Result<IReadOnlyList<OrderDto>>.Success(dtos);
    }

    public async Task<Result<OrderDto>> CancelOrderAsync(
        string orderNumber,
        Guid? userId,
        CancelOrderRequestDto request,
        bool isStaffOrAdmin = false,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return Result<OrderDto>.Failure("Mã đơn hàng không hợp lệ.");

        if (string.IsNullOrWhiteSpace(request?.Reason))
            return Result<OrderDto>.Failure("Vui lòng cung cấp lý do hủy đơn hàng.");

        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim().ToUpper(), ct);

        if (order == null)
            return Result<OrderDto>.Failure("Không tìm thấy đơn hàng.");

        // Chống IDOR: Khách hàng chỉ được hủy đơn của chính mình
        if (!isStaffOrAdmin)
        {
            if (!userId.HasValue || !order.UserId.HasValue || order.UserId.Value != userId.Value)
            {
                return Result<OrderDto>.Failure("Bạn không có quyền hủy đơn hàng này.");
            }

            // Theo docs/order-states.md: Khách chỉ được hủy khi Pending / Confirmed / PendingPayment
            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed && order.Status != OrderStatus.PendingPayment)
            {
                return Result<OrderDto>.Failure($"Không thể hủy đơn hàng ở trạng thái '{order.Status}'. Đơn hàng đã bắt đầu đóng gói hoặc vận chuyển.");
            }
        }
        else
        {
            if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Completed || order.Status == OrderStatus.Returned)
            {
                return Result<OrderDto>.Failure($"Không thể hủy đơn hàng đã ở trạng thái kết thúc '{order.Status}'.");
            }
        }

        bool isRelational = _efContext.Database.IsRelational();
        await using var tx = isRelational ? await _efContext.Database.BeginTransactionAsync(ct) : null;

        try
        {
            var oldStatus = order.Status;
            var now = DateTime.UtcNow;

            // Tác động kho khi hủy đơn theo docs/order-states.md:
            if (oldStatus == OrderStatus.Pending || oldStatus == OrderStatus.Confirmed || oldStatus == OrderStatus.Processing || oldStatus == OrderStatus.PendingPayment)
            {
                // Giải phóng tồn kho đang giữ
                foreach (var item in order.Items)
                {
                    if (item.VariantId.HasValue && item.Quantity > 0)
                    {
                        var releaseRes = await _inventoryService.ReleaseAsync(
                            item.VariantId.Value,
                            item.Quantity,
                            "Order",
                            order.OrderNumber,
                            $"Giải phóng kho do hủy đơn ({request.Reason.Trim()})",
                            ct);

                        if (!releaseRes.IsSuccess)
                        {
                            _logger.LogWarning("Release stock returned warning for variant {VariantId}: {Err}", item.VariantId, releaseRes.Error);
                        }
                    }
                }
            }
            else if (oldStatus == OrderStatus.Shipping)
            {
                // Giao hàng thất bại / khách từ chối nhận: Chuyển hoàn và nhập lại kho (OnHand)
                foreach (var item in order.Items)
                {
                    if (item.VariantId.HasValue && item.Quantity > 0)
                    {
                        await _inventoryService.RestockAsync(
                            item.VariantId.Value,
                            item.Quantity,
                            $"Nhập kho do chuyển hoàn/hủy đơn {order.OrderNumber}",
                            ct);
                    }
                }
            }

            // Nếu đơn đã thanh toán (VNPay): Tự động kích hoạt hoàn tiền theo docs/order-states.md mục 5.2
            if (order.PaymentStatus == PaymentStatus.Paid)
            {
                var refundKey = $"REFUND_CANCEL_{order.Id}_{now.Ticks % 1000000}";
                var refundTxnNo = $"REF_{Guid.NewGuid().ToString("N")[..10].ToUpper()}";

                var refundPayment = new Payment
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    TxnRef = refundKey,
                    TransactionNo = refundTxnNo,
                    Amount = order.TotalAmount,
                    Currency = "VND",
                    PaymentMethod = order.PaymentMethod,
                    Status = PaymentStatus.Refunded,
                    OrderInfo = $"Hoan tien huy don hang {order.OrderNumber}: {request.Reason.Trim()}",
                    ResponseCode = "00",
                    TransactionStatus = "00",
                    RawPayload = JsonSerializer.Serialize(new
                    {
                        type = "CANCEL_ORDER_REFUND",
                        orderNumber = order.OrderNumber,
                        refundAmount = order.TotalAmount,
                        cancelledByUserId = userId,
                        isStaffOrAdmin,
                        reason = request.Reason.Trim(),
                        cancelledAt = now
                    }),
                    PaymentTime = now,
                    CreatedAt = now
                };

                _context.Payments.Add(refundPayment);
                order.PaymentStatus = PaymentStatus.Refunded;
            }

            order.Status = OrderStatus.Cancelled;
            order.CancelReason = request.Reason.Trim();
            order.CancelledAt = now;
            order.UpdatedAt = now;

            var history = new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Cancelled,
                ChangedByUserId = userId,
                ChangedByName = isStaffOrAdmin ? "Nhân viên / Quản trị viên" : "Khách hàng",
                Reason = request.Reason.Trim(),
                CreatedAt = now
            };

            _context.OrderStatusHistories.Add(history);
            order.StatusHistories.Add(history);

            await _context.SaveChangesAsync(ct);

            if (tx != null)
            {
                await tx.CommitAsync(ct);
            }

            _logger.LogInformation("Order {OrderNumber} cancelled successfully by {Actor}. Reason: {Reason}",
                order.OrderNumber, history.ChangedByName, request.Reason);

            if (_emailSender != null && !string.IsNullOrWhiteSpace(order.CustomerEmail))
            {
                try
                {
                    string custName = "Quý khách";
                    try
                    {
                        if (!string.IsNullOrWhiteSpace(order.ShippingAddressSnapshot))
                        {
                            using var doc = JsonDocument.Parse(order.ShippingAddressSnapshot);
                            if (doc.RootElement.TryGetProperty("recipientName", out var np))
                                custName = np.GetString() ?? custName;
                        }
                    }
                    catch { }

                    var cancelDto = new OrderStatusChangedEmailDto(
                        OrderNumber: order.OrderNumber,
                        RecipientEmail: order.CustomerEmail,
                        RecipientName: custName,
                        OldStatus: oldStatus.ToString(),
                        NewStatus: OrderStatus.Cancelled.ToString(),
                        Reason: request.Reason.Trim(),
                        Note: null,
                        ChangedAt: now,
                        TotalAmount: order.TotalAmount
                    );

                    await _emailSender.SendOrderStatusChangedAsync(cancelDto, ct);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Lỗi khi gửi email thông báo hủy đơn {OrderNumber}", order.OrderNumber);
                }
            }

            return Result<OrderDto>.Success(MapToDto(order), "Hủy đơn hàng thành công và đã hoàn kho.");
        }
        catch (Exception ex)
        {
            if (tx != null) await tx.RollbackAsync(ct);
            _logger.LogError(ex, "Error cancelling order {OrderNumber}", order.OrderNumber);
            return Result<OrderDto>.Failure("Lỗi khi hủy đơn hàng: " + ex.Message);
        }
    }

    public async Task<Result<OrderDto>> UpdateOrderStatusAsync(
        string orderNumber,
        Guid? staffUserId,
        string staffName,
        UpdateOrderStatusRequestDto request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return Result<OrderDto>.Failure("Mã đơn hàng không hợp lệ.");

        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim().ToUpper(), ct);

        if (order == null)
            return Result<OrderDto>.Failure("Không tìm thấy đơn hàng.");

        var currentStatus = order.Status;
        var targetStatus = request.NewStatus;

        // KIỂM TRA STATE MACHINE: Chuyển trạng thái sai bị từ chối!
        if (!IsValidTransition(currentStatus, targetStatus))
        {
            return Result<OrderDto>.Failure(
                $"Chuyển trạng thái từ '{currentStatus}' sang '{targetStatus}' không hợp lệ theo quy tắc vòng đời đơn hàng.");
        }

        // Nếu chuyển sang Cancelled thì gọi logic hủy
        if (targetStatus == OrderStatus.Cancelled)
        {
            return await CancelOrderAsync(
                orderNumber,
                staffUserId,
                new CancelOrderRequestDto(request.Reason ?? "Nhân viên hủy đơn hàng"),
                isStaffOrAdmin: true,
                ct);
        }

        bool isRelational = _efContext.Database.IsRelational();
        await using var tx = isRelational ? await _efContext.Database.BeginTransactionAsync(ct) : null;

        try
        {
            var now = DateTime.UtcNow;

            // TÁC ĐỘNG TỒN KHO THEO QUY TẮC STATE MACHINE:
            if (currentStatus == OrderStatus.Processing && targetStatus == OrderStatus.Shipping)
            {
                // Bàn giao ĐVVC: Trừ tồn thực tế (OnHand), trừ tồn đang giữ (Reserved), ghi StockMovement OutboundOrder
                foreach (var item in order.Items)
                {
                    if (item.VariantId.HasValue && item.Quantity > 0)
                    {
                        var commitRes = await _inventoryService.CommitAsync(
                            item.VariantId.Value,
                            item.Quantity,
                            "Order",
                            order.OrderNumber,
                            $"Xuất kho bàn giao vận chuyển cho đơn {order.OrderNumber}",
                            ct);

                        if (!commitRes.IsSuccess)
                        {
                            throw new InvalidOperationException($"Không thể xuất kho cho sản phẩm '{item.ProductNameSnapshot}': {commitRes.Error}");
                        }
                    }
                }
            }
            else if (currentStatus == OrderStatus.Shipping && targetStatus == OrderStatus.Completed)
            {
                // Giao hàng thành công: Nếu là COD thì đánh dấu đã thanh toán
                if (order.PaymentMethod == PaymentMethod.COD)
                {
                    order.PaymentStatus = PaymentStatus.Paid;
                }
            }
            else if (currentStatus == OrderStatus.ReturnRequested && targetStatus == OrderStatus.Returned)
            {
                // Đổi trả duyệt & kho nhận lại hàng: Nhập lại kho thực tế (+OnHand)
                foreach (var item in order.Items)
                {
                    if (item.VariantId.HasValue && item.Quantity > 0)
                    {
                        await _inventoryService.RestockAsync(
                            item.VariantId.Value,
                            item.Quantity,
                            $"Nhập lại kho do đổi trả đơn {order.OrderNumber}",
                            ct);
                    }
                }

                order.PaymentStatus = PaymentStatus.Refunded;
            }

            order.Status = targetStatus;
            order.UpdatedAt = now;

            var history = new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                FromStatus = currentStatus,
                ToStatus = targetStatus,
                ChangedByUserId = staffUserId,
                ChangedByName = string.IsNullOrWhiteSpace(staffName) ? "Nhân viên" : staffName,
                Reason = request.Reason,
                Note = request.Note,
                CreatedAt = now
            };

            _context.OrderStatusHistories.Add(history);
            order.StatusHistories.Add(history);

            await _context.SaveChangesAsync(ct);

            if (tx != null)
            {
                await tx.CommitAsync(ct);
            }

            _logger.LogInformation("Order {OrderNumber} transitioned from {From} to {To} by {Actor}",
                order.OrderNumber, currentStatus, targetStatus, history.ChangedByName);

            if (_emailSender != null && !string.IsNullOrWhiteSpace(order.CustomerEmail))
            {
                try
                {
                    string custName = "Quý khách";
                    try
                    {
                        if (!string.IsNullOrWhiteSpace(order.ShippingAddressSnapshot))
                        {
                            using var doc = JsonDocument.Parse(order.ShippingAddressSnapshot);
                            if (doc.RootElement.TryGetProperty("recipientName", out var np))
                                custName = np.GetString() ?? custName;
                        }
                    }
                    catch { }

                    var statusDto = new OrderStatusChangedEmailDto(
                        OrderNumber: order.OrderNumber,
                        RecipientEmail: order.CustomerEmail,
                        RecipientName: custName,
                        OldStatus: currentStatus.ToString(),
                        NewStatus: targetStatus.ToString(),
                        Reason: request.Reason,
                        Note: request.Note,
                        ChangedAt: now,
                        TotalAmount: order.TotalAmount
                    );

                    await _emailSender.SendOrderStatusChangedAsync(statusDto, ct);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Lỗi khi gửi email cập nhật trạng thái đơn {OrderNumber}", order.OrderNumber);
                }
            }

            return Result<OrderDto>.Success(MapToDto(order), $"Chuyển trạng thái đơn hàng sang '{targetStatus}' thành công.");
        }
        catch (Exception ex)
        {
            if (tx != null) await tx.RollbackAsync(ct);
            _logger.LogError(ex, "Error updating status for order {OrderNumber}", order.OrderNumber);
            return Result<OrderDto>.Failure("Lỗi khi cập nhật trạng thái đơn: " + ex.Message);
        }
    }

    /// <summary>
    /// Ma trận kiểm tra tính hợp lệ của việc chuyển trạng thái theo docs/order-states.md.
    /// </summary>
    public static bool IsValidTransition(OrderStatus current, OrderStatus target)
    {
        return (current, target) switch
        {
            // PendingPayment (Online VNPay)
            (OrderStatus.PendingPayment, OrderStatus.Pending) => true,
            (OrderStatus.PendingPayment, OrderStatus.Cancelled) => true,

            // Pending (COD khởi tạo / Online đã thanh toán)
            (OrderStatus.Pending, OrderStatus.Confirmed) => true,
            (OrderStatus.Pending, OrderStatus.Cancelled) => true,

            // Confirmed
            (OrderStatus.Confirmed, OrderStatus.Processing) => true,
            (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,

            // Processing
            (OrderStatus.Processing, OrderStatus.Shipping) => true,
            (OrderStatus.Processing, OrderStatus.Cancelled) => true,

            // Shipping
            (OrderStatus.Shipping, OrderStatus.Completed) => true,
            (OrderStatus.Shipping, OrderStatus.Cancelled) => true,

            // Completed
            (OrderStatus.Completed, OrderStatus.ReturnRequested) => true,

            // ReturnRequested
            (OrderStatus.ReturnRequested, OrderStatus.Returned) => true,
            (OrderStatus.ReturnRequested, OrderStatus.Completed) => true, // Từ chối đổi trả

            _ => false
        };
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
            order.AdminNote,
            order.CancelReason,
            order.CancelledAt,
            order.IdempotencyKey,
            (order.Items ?? Array.Empty<OrderItem>()).Select(i => new OrderItemDto(
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
            (order.StatusHistories ?? Array.Empty<OrderStatusHistory>())
                .DistinctBy(h => h.Id)
                .OrderBy(h => h.CreatedAt)
                .Select(h => new OrderStatusHistoryDto(
                    h.Id,
                    h.OrderId,
                    h.FromStatus,
                    h.ToStatus,
                    h.ChangedByUserId,
                    h.ChangedByName,
                    h.Reason,
                    h.Note,
                    h.CreatedAt
                )).ToList(),
            order.CreatedAt,
            order.ExpiresAt,
            order.CouponSnapshot
        );

    public async Task<Result<OrderDto>> UpdateOrderNoteAsync(
        string orderNumber,
        string adminNote,
        Guid? staffUserId,
        string staffName,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return Result<OrderDto>.Failure("Mã đơn hàng không hợp lệ.");

        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim().ToUpper(), ct);

        if (order == null)
            return Result<OrderDto>.Failure("Không tìm thấy đơn hàng.");

        var cleanNote = adminNote?.Trim() ?? string.Empty;
        order.AdminNote = cleanNote;
        order.UpdatedAt = DateTime.UtcNow;

        var history = new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            FromStatus = order.Status,
            ToStatus = order.Status,
            ChangedByUserId = staffUserId,
            ChangedByName = string.IsNullOrWhiteSpace(staffName) ? "Nhân viên" : staffName,
            Reason = "Cập nhật ghi chú nội bộ",
            Note = cleanNote,
            CreatedAt = DateTime.UtcNow
        };

        _context.OrderStatusHistories.Add(history);
        order.StatusHistories.Add(history);

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Order {OrderNumber} admin note updated by {StaffName}", order.OrderNumber, staffName);

        return Result<OrderDto>.Success(MapToDto(order), "Cập nhật ghi chú nội bộ thành công.");
    }

    public async Task<Result<PagedResult<OrderDto>>> GetAllOrdersAsync(
        int page = 1,
        int pageSize = 20,
        OrderStatus? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken ct = default)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt <= toDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(s) ||
                (o.CustomerEmail != null && o.CustomerEmail.ToLower().Contains(s)) ||
                (o.CustomerPhone != null && o.CustomerPhone.Contains(s)) ||
                (o.ShippingAddressSnapshot != null && o.ShippingAddressSnapshot.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync(ct);
        var p = Math.Max(1, page);
        var ps = Math.Clamp(pageSize, 1, 100);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((p - 1) * ps)
            .Take(ps)
            .ToListAsync(ct);

        var dtos = orders.Select(MapToDto).ToList();
        return Result<PagedResult<OrderDto>>.Success(new PagedResult<OrderDto>(dtos, totalCount, p, ps));
    }
}
