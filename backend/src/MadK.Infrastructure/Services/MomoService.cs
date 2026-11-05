using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Notifications;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Payment;
using MadK.Application.DTOs.Shipping;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MadK.Infrastructure.Services;

/// <summary>
/// Triển khai dịch vụ cổng thanh toán Ví điện tử MoMo All-In-One (AIO).
/// Tuân thủ chuẩn tài liệu MoMo Payment Platform v2.
/// </summary>
public class MomoService : IMomoService
{
    private readonly AppDbContext _context;
    private readonly IInventoryService _inventoryService;
    private readonly IPricingService _pricingService;
    private readonly HttpClient _httpClient;
    private readonly IEmailSender? _emailSender;
    private readonly ITelegramNotificationService? _telegramService;
    private readonly ICouponService? _couponService;
    private readonly IShippingFeeService? _shippingFeeService;
    private readonly ILogger<MomoService> _logger;
    private readonly MomoSettings _settings;

    public MomoService(
        AppDbContext context,
        IInventoryService inventoryService,
        IPricingService pricingService,
        HttpClient httpClient,
        IOptions<MomoSettings> options,
        ILogger<MomoService> logger,
        IEmailSender? emailSender = null,
        ITelegramNotificationService? telegramService = null,
        ICouponService? couponService = null,
        IShippingFeeService? shippingFeeService = null)
    {
        _context = context;
        _inventoryService = inventoryService;
        _pricingService = pricingService;
        _httpClient = httpClient;
        _logger = logger;
        _emailSender = emailSender;
        _telegramService = telegramService;
        _couponService = couponService;
        _shippingFeeService = shippingFeeService;
        _settings = options.Value ?? new MomoSettings();
    }

    /// <inheritdoc />
    public async Task<Result<MomoPaymentResponseDto>> CreatePaymentUrlForOrderAsync(
        string orderNumber,
        string? clientIp,
        string? customReturnUrl = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return Result<MomoPaymentResponseDto>.Failure("Mã đơn hàng không được để trống.");
        }

        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim(), ct);

        if (order == null)
        {
            return Result<MomoPaymentResponseDto>.Failure($"Không tìm thấy đơn hàng {orderNumber}.");
        }

        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            return Result<MomoPaymentResponseDto>.Failure($"Đơn hàng {orderNumber} đã được thanh toán thành công trước đó.");
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            return Result<MomoPaymentResponseDto>.Failure($"Đơn hàng {orderNumber} đã bị hủy, không thể tiếp tục thanh toán.");
        }

        string orderId = $"{order.OrderNumber}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        string requestId = Guid.NewGuid().ToString();
        long amount = (long)Math.Round(order.TotalAmount, MidpointRounding.AwayFromZero);
        string orderInfo = $"Thanh toan don hang {order.OrderNumber} - MadK Store";
        string redirectUrl = !string.IsNullOrWhiteSpace(customReturnUrl) ? customReturnUrl : _settings.ReturnUrl;
        string ipnUrl = _settings.IpnUrl;
        string extraData = "";
        string requestType = "captureWallet";

        var (payUrl, deeplink, qrCodeUrl, shortLink, resultCode, message) = await CallMomoGatewayCreateAsync(
            orderId, requestId, amount, orderInfo, redirectUrl, ipnUrl, extraData, requestType, order.OrderNumber, ct);

        // Lưu bản ghi Payment khởi tạo (Pending)
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            TxnRef = orderId,
            Amount = order.TotalAmount,
            Currency = "VND",
            PaymentMethod = PaymentMethod.MoMo,
            Status = PaymentStatus.Pending,
            OrderInfo = orderInfo,
            IpAddress = clientIp,
            RawPayload = "{}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync(ct);

        DateTime expiresAt = order.ExpiresAt ?? DateTime.UtcNow.AddMinutes(_settings.PaymentExpiryMinutes);

        return Result<MomoPaymentResponseDto>.Success(
            new MomoPaymentResponseDto(
                order.OrderNumber,
                orderId,
                requestId,
                order.TotalAmount,
                payUrl,
                deeplink,
                qrCodeUrl,
                shortLink,
                expiresAt,
                resultCode,
                message
            ),
            "Khởi tạo phiên thanh toán MoMo thành công.");
    }

    /// <inheritdoc />
    public async Task<Result<CheckoutMomoResponseDto>> CheckoutMomoAsync(
        Guid? userId,
        string? anonymousId,
        CheckoutCodRequestDto request,
        string clientIp,
        CancellationToken ct = default)
    {
        if (request == null)
        {
            return Result<CheckoutMomoResponseDto>.Failure("Yêu cầu thanh toán không hợp lệ.");
        }

        // 1. Lấy danh sách sản phẩm từ request hoặc giỏ hàng
        var itemsToOrder = new List<(Guid VariantId, int Quantity)>();
        if (request.Items != null && request.Items.Count > 0)
        {
            itemsToOrder = request.Items
                .Select(i => (i.VariantId, i.Quantity))
                .ToList();
        }
        else
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => (userId.HasValue && c.UserId == userId.Value) ||
                                          (!userId.HasValue && !string.IsNullOrEmpty(anonymousId) && c.AnonymousId == anonymousId), ct);

            if (cart == null || cart.Items == null || cart.Items.Count == 0)
            {
                return Result<CheckoutMomoResponseDto>.Failure("Giỏ hàng của bạn đang trống.");
            }

            itemsToOrder = cart.Items.Select(i => (i.VariantId, i.Quantity)).ToList();
        }

        if (itemsToOrder.Count == 0)
        {
            return Result<CheckoutMomoResponseDto>.Failure("Không có sản phẩm hợp lệ để thanh toán.");
        }

        // 2. Snapshot địa chỉ
        string addressSnapshot;
        string recipientPhone = "";
        string? recipientEmail = null;
        string? provinceName = null;
        string? districtName = null;
        string? wardName = null;

        if (request.AddressId.HasValue)
        {
            var address = await _context.Addresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == request.AddressId.Value, ct);

            if (address == null)
            {
                return Result<CheckoutMomoResponseDto>.Failure("Không tìm thấy địa chỉ được chọn.");
            }

            if (userId.HasValue && address.UserId != userId.Value)
            {
                return Result<CheckoutMomoResponseDto>.Failure("Bạn không có quyền sử dụng địa chỉ này.");
            }

            recipientPhone = address.PhoneNumber;
            provinceName = address.ProvinceName;
            districtName = address.DistrictName;
            wardName = address.WardName;
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
                return Result<CheckoutMomoResponseDto>.Failure("Vui lòng nhập tên người nhận hàng.");
            if (string.IsNullOrWhiteSpace(addr.PhoneNumber))
                return Result<CheckoutMomoResponseDto>.Failure("Vui lòng nhập số điện thoại người nhận hàng.");
            if (string.IsNullOrWhiteSpace(addr.ProvinceName) || string.IsNullOrWhiteSpace(addr.DistrictName) || string.IsNullOrWhiteSpace(addr.WardName))
                return Result<CheckoutMomoResponseDto>.Failure("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã.");
            if (string.IsNullOrWhiteSpace(addr.DetailedAddress))
                return Result<CheckoutMomoResponseDto>.Failure("Vui lòng nhập địa chỉ cụ thể.");

            recipientPhone = addr.PhoneNumber.Trim();
            provinceName = addr.ProvinceName.Trim();
            districtName = addr.DistrictName.Trim();
            wardName = addr.WardName.Trim();
            recipientEmail = addr.Email?.Trim();

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
            return Result<CheckoutMomoResponseDto>.Failure("Vui lòng cung cấp địa chỉ giao hàng hợp lệ.");
        }

        if (userId.HasValue && string.IsNullOrWhiteSpace(recipientEmail))
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
            recipientEmail = user?.Email;
        }

        // Thực hiện trong Transaction
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            var reservedTracker = new List<(Guid VariantId, int Quantity)>();
            var now = DateTime.UtcNow;
            var orderId = Guid.NewGuid();
            string orderNumber = $"MK-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
            string txnRef = $"{orderNumber}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            DateTime expiresAt = now.AddMinutes(_settings.PaymentExpiryMinutes);

            using var tx = _context.Database.CurrentTransaction != null
                ? null
                : await _context.Database.BeginTransactionAsync(ct);

            try
            {
                var variantIds = itemsToOrder.Select(i => i.VariantId).Distinct().ToList();
                var variants = await _context.ProductVariants
                    .Include(v => v.Product)
                    .Include(v => v.Images)
                    .Where(v => variantIds.Contains(v.Id))
                    .ToDictionaryAsync(v => v.Id, ct);

                decimal subtotalAmount = 0m;
                var orderItems = new List<OrderItem>();

                foreach (var (variantId, quantity) in itemsToOrder)
                {
                    if (!variants.TryGetValue(variantId, out var variant) || !variant.IsActive)
                    {
                        return Result<CheckoutMomoResponseDto>.Failure($"Biến thể sản phẩm không tồn tại hoặc đã ngừng kinh doanh.");
                    }

                    // Giữ hàng tạm thời (atomic reserve)
                    var reserveResult = await _inventoryService.ReserveAsync(
                        variantId, quantity, "Order", orderNumber, $"Giữ hàng phiên thanh toán MoMo {orderNumber}", ct);

                    if (!reserveResult.IsSuccess)
                    {
                        return Result<CheckoutMomoResponseDto>.Failure(
                            $"Sản phẩm '{variant.Product?.Name ?? variant.Name}' không đủ tồn kho khả dụng để đặt hàng.");
                    }

                    reservedTracker.Add((variantId, quantity));

                    var priceResult = _pricingService?.CalculateCurrentPrice(variant, now);
                    decimal unitPrice = priceResult != null ? priceResult.CurrentPrice : variant.SalePrice;
                    decimal originalPrice = priceResult != null ? priceResult.OriginalPrice : variant.OriginalPrice;
                    decimal lineTotal = unitPrice * quantity;
                    subtotalAmount += lineTotal;

                    string? thumb = variant.Images?.OrderBy(img => img.DisplayOrder).FirstOrDefault()?.ImageUrl
                                    ?? variant.Product?.ThumbnailUrl;

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

                // Tính phí vận chuyển
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
                    if (shippingCalc.IsSuccess && shippingCalc.Data != null)
                    {
                        shippingFee = shippingCalc.Data.ShippingFee;
                    }
                }

                // Khuyến mãi Coupon
                decimal discountAmount = 0m;
                string? couponSnapshot = null;
                if (!string.IsNullOrWhiteSpace(request.CouponCode))
                {
                    if (_couponService != null)
                    {
                        var claimResult = await _couponService.ClaimAndIncrementUsageAsync(request.CouponCode, subtotalAmount, ct);
                        if (!claimResult.IsSuccess)
                        {
                            throw new InvalidOperationException(claimResult.Error ?? claimResult.Message ?? "Mã giảm giá không hợp lệ.");
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
                }

                decimal totalAmount = Math.Max(0m, subtotalAmount - discountAmount + shippingFee);

                var initialHistory = new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    FromStatus = null,
                    ToStatus = OrderStatus.PendingPayment,
                    ChangedByUserId = userId,
                    ChangedByName = userId.HasValue ? "Khách hàng" : "Khách vãng lai",
                    Reason = "Khởi tạo đơn hàng thanh toán qua cổng Ví MoMo",
                    CreatedAt = now
                };

                var order = new Order
                {
                    Id = orderId,
                    OrderNumber = orderNumber,
                    UserId = userId,
                    CustomerEmail = recipientEmail,
                    CustomerPhone = recipientPhone,
                    Status = OrderStatus.PendingPayment,
                    PaymentStatus = PaymentStatus.Pending,
                    PaymentMethod = PaymentMethod.MoMo,
                    SubtotalAmount = subtotalAmount,
                    DiscountAmount = discountAmount,
                    ShippingFee = shippingFee,
                    CouponSnapshot = couponSnapshot,
                    TotalAmount = totalAmount,
                    ShippingAddressSnapshot = addressSnapshot,
                    CustomerNote = request.CustomerNote,
                    IdempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? null : request.IdempotencyKey.Trim(),
                    ExpiresAt = expiresAt,
                    CreatedAt = now,
                    Items = orderItems,
                    StatusHistories = new List<OrderStatusHistory> { initialHistory }
                };

                _context.Orders.Add(order);

                // Bản ghi Payment
                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    OrderNumber = orderNumber,
                    TxnRef = txnRef,
                    Amount = totalAmount,
                    Currency = "VND",
                    PaymentMethod = PaymentMethod.MoMo,
                    Status = PaymentStatus.Pending,
                    OrderInfo = $"Thanh toan don hang {orderNumber}",
                    IpAddress = clientIp,
                    RawPayload = "{}",
                    CreatedAt = now
                };

                _context.Payments.Add(payment);

                // Dọn giỏ hàng
                if (userId.HasValue || !string.IsNullOrEmpty(anonymousId))
                {
                    var cart = await _context.Carts
                        .Include(c => c.Items)
                        .FirstOrDefaultAsync(c => (userId.HasValue && c.UserId == userId.Value) ||
                                                  (!userId.HasValue && !string.IsNullOrEmpty(anonymousId) && c.AnonymousId == anonymousId), ct);

                    if (cart != null)
                    {
                        var orderedVariantIds = itemsToOrder.Select(i => i.VariantId).ToHashSet();
                        var toRemove = cart.Items.Where(i => orderedVariantIds.Contains(i.VariantId)).ToList();
                        foreach (var rem in toRemove) cart.Items.Remove(rem);
                    }
                }

                await _context.SaveChangesAsync(ct);

                if (tx != null)
                {
                    await tx.CommitAsync(ct);
                }

                // Gọi MoMo Gateway sinh PayUrl / Deeplink / QR Code
                long longAmount = (long)Math.Round(totalAmount, MidpointRounding.AwayFromZero);
                var (payUrl, deeplink, qrCodeUrl, _, _, _) = await CallMomoGatewayCreateAsync(
                    txnRef,
                    Guid.NewGuid().ToString(),
                    longAmount,
                    $"Thanh toan don hang {orderNumber} - MadK Store",
                    _settings.ReturnUrl,
                    _settings.IpnUrl,
                    "",
                    "captureWallet",
                    orderNumber,
                    ct);

                _logger.LogInformation("Successfully created MoMo Order {OrderNumber} with Total: {Total:N0}đ",
                    orderNumber, totalAmount);

                return Result<CheckoutMomoResponseDto>.Success(
                    new CheckoutMomoResponseDto(MapOrderToDto(order), payUrl, deeplink, qrCodeUrl, txnRef, expiresAt),
                    "Tạo đơn hàng chờ thanh toán MoMo thành công.");
            }
            catch (Exception ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);

                foreach (var (variantId, quantity) in reservedTracker)
                {
                    try
                    {
                        await _inventoryService.ReleaseAsync(
                            variantId, quantity, "Order", orderNumber, "Rollback do lỗi tạo đơn MoMo", ct);
                    }
                    catch (Exception rbEx)
                    {
                        _logger.LogError(rbEx, "Failed to rollback stock for variant {VariantId}", variantId);
                    }
                }

                _logger.LogError(ex, "Failed to checkout MoMo for order {OrderNumber}", orderNumber);
                return Result<CheckoutMomoResponseDto>.Failure(ex.Message);
            }
        });
    }

    /// <inheritdoc />
    public async Task<MomoIpnResponseDto> ProcessIpnAsync(
        MomoIpnRequestDto ipnRequest,
        CancellationToken ct = default)
    {
        if (ipnRequest == null)
        {
            return new MomoIpnResponseDto("", "", "", 99, "Request is null", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), "");
        }

        string extraData = ipnRequest.ExtraData ?? "";
        string message = ipnRequest.Message ?? "";
        string orderInfo = ipnRequest.OrderInfo ?? "";
        string orderType = ipnRequest.OrderType ?? "";
        string payType = ipnRequest.PayType ?? "";

        // 1. Kiểm tra chữ ký số HMAC-SHA256
        string rawSignature = $"accessKey={_settings.AccessKey}&amount={ipnRequest.Amount}&extraData={extraData}&message={message}&orderId={ipnRequest.OrderId}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={ipnRequest.PartnerCode}&payType={payType}&requestId={ipnRequest.RequestId}&responseTime={ipnRequest.ResponseTime}&resultCode={ipnRequest.ResultCode}&transId={ipnRequest.TransId}";
        string expectedSignature = ComputeHmacSha256(rawSignature, _settings.SecretKey);

        if (!string.Equals(expectedSignature, ipnRequest.Signature, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("MoMo IPN: Invalid signature for OrderId {OrderId}. Expected: {Exp}, Got: {Got}",
                ipnRequest.OrderId, expectedSignature, ipnRequest.Signature);
            return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, 97, "Invalid signature", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
        }

        // 2. Trích xuất mã đơn hàng
        string orderNumber = ipnRequest.OrderId.Contains('_')
            ? ipnRequest.OrderId.Split('_')[0]
            : ipnRequest.OrderId;

        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);

        if (order == null)
        {
            _logger.LogWarning("MoMo IPN: Order not found for OrderId {OrderId} (Extracted {OrderNumber})",
                ipnRequest.OrderId, orderNumber);
            return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, 1, "Order not found", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
        }

        // 3. Đối soát số tiền
        decimal paidAmount = ipnRequest.Amount;
        if (Math.Abs(paidAmount - order.TotalAmount) > 0.01m)
        {
            _logger.LogWarning("MoMo IPN: Amount mismatch for order {OrderNumber}. Expected: {Exp}, Received: {Rec}",
                order.OrderNumber, order.TotalAmount, paidAmount);
            return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, 4, "Invalid amount", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
        }

        // 4. Kiểm tra Idempotency
        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            _logger.LogInformation("MoMo IPN: Order {OrderNumber} already paid. Returning idempotent 0.", order.OrderNumber);
            return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, 0, "Order already confirmed", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
        }

        // 5. Ghi nhận giao dịch vào bảng Payment
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.TxnRef == ipnRequest.OrderId, ct);

        if (payment == null)
        {
            payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                TxnRef = ipnRequest.OrderId,
                Amount = paidAmount,
                Currency = "VND",
                PaymentMethod = PaymentMethod.MoMo,
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);
        }

        payment.TransactionNo = ipnRequest.TransId.ToString();
        payment.BankCode = "MOMO";
        payment.CardType = ipnRequest.PayType ?? "WALLET";
        payment.ResponseCode = ipnRequest.ResultCode.ToString();
        payment.TransactionStatus = ipnRequest.ResultCode == 0 ? "00" : ipnRequest.ResultCode.ToString();
        payment.SecureHash = ipnRequest.Signature;
        payment.RawPayload = JsonSerializer.Serialize(ipnRequest);
        payment.PaymentTime = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;

        if (ipnRequest.ResultCode == 0)
        {
            // === GIAO DỊCH THÀNH CÔNG ===
            payment.Status = PaymentStatus.Paid;

            if (order.Status == OrderStatus.PendingPayment)
            {
                // Commit kho thực tế từ Reserved sang trừ cả OnHand & Reserved
                foreach (var item in order.Items)
                {
                    if (item.VariantId.HasValue && item.Quantity > 0)
                    {
                        var commitRes = await _inventoryService.CommitAsync(
                            item.VariantId.Value,
                            item.Quantity,
                            "Order",
                            order.OrderNumber,
                            $"Thanh toán MoMo thành công đơn {order.OrderNumber}",
                            ct);

                        if (!commitRes.IsSuccess)
                        {
                            _logger.LogWarning("MoMo Commit stock warning for variant {VariantId}: {Msg}",
                                item.VariantId, commitRes.Error);
                        }
                    }
                }

                order.PaymentStatus = PaymentStatus.Paid;
                order.Status = OrderStatus.Pending; // Theo docs/order-states.md
                order.ExpiresAt = null;
                order.UpdatedAt = DateTime.UtcNow;

                var history = new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    FromStatus = OrderStatus.PendingPayment,
                    ToStatus = OrderStatus.Pending,
                    ChangedByName = "MoMo AIO IPN Gateway",
                    Reason = $"Thanh toán MoMo thành công (Mã GD: {ipnRequest.TransId}, Ví: MoMo)",
                    CreatedAt = DateTime.UtcNow
                };
                _context.OrderStatusHistories.Add(history);

                await _context.SaveChangesAsync(ct);

                _logger.LogInformation("MoMo IPN: Payment successfully processed & committed for order {OrderNumber}. TransId: {TransId}",
                    order.OrderNumber, ipnRequest.TransId);

                // Gửi email xác nhận
                if (_emailSender != null && !string.IsNullOrWhiteSpace(order.CustomerEmail))
                {
                    try
                    {
                        string recipientName = "Khách hàng";
                        string shippingAddressDisplay = "";
                        try
                        {
                            if (!string.IsNullOrWhiteSpace(order.ShippingAddressSnapshot))
                            {
                                using var doc = JsonDocument.Parse(order.ShippingAddressSnapshot);
                                if (doc.RootElement.TryGetProperty("recipientName", out var np))
                                    recipientName = np.GetString() ?? recipientName;
                                if (doc.RootElement.TryGetProperty("fullAddress", out var fa))
                                    shippingAddressDisplay = fa.GetString() ?? "";
                            }
                        }
                        catch { }

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
                            RecipientEmail: order.CustomerEmail,
                            RecipientName: recipientName,
                            RecipientPhone: order.CustomerPhone ?? "",
                            ShippingAddress: shippingAddressDisplay,
                            PaymentMethod: "Ví điện tử MoMo",
                            SubtotalAmount: order.SubtotalAmount,
                            ShippingFee: order.ShippingFee,
                            DiscountAmount: order.DiscountAmount,
                            TotalAmount: order.TotalAmount,
                            CouponCode: null,
                            CustomerNote: order.CustomerNote,
                            CreatedAt: order.CreatedAt,
                            Items: emailItems
                        );

                        await _emailSender.SendOrderConfirmationAsync(confirmDto, ct);
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(emailEx, "Lỗi khi đưa email xác nhận thanh toán MoMo đơn {OrderNumber} vào hàng đợi", order.OrderNumber);
                    }
                }

                // Bắn thông báo Telegram Bot tới Admin
                if (_telegramService != null)
                {
                    _ = _telegramService.SendPaymentReceivedAlertAsync(
                        order.OrderNumber,
                        paidAmount,
                        "MoMo",
                        ipnRequest.TransId.ToString(),
                        ct);
                }

                return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, 0, "Confirm Success", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
            }
            else if (order.Status == OrderStatus.Cancelled)
            {
                // Xử lý late IPN cho đơn đã hủy do quá hạn
                order.PaymentStatus = PaymentStatus.Paid;
                order.UpdatedAt = DateTime.UtcNow;
                payment.OrderInfo = $"GIAO DICH TRE: Don hang {order.OrderNumber} da bi huy truoc khi nhan duoc IPN MoMo. Can hoan tien cho khach.";
                await _context.SaveChangesAsync(ct);

                return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, 0, "Order was cancelled. Awaiting manual refund.", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
            }
            else
            {
                // Đơn đã ở trạng thái khác (vd: Pending, Confirmed)
                order.PaymentStatus = PaymentStatus.Paid;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(ct);

                return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, 0, "Confirm Success", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
            }
        }
        else
        {
            // === GIAO DỊCH THẤT BẠI TỪ PHÍA CỔNG MOMO ===
            payment.Status = PaymentStatus.Failed;
            await _context.SaveChangesAsync(ct);

            _logger.LogWarning("MoMo IPN: Payment failed for order {OrderNumber} with resultCode {Code}, message {Msg}",
                order.OrderNumber, ipnRequest.ResultCode, ipnRequest.Message);

            return new MomoIpnResponseDto(ipnRequest.PartnerCode, ipnRequest.OrderId, ipnRequest.RequestId, ipnRequest.ResultCode, "Payment Failed", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), extraData);
        }
    }

    /// <inheritdoc />
    public async Task<Result<MomoCallbackResultDto>> VerifyPaymentReturnAsync(
        IReadOnlyDictionary<string, string> queryParams,
        CancellationToken ct = default)
    {
        if (queryParams == null || queryParams.Count == 0)
        {
            return Result<MomoCallbackResultDto>.Failure("Tham số phản hồi từ MoMo rỗng.");
        }

        string partnerCode = queryParams.GetValueOrDefault("partnerCode") ?? "";
        string orderId = queryParams.GetValueOrDefault("orderId") ?? "";
        string requestId = queryParams.GetValueOrDefault("requestId") ?? "";
        string amountStr = queryParams.GetValueOrDefault("amount") ?? "0";
        string orderInfo = queryParams.GetValueOrDefault("orderInfo") ?? "";
        string orderType = queryParams.GetValueOrDefault("orderType") ?? "";
        string transIdStr = queryParams.GetValueOrDefault("transId") ?? "0";
        string resultCodeStr = queryParams.GetValueOrDefault("resultCode") ?? "99";
        string message = queryParams.GetValueOrDefault("message") ?? "";
        string payType = queryParams.GetValueOrDefault("payType") ?? "";
        string responseTimeStr = queryParams.GetValueOrDefault("responseTime") ?? "0";
        string extraData = queryParams.GetValueOrDefault("extraData") ?? "";
        string signature = queryParams.GetValueOrDefault("signature") ?? "";

        long.TryParse(amountStr, out var amount);
        long.TryParse(transIdStr, out var transId);
        int.TryParse(resultCodeStr, out var resultCode);
        long.TryParse(responseTimeStr, out var responseTime);

        // Kiểm tra chữ ký số
        string rawSignature = $"accessKey={_settings.AccessKey}&amount={amount}&extraData={extraData}&message={message}&orderId={orderId}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={partnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode={resultCode}&transId={transId}";
        string expectedSignature = ComputeHmacSha256(rawSignature, _settings.SecretKey);

        if (!string.Equals(expectedSignature, signature, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("MoMo Return: Invalid signature for OrderId {OrderId}", orderId);
            return Result<MomoCallbackResultDto>.Failure("Chữ ký phản hồi từ MoMo không hợp lệ (Dấu hiệu bị can thiệp dữ liệu).");
        }

        string orderNumber = orderId.Contains('_') ? orderId.Split('_')[0] : orderId;
        var order = await _context.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);

        if (order == null)
        {
            return Result<MomoCallbackResultDto>.Failure($"Không tìm thấy đơn hàng {orderNumber}.");
        }

        bool isSuccess = resultCode == 0;
        var dto = new MomoCallbackResultDto(
            IsSuccess: isSuccess,
            OrderNumber: order.OrderNumber,
            Amount: amount,
            TransId: transId.ToString(),
            ResultCode: resultCode,
            Message: isSuccess ? "Thanh toán MoMo thành công!" : (string.IsNullOrWhiteSpace(message) ? "Giao dịch không thành công." : message),
            Status: order.PaymentStatus,
            OrderStatus: order.Status
        );

        return Result<MomoCallbackResultDto>.Success(dto, dto.Message);
    }

    /// <inheritdoc />
    public async Task<MomoIpnResponseDto> SimulateIpnAsync(
        SimulateMomoIpnRequestDto request,
        CancellationToken ct = default)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.OrderNumber))
        {
            return new MomoIpnResponseDto("", "", "", 99, "Request is invalid", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), "");
        }

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber.Trim(), ct);
        if (order == null)
        {
            return new MomoIpnResponseDto(_settings.PartnerCode, request.OrderNumber, Guid.NewGuid().ToString(), 1, "Order not found", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), "");
        }

        long amount = request.Amount.HasValue
            ? (long)request.Amount.Value
            : (long)Math.Round(order.TotalAmount, MidpointRounding.AwayFromZero);

        long transId = request.TransId ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string orderId = $"{order.OrderNumber}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        string requestId = Guid.NewGuid().ToString();
        string orderInfo = $"Thanh toan don hang {order.OrderNumber} - MadK Store";
        string orderType = "momo_wallet";
        string payType = "qr";
        long responseTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string extraData = "";
        string message = request.Message ?? (request.ResultCode == 0 ? "Thành công." : "Thất bại.");

        string rawSignature = $"accessKey={_settings.AccessKey}&amount={amount}&extraData={extraData}&message={message}&orderId={orderId}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={_settings.PartnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode={request.ResultCode}&transId={transId}";
        string signature = request.TamperSignature
            ? "TAMPERED_INVALID_MOMO_SIGNATURE_FOR_TESTING"
            : ComputeHmacSha256(rawSignature, _settings.SecretKey);

        var ipnDto = new MomoIpnRequestDto(
            _settings.PartnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            request.ResultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        );

        return await ProcessIpnAsync(ipnDto, ct);
    }

    /// <inheritdoc />
    public async Task<Result<IReadOnlyList<PaymentDto>>> GetPaymentsByOrderAsync(
        string orderNumber,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return Result<IReadOnlyList<PaymentDto>>.Failure("Mã đơn hàng không được để trống.");
        }

        var payments = await _context.Payments
            .AsNoTracking()
            .Where(p => p.OrderNumber == orderNumber.Trim() && p.PaymentMethod == PaymentMethod.MoMo)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto(
                p.Id,
                p.OrderId,
                p.OrderNumber,
                p.TxnRef,
                p.TransactionNo,
                p.Amount,
                p.Currency,
                p.PaymentMethod,
                p.Status,
                p.BankCode,
                p.CardType,
                p.ResponseCode,
                p.TransactionStatus,
                p.OrderInfo,
                p.CreatedAt,
                p.PaymentTime
            ))
            .ToListAsync(ct);

        return Result<IReadOnlyList<PaymentDto>>.Success(payments);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private async Task<(string payUrl, string? deeplink, string? qrCodeUrl, string? shortLink, int resultCode, string message)> CallMomoGatewayCreateAsync(
        string orderId,
        string requestId,
        long amount,
        string orderInfo,
        string redirectUrl,
        string ipnUrl,
        string extraData,
        string requestType,
        string orderNumber,
        CancellationToken ct)
    {
        // Tính chữ ký số HMAC-SHA256 theo chuẩn MoMo v2
        string rawSignature = $"accessKey={_settings.AccessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={_settings.PartnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}";
        string signature = ComputeHmacSha256(rawSignature, _settings.SecretKey);

        var requestBody = new
        {
            partnerCode = _settings.PartnerCode,
            partnerName = "MadK Store",
            storeId = "MadKStore",
            requestId = requestId,
            amount = amount,
            orderId = orderId,
            orderInfo = orderInfo,
            redirectUrl = redirectUrl,
            ipnUrl = ipnUrl,
            requestType = requestType,
            extraData = extraData,
            lang = "vi",
            autoCapture = true,
            signature = signature
        };

        try
        {
            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(_settings.Endpoint, content, ct);

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync(ct);
                using var doc = JsonDocument.Parse(responseJson);
                var root = doc.RootElement;

                int resultCode = root.TryGetProperty("resultCode", out var rc) ? rc.GetInt32() : 99;
                string message = root.TryGetProperty("message", out var msg) ? msg.GetString() ?? "" : "";
                string payUrl = root.TryGetProperty("payUrl", out var pu) ? pu.GetString() ?? "" : "";
                string? deeplink = root.TryGetProperty("deeplink", out var dl) ? dl.GetString() : null;
                string? qrCodeUrl = root.TryGetProperty("qrCodeUrl", out var qr) ? qr.GetString() : null;
                string? shortLink = root.TryGetProperty("shortLink", out var sl) ? sl.GetString() : null;

                if (resultCode == 0 && !string.IsNullOrWhiteSpace(payUrl))
                {
                    return (payUrl, deeplink, qrCodeUrl, shortLink, resultCode, message);
                }
                else
                {
                    _logger.LogWarning("MoMo Create returned non-zero code {Code}: {Msg}", resultCode, message);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to call external MoMo gateway endpoint. Falling back to local offline test payment URL.");
        }

        // Fallback cho môi trường Local / Sandbox khi không kết nối được mạng ngoài
        string fallbackPayUrl = $"https://test-payment.momo.vn/v2/gateway/pay?s={orderId}";
        string fallbackDeeplink = $"momo://app?action=payWithApp&orderId={orderId}";
        string fallbackQrCodeUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=2|99|0901316434|NGUYEN%20HOANG%20KHANG|hk641080@gmail.com|0|0|{amount}|{orderNumber}|transfer_p2p";

        return (fallbackPayUrl, fallbackDeeplink, fallbackQrCodeUrl, null, 0, "Khởi tạo thành công (Sandbox/Test mode).");
    }

    public static string ComputeHmacSha256(string message, string secretKey)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var messageBytes = Encoding.UTF8.GetBytes(message);
        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(messageBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static OrderDto MapOrderToDto(Order order) =>
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
}
