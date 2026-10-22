using System.Net;
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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MadK.Infrastructure.Services;

/// <summary>
/// Triển khai tích hợp cổng thanh toán VNPay Sandbox v2.1.0.
/// Tuân thủ nghiêm ngặt chữ ký HMAC-SHA512, quy chuẩn Idempotency cho IPN webhook,
/// và lưu vết giao dịch thô (raw payload) để phục vụ đối soát kiểm toán.
/// </summary>
public class VnpayService : IVnpayService
{
    private readonly IAppDbContext _context;
    private readonly DbContext _efContext;
    private readonly IInventoryService _inventoryService;
    private readonly IPricingService? _pricingService;
    private readonly ICouponService? _couponService;
    private readonly IShippingFeeService? _shippingFeeService;
    private readonly IEmailSender? _emailSender;
    private readonly VnpaySettings _settings;
    private readonly ILogger<VnpayService> _logger;

    public VnpayService(
        IAppDbContext context,
        IInventoryService inventoryService,
        IOptions<VnpaySettings> settings,
        ILogger<VnpayService> logger,
        IPricingService? pricingService = null,
        ICouponService? couponService = null,
        IShippingFeeService? shippingFeeService = null,
        IEmailSender? emailSender = null)
    {
        _context = context;
        _efContext = (DbContext)context;
        _inventoryService = inventoryService;
        _settings = settings.Value;
        _logger = logger;
        _pricingService = pricingService;
        _couponService = couponService;
        _shippingFeeService = shippingFeeService;
        _emailSender = emailSender;
    }

    /// <inheritdoc />
    public async Task<Result<CheckoutVnpayResponseDto>> CheckoutVnpayAsync(
        Guid? userId,
        string? anonymousId,
        CheckoutCodRequestDto request,
        string ipAddress,
        CancellationToken ct = default)
    {
        // 1. Kiểm tra Idempotency Key
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
                _logger.LogInformation("Idempotent hit: Order {OrderNumber} already exists for key {Key}",
                    existingOrder.OrderNumber, cleanKey);

                var paymentUrl = CreatePaymentUrl(existingOrder, existingOrder.OrderNumber, ipAddress);
                var orderDto = MapOrderToDto(existingOrder);
                var existingExpiresAt = existingOrder.CreatedAt.AddMinutes(_settings.PaymentExpiryMinutes);

                return Result<CheckoutVnpayResponseDto>.Success(
                    new CheckoutVnpayResponseDto(orderDto, paymentUrl, existingOrder.OrderNumber, existingExpiresAt),
                    "Đơn hàng VNPay đã được ghi nhận trước đó (Idempotent).");
            }
        }


        // 2. Phân giải & xác thực địa chỉ giao hàng
        string addressSnapshot;
        string recipientPhone;
        string? recipientEmail = !string.IsNullOrWhiteSpace(request.CustomerEmail) ? request.CustomerEmail.Trim() : null;
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
                return Result<CheckoutVnpayResponseDto>.Failure("Không tìm thấy địa chỉ được chọn.");
            }

            if (userId.HasValue && address.UserId != userId.Value)
            {
                return Result<CheckoutVnpayResponseDto>.Failure("Bạn không có quyền sử dụng địa chỉ này.");
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
                return Result<CheckoutVnpayResponseDto>.Failure("Vui lòng nhập tên người nhận hàng.");
            if (string.IsNullOrWhiteSpace(addr.PhoneNumber))
                return Result<CheckoutVnpayResponseDto>.Failure("Vui lòng nhập số điện thoại người nhận hàng.");
            if (string.IsNullOrWhiteSpace(addr.ProvinceName) || string.IsNullOrWhiteSpace(addr.DistrictName) || string.IsNullOrWhiteSpace(addr.WardName))
                return Result<CheckoutVnpayResponseDto>.Failure("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã.");
            if (string.IsNullOrWhiteSpace(addr.DetailedAddress))
                return Result<CheckoutVnpayResponseDto>.Failure("Vui lòng nhập địa chỉ cụ thể.");

            recipientPhone = addr.PhoneNumber.Trim();
            provinceName = addr.ProvinceName.Trim();
            districtName = addr.DistrictName.Trim();
            wardName = addr.WardName.Trim();
            if (string.IsNullOrWhiteSpace(recipientEmail) && !string.IsNullOrWhiteSpace(addr.Email))
            {
                recipientEmail = addr.Email.Trim();
            }
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
            return Result<CheckoutVnpayResponseDto>.Failure("Vui lòng cung cấp địa chỉ giao hàng hợp lệ.");
        }

        if (string.IsNullOrWhiteSpace(recipientEmail) && userId.HasValue)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
            recipientEmail = user?.Email;
        }

        // 3. Phân giải danh sách món hàng
        var itemsToOrder = new List<(Guid VariantId, int Quantity)>();
        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                if (item.Quantity > 0) itemsToOrder.Add((item.VariantId, item.Quantity));
            }
        }
        else
        {
            // Lấy từ giỏ hàng
            var cart = await _context.Carts
                .Include(c => c.Items)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => (userId.HasValue && c.UserId == userId.Value) ||
                                          (!userId.HasValue && !string.IsNullOrEmpty(anonymousId) && c.AnonymousId == anonymousId), ct);

            if (cart != null && cart.Items.Count > 0)
            {
                foreach (var i in cart.Items)
                {
                    if (i.Quantity > 0) itemsToOrder.Add((i.VariantId, i.Quantity));
                }
            }
        }

        if (itemsToOrder.Count == 0)
        {
            return Result<CheckoutVnpayResponseDto>.Failure("Không có sản phẩm nào hợp lệ để tạo đơn hàng.");
        }

        // 4. Sinh mã đơn hàng
        string orderNumber = GenerateOrderNumber();
        string txnRef = orderNumber;
        DateTime now = DateTime.UtcNow;
        DateTime expiresAt = now.AddMinutes(_settings.PaymentExpiryMinutes);

        // 5. Thực thi Transaction đảm bảo nguyên tử giữa tạo Order, Reserve kho, và Payment
        var strategy = _efContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            bool isRelational = _efContext.Database.IsRelational();
            await using var tx = isRelational ? await _efContext.Database.BeginTransactionAsync(ct) : null;
            var reservedTracker = new List<(Guid VariantId, int Quantity)>();

            try
            {
                var orderId = Guid.NewGuid();
                var orderItems = new List<OrderItem>();
                decimal subtotalAmount = 0m;

                foreach (var (variantId, quantity) in itemsToOrder)
                {
                    var variant = await _context.ProductVariants
                        .Include(v => v.Product)
                        .Include(v => v.Images)
                        .Include(v => v.PriceSchedules)
                        .FirstOrDefaultAsync(v => v.Id == variantId, ct);

                    if (variant == null)
                        throw new InvalidOperationException("Không tìm thấy một trong các sản phẩm đã chọn.");
                    if (!variant.IsActive)
                        throw new InvalidOperationException($"Sản phẩm '{variant.Name}' hiện đã ngừng kinh doanh.");

                    // Giữ tồn kho nguyên tử qua InventoryService (Hạn 15 phút theo docs/order-states.md)
                    var reserveResult = await _inventoryService.ReserveAsync(
                        variantId: variant.Id,
                        quantity: quantity,
                        referenceType: "Order",
                        referenceId: orderNumber,
                        reason: $"Giữ hàng 15 phút chờ thanh toán VNPay cho đơn {orderNumber}",
                        ct: ct
                    );

                    if (!reserveResult.IsSuccess)
                    {
                        throw new InvalidOperationException(
                            $"Sản phẩm '{variant.Product?.Name ?? variant.Name} ({variant.Name})' không đủ tồn kho khả dụng để đặt hàng.");
                    }

                    reservedTracker.Add((variant.Id, quantity));

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
                    if (shippingCalc.IsSuccess && shippingCalc.Data != null)
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
                        throw new InvalidOperationException(claimResult.Message ?? "Mã giảm giá không hợp lệ hoặc không đủ điều kiện.");
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
                    ToStatus = OrderStatus.PendingPayment,
                    ChangedByUserId = userId,
                    ChangedByName = userId.HasValue ? "Khách hàng" : "Khách vãng lai",
                    Reason = "Khởi tạo đơn hàng thanh toán qua cổng VNPay",
                    CreatedAt = now
                };

                var order = new Order
                {
                    Id = orderId,
                    OrderNumber = orderNumber,
                    UserId = userId,
                    CustomerEmail = recipientEmail,
                    CustomerPhone = recipientPhone,
                    Status = OrderStatus.PendingPayment,       // Vòng đời: Khởi tạo là PendingPayment
                    PaymentStatus = PaymentStatus.Pending,     // Chưa thanh toán
                    PaymentMethod = PaymentMethod.VNPay,
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

                // Tạo bản ghi Payment khởi tạo (Pending)
                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    OrderNumber = orderNumber,
                    TxnRef = txnRef,
                    Amount = totalAmount,
                    Currency = "VND",
                    PaymentMethod = PaymentMethod.VNPay,
                    Status = PaymentStatus.Pending,
                    OrderInfo = $"Thanh toan don hang {orderNumber}",
                    IpAddress = ipAddress,
                    RawPayload = "{}",
                    CreatedAt = now
                };

                _context.Payments.Add(payment);

                // Dọn dẹp giỏ hàng
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

                // Sinh URL thanh toán có chữ ký HMAC-SHA512
                string paymentUrl = CreatePaymentUrl(order, txnRef, ipAddress);

                _logger.LogInformation("Successfully created VNPay Order {OrderNumber} with Total: {Total:N0}đ. PaymentUrl generated.",
                    orderNumber, totalAmount);

                return Result<CheckoutVnpayResponseDto>.Success(
                    new CheckoutVnpayResponseDto(MapOrderToDto(order), paymentUrl, txnRef, expiresAt),
                    "Tạo đơn hàng chờ thanh toán VNPay thành công.");
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);

                foreach (var (variantId, quantity) in reservedTracker)
                {
                    try
                    {
                        await _inventoryService.ReleaseAsync(
                            variantId, quantity, "Order", orderNumber, "Rollback do xung đột coupon VNPay", ct);
                    }
                    catch { }
                }

                _logger.LogWarning(ex, "Concurrency conflict during VNPay order creation {OrderNumber}", orderNumber);
                return Result<CheckoutVnpayResponseDto>.Failure("Mã giảm giá đã hết lượt sử dụng do có nhiều người cùng đặt hàng. Vui lòng thử lại với mã khác.");
            }
            catch (Exception ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);

                foreach (var (variantId, quantity) in reservedTracker)
                {
                    try
                    {
                        await _inventoryService.ReleaseAsync(
                            variantId, quantity, "Order", orderNumber, "Rollback do lỗi tạo đơn VNPay", ct);
                    }
                    catch (Exception rbEx)
                    {
                        _logger.LogError(rbEx, "Failed to rollback stock for variant {VariantId}", variantId);
                    }
                }

                _logger.LogError(ex, "Failed to checkout VNPay for order {OrderNumber}", orderNumber);
                return Result<CheckoutVnpayResponseDto>.Failure(ex.Message);
            }
        });
    }

    /// <inheritdoc />
    public async Task<Result<PaymentUrlResponseDto>> CreatePaymentUrlForOrderAsync(
        string orderNumber,
        string ipAddress,
        string? customReturnUrl = null,
        CancellationToken ct = default)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim().ToUpper(), ct);

        if (order == null)
        {
            return Result<PaymentUrlResponseDto>.Failure("Không tìm thấy thông tin đơn hàng.");
        }

        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            return Result<PaymentUrlResponseDto>.Failure("Đơn hàng này đã được thanh toán thành công.");
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            return Result<PaymentUrlResponseDto>.Failure("Đơn hàng này đã bị hủy, không thể tiếp tục thanh toán.");
        }

        // Tạo txnRef mới cho lần retry thanh toán nếu cần
        string txnRef = $"{order.OrderNumber}_{DateTime.UtcNow.Ticks % 1000000}";

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            TxnRef = txnRef,
            Amount = order.TotalAmount,
            Currency = "VND",
            PaymentMethod = PaymentMethod.VNPay,
            Status = PaymentStatus.Pending,
            OrderInfo = $"Thanh toan don hang {order.OrderNumber}",
            IpAddress = ipAddress,
            RawPayload = "{}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync(ct);

        string paymentUrl = CreatePaymentUrl(order, txnRef, ipAddress, customReturnUrl);
        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.PaymentExpiryMinutes);

        return Result<PaymentUrlResponseDto>.Success(
            new PaymentUrlResponseDto(paymentUrl, order.OrderNumber, txnRef, expiresAt));
    }

    /// <inheritdoc />
    public async Task<VnpayIpnResponseDto> ProcessIpnAsync(
        IReadOnlyDictionary<string, string> queryParams,
        CancellationToken ct = default)
    {
        // 1. Kiểm tra chữ ký số
        var incomingHash = queryParams.GetValueOrDefault("vnp_SecureHash")
                           ?? queryParams.GetValueOrDefault("vnp_securehash");

        if (string.IsNullOrWhiteSpace(incomingHash) || !ValidateSignature(queryParams, incomingHash))
        {
            _logger.LogWarning("VNPay IPN: Invalid checksum. Hash: {Hash}", incomingHash);
            return new VnpayIpnResponseDto("97", "Invalid Checksum");
        }

        // 2. Lấy txnRef và số tiền
        var txnRef = queryParams.GetValueOrDefault("vnp_TxnRef")
                     ?? queryParams.GetValueOrDefault("vnp_txnref") ?? string.Empty;

        var amountStr = queryParams.GetValueOrDefault("vnp_Amount")
                        ?? queryParams.GetValueOrDefault("vnp_amount");

        if (string.IsNullOrWhiteSpace(txnRef) || string.IsNullOrWhiteSpace(amountStr))
        {
            _logger.LogWarning("VNPay IPN: Missing TxnRef or Amount.");
            return new VnpayIpnResponseDto("99", "Input data required");
        }

        if (!long.TryParse(amountStr, out var rawAmount))
        {
            return new VnpayIpnResponseDto("04", "Invalid amount");
        }

        decimal paidAmount = (decimal)rawAmount / 100m;

        // 3. Tìm đơn hàng: Tra cứu theo TxnRef của bảng Payment hoặc theo OrderNumber
        var payment = await _context.Payments
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
            .FirstOrDefaultAsync(p => p.TxnRef == txnRef, ct);

        Order? order = payment?.Order;

        if (order == null)
        {
            // Trích xuất OrderNumber từ txnRef (phòng trường hợp txnRef có dạng {OrderNumber}_{ticks})
            string orderNumber = txnRef.Contains('_') ? txnRef.Split('_')[0] : txnRef;

            order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);
        }

        if (order == null)
        {
            _logger.LogWarning("VNPay IPN: Order not found for TxnRef {TxnRef}", txnRef);
            return new VnpayIpnResponseDto("01", "Order not found");
        }

        // 4. Kiểm tra số tiền có khớp chính xác không (Bảo vệ chống gian lận)
        if (Math.Abs(paidAmount - order.TotalAmount) > 0.01m)
        {
            _logger.LogWarning("VNPay IPN: Amount mismatch for order {OrderNumber}. Expected: {Expected}, Received: {Received}",
                order.OrderNumber, order.TotalAmount, paidAmount);
            return new VnpayIpnResponseDto("04", "Invalid amount");
        }

        // 5. Kiểm tra Idempotency: Nếu đơn hàng đã được xác nhận thanh toán trước đó
        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            _logger.LogInformation("VNPay IPN: Order {OrderNumber} is already confirmed. Returning idempotent code 02.",
                order.OrderNumber);
            return new VnpayIpnResponseDto("02", "Order already confirmed");
        }

        // 6. Xử lý kết quả giao dịch từ VNPay
        var responseCode = queryParams.GetValueOrDefault("vnp_ResponseCode") ?? "99";
        var transactionStatus = queryParams.GetValueOrDefault("vnp_TransactionStatus") ?? responseCode;
        var transactionNo = queryParams.GetValueOrDefault("vnp_TransactionNo");
        var bankCode = queryParams.GetValueOrDefault("vnp_BankCode");
        var bankTranNo = queryParams.GetValueOrDefault("vnp_BankTranNo");
        var cardType = queryParams.GetValueOrDefault("vnp_CardType");
        var payDateStr = queryParams.GetValueOrDefault("vnp_PayDate");

        DateTime? payTime = null;
        if (!string.IsNullOrWhiteSpace(payDateStr) && payDateStr.Length >= 14 &&
            DateTime.TryParseExact(payDateStr.Substring(0, 14), "yyyyMMddHHmmss", null,
                System.Globalization.DateTimeStyles.None, out var parsedTime))
        {
            payTime = parsedTime;
        }

        var rawPayloadJson = JsonSerializer.Serialize(queryParams);

        // Đảm bảo có bản ghi Payment để ghi nhận
        if (payment == null)
        {
            payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                TxnRef = txnRef,
                Amount = paidAmount,
                Currency = "VND",
                PaymentMethod = PaymentMethod.VNPay,
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);
        }

        payment.TransactionNo = transactionNo;
        payment.BankCode = bankCode;
        payment.BankTranNo = bankTranNo;
        payment.CardType = cardType;
        payment.ResponseCode = responseCode;
        payment.TransactionStatus = transactionStatus;
        payment.SecureHash = incomingHash;
        payment.RawPayload = rawPayloadJson;
        payment.PaymentTime = payTime ?? DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;

        if (responseCode == "00" && transactionStatus == "00")
        {
            // === GIAO DỊCH THÀNH CÔNG ===
            payment.Status = PaymentStatus.Paid;

            if (order.Status == OrderStatus.PendingPayment)
            {
                // 1. Commit tồn kho: Chuyển từ Reserved sang trừ kho thực tế (OnHand & Reserved)
                foreach (var item in order.Items)
                {
                    if (item.VariantId.HasValue && item.Quantity > 0)
                    {
                        var commitRes = await _inventoryService.CommitAsync(
                            item.VariantId.Value,
                            item.Quantity,
                            "Order",
                            order.OrderNumber,
                            $"Thanh toán VNPay thành công đơn {order.OrderNumber}",
                            ct);

                        if (!commitRes.IsSuccess)
                        {
                            _logger.LogWarning("VNPay Commit stock warning for variant {VariantId}: {Msg}",
                                item.VariantId, commitRes.Error);
                        }
                    }
                }

                // 2. Chuyển trạng thái đơn: PendingPayment -> Pending (chờ Sales xử lý theo docs/order-states.md)
                order.PaymentStatus = PaymentStatus.Paid;
                order.Status = OrderStatus.Pending;
                order.ExpiresAt = null; // Xóa thời hạn giữ hàng vì đã thanh toán thành công
                order.UpdatedAt = DateTime.UtcNow;

                var history = new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    FromStatus = OrderStatus.PendingPayment,
                    ToStatus = OrderStatus.Pending,
                    ChangedByName = "VNPay IPN Gateway",
                    Reason = $"Thanh toán VNPay thành công (Mã GD: {transactionNo}, Ngân hàng: {bankCode})",
                    CreatedAt = DateTime.UtcNow
                };
                _context.OrderStatusHistories.Add(history);

                await _context.SaveChangesAsync(ct);

                _logger.LogInformation("VNPay IPN: Payment successfully processed & committed for order {OrderNumber}. TransNo: {TransNo}",
                    order.OrderNumber, transactionNo);

                // Gửi email xác nhận thanh toán & đơn hàng qua hàng đợi (non-blocking)
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
                            PaymentMethod: "Thanh toán trực tuyến VNPay",
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
                        _logger.LogError(emailEx, "Lỗi khi đưa email xác nhận thanh toán VNPay đơn {OrderNumber} vào hàng đợi", order.OrderNumber);
                    }
                }

                return new VnpayIpnResponseDto("00", "Confirm Success");
            }
            else if (order.Status == OrderStatus.Cancelled)
            {
                // === XỬ LÝ IPN TRỄ (LATE IPN) CHO ĐƠN ĐÃ BỊ HỦY DO QUÁ HẠN ===
                // Hàng đã được hoàn kho trước đó bởi Job nền. KHÔNG hồi sinh đơn và KHÔNG trừ kho lại!
                // Ghi nhận tiền đã trừ tại VNPay và đánh dấu cờ hoàn tiền theo docs/order-states.md mục 5.2.
                order.PaymentStatus = PaymentStatus.Paid;
                order.UpdatedAt = DateTime.UtcNow;

                payment.OrderInfo = $"GIAO DICH TRE: Don hang {order.OrderNumber} da bi huy qua han truoc khi IPN thanh toan toi. Can hoan tien cho khach hang theo docs/order-states.md.";

                var history = new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    FromStatus = OrderStatus.Cancelled,
                    ToStatus = OrderStatus.Cancelled,
                    ChangedByName = "VNPay IPN Gateway (Late Payment)",
                    Reason = $"CẢNH BÁO BẤT THƯỜNG: Nhận thanh toán IPN thành công ({paidAmount:N0}đ, Mã GD: {transactionNo}) cho đơn hàng ĐÃ BỊ HỦY QUÁ HẠN. Hàng đã được giải phóng trước đó. Cần hoàn tiền theo docs/order-states.md.",
                    Note = "OVERDUE_PAYMENT_NEEDS_REFUND",
                    CreatedAt = DateTime.UtcNow
                };
                _context.OrderStatusHistories.Add(history);

                await _context.SaveChangesAsync(ct);

                _logger.LogWarning("VNPay IPN LATE PAYMENT: Received successful payment {PaidAmount:N0}đ for CANCELLED order {OrderNumber} (Txn: {TransNo}). Stock already released. Flagged for refund/manual reconciliation.",
                    paidAmount, order.OrderNumber, transactionNo);

                return new VnpayIpnResponseDto("00", "Confirm Success (Late payment recorded for refund)");
            }
            else
            {
                // Đơn hàng đang ở trạng thái khác (Confirmed, Processing, etc.)
                order.PaymentStatus = PaymentStatus.Paid;
                order.ExpiresAt = null;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(ct);
                return new VnpayIpnResponseDto("00", "Confirm Success");
            }
        }
        else
        {
            // === GIAO DỊCH THẤT BẠI HOẶC KHÁCH HỦY TẠI CỔNG ===
            payment.Status = PaymentStatus.Failed;

            // Nếu đơn hàng đang PendingPayment: chuyển sang Cancelled và giải phóng tồn kho
            if (order.Status == OrderStatus.PendingPayment)
            {
                foreach (var item in order.Items)
                {
                    if (item.VariantId.HasValue)
                    {
                        await _inventoryService.ReleaseAsync(
                            item.VariantId.Value,
                            item.Quantity,
                            "Order",
                            order.OrderNumber,
                            $"Giải phóng tồn kho do giao dịch VNPay không thành công (Code: {responseCode})",
                            ct
                        );
                    }
                }



                order.Status = OrderStatus.Cancelled;
                order.PaymentStatus = PaymentStatus.Failed;
                order.CancelReason = $"Thanh toán VNPay không thành công (Mã lỗi: {responseCode})";
                order.CancelledAt = DateTime.UtcNow;
                order.UpdatedAt = DateTime.UtcNow;

                var history = new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    FromStatus = OrderStatus.PendingPayment,
                    ToStatus = OrderStatus.Cancelled,
                    ChangedByName = "VNPay IPN Gateway",
                    Reason = $"Thanh toán VNPay thất bại hoặc bị hủy (Mã phản hồi: {responseCode})",
                    CreatedAt = DateTime.UtcNow
                };
                _context.OrderStatusHistories.Add(history);
            }

            await _context.SaveChangesAsync(ct);

            _logger.LogWarning("VNPay IPN: Payment failed for order {OrderNumber} with responseCode {Code}",
                order.OrderNumber, responseCode);

            return new VnpayIpnResponseDto("00", "Confirm Success");
        }
    }

    /// <inheritdoc />
    public async Task<Result<VnpayCallbackResultDto>> VerifyPaymentReturnAsync(
        IReadOnlyDictionary<string, string> queryParams,
        CancellationToken ct = default)
    {
        var incomingHash = queryParams.GetValueOrDefault("vnp_SecureHash")
                           ?? queryParams.GetValueOrDefault("vnp_securehash");

        if (string.IsNullOrWhiteSpace(incomingHash) || !ValidateSignature(queryParams, incomingHash))
        {
            return Result<VnpayCallbackResultDto>.Failure("Chữ ký bảo mật VNPay không hợp lệ (Sai checksum).");
        }

        var txnRef = queryParams.GetValueOrDefault("vnp_TxnRef")
                     ?? queryParams.GetValueOrDefault("vnp_txnref") ?? string.Empty;
        var responseCode = queryParams.GetValueOrDefault("vnp_ResponseCode") ?? "99";
        var transactionStatus = queryParams.GetValueOrDefault("vnp_TransactionStatus");
        var transactionNo = queryParams.GetValueOrDefault("vnp_TransactionNo");
        var bankCode = queryParams.GetValueOrDefault("vnp_BankCode");
        var amountStr = queryParams.GetValueOrDefault("vnp_Amount") ?? "0";

        decimal amount = long.TryParse(amountStr, out var rawAmount) ? (decimal)rawAmount / 100m : 0m;
        string orderNumber = txnRef.Contains('_') ? txnRef.Split('_')[0] : txnRef;

        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);

        if (order == null)
        {
            return Result<VnpayCallbackResultDto>.Failure($"Không tìm thấy thông tin đơn hàng {orderNumber}.");
        }

        bool isSuccess = responseCode == "00";
        string message = isSuccess
            ? "Giao dịch thanh toán trực tuyến qua VNPay thành công."
            : GetVnpayErrorMessage(responseCode);

        var resultDto = new VnpayCallbackResultDto(
            IsSuccess: isSuccess,
            OrderNumber: order.OrderNumber,
            Amount: amount > 0 ? amount : order.TotalAmount,
            TransactionNo: transactionNo,
            BankCode: bankCode,
            ResponseCode: responseCode,
            TransactionStatus: transactionStatus,
            Message: message,
            Status: order.PaymentStatus,
            OrderStatus: order.Status
        );

        return Result<VnpayCallbackResultDto>.Success(resultDto);
    }

    /// <inheritdoc />
    public async Task<VnpayIpnResponseDto> SimulateIpnAsync(
        SimulateIpnRequestDto request,
        CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber.Trim().ToUpper(), ct);

        if (order == null)
        {
            return new VnpayIpnResponseDto("01", "Order not found");
        }

        decimal amount = request.Amount ?? order.TotalAmount;
        long vnpAmount = (long)(amount * 100);

        var queryParams = new Dictionary<string, string>
        {
            { "vnp_Amount", vnpAmount.ToString() },
            { "vnp_BankCode", request.BankCode ?? "NCB" },
            { "vnp_BankTranNo", "VNP" + DateTime.UtcNow.Ticks.ToString().Substring(0, 10) },
            { "vnp_CardType", "ATM" },
            { "vnp_Command", "pay" },
            { "vnp_CreateDate", DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode", "VND" },
            { "vnp_OrderInfo", $"Thanh toan don hang {order.OrderNumber}" },
            { "vnp_PayDate", DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss") },
            { "vnp_ResponseCode", request.ResponseCode },
            { "vnp_TmnCode", _settings.TmnCode },
            { "vnp_TransactionNo", request.TransactionNo ?? DateTime.UtcNow.Ticks.ToString().Substring(0, 12) },
            { "vnp_TransactionStatus", request.ResponseCode },
            { "vnp_TxnRef", order.OrderNumber },
            { "vnp_Version", "2.1.0" }
        };

        string signature = GenerateSignature(queryParams);
        if (request.TamperSignature)
        {
            signature = "tampered_invalid_signature_123456789";
        }

        queryParams["vnp_SecureHash"] = signature;

        return await ProcessIpnAsync(queryParams, ct);
    }

    /// <inheritdoc />
    public string CreatePaymentUrl(Order order, string txnRef, string ipAddress, string? customReturnUrl = null)
    {
        long vnpAmount = (long)(order.TotalAmount * 100);
        string createDate = DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss");
        string expireDate = DateTime.UtcNow.AddHours(7).AddMinutes(_settings.PaymentExpiryMinutes).ToString("yyyyMMddHHmmss");
        string returnUrl = !string.IsNullOrWhiteSpace(customReturnUrl) ? customReturnUrl : _settings.ReturnUrl;

        var requestParams = new Dictionary<string, string>
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", _settings.TmnCode },
            { "vnp_Amount", vnpAmount.ToString() },
            { "vnp_CreateDate", createDate },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", string.IsNullOrWhiteSpace(ipAddress) ? "127.0.0.1" : ipAddress },
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", $"Thanh toan don hang {order.OrderNumber}" },
            { "vnp_OrderType", "other" },
            { "vnp_ReturnUrl", returnUrl },
            { "vnp_TxnRef", txnRef },
            { "vnp_ExpireDate", expireDate }
        };

        // Sắp xếp tham số theo chuẩn Alphabetical Ordinal
        var sortedParams = requestParams
            .Where(kv => !string.IsNullOrEmpty(kv.Value))
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .ToList();

        var queryBuilder = new StringBuilder();
        var hashDataBuilder = new StringBuilder();

        foreach (var kv in sortedParams)
        {
            if (hashDataBuilder.Length > 0)
            {
                hashDataBuilder.Append('&');
                queryBuilder.Append('&');
            }

            string encodedKey = WebUtility.UrlEncode(kv.Key);
            string encodedValue = WebUtility.UrlEncode(kv.Value);

            hashDataBuilder.Append(encodedKey).Append('=').Append(encodedValue);
            queryBuilder.Append(encodedKey).Append('=').Append(encodedValue);
        }

        string rawHashData = hashDataBuilder.ToString();
        string secureHash = ComputeHmacSha512(rawHashData, _settings.HashSecret);

        queryBuilder.Append("&vnp_SecureHash=").Append(secureHash);

        return $"{_settings.BaseUrl}?{queryBuilder}";
    }

    /// <inheritdoc />
    public bool ValidateSignature(IReadOnlyDictionary<string, string> queryParams, string secureHash)
    {
        if (string.IsNullOrWhiteSpace(secureHash)) return false;

        string calculatedHash = GenerateSignature(queryParams);
        return string.Equals(calculatedHash, secureHash, StringComparison.OrdinalIgnoreCase);
    }

    /// <inheritdoc />
    public string GenerateSignature(IReadOnlyDictionary<string, string> queryParams)
    {
        // Lấy tất cả tham số bắt đầu bằng vnp_, loại bỏ vnp_SecureHash và vnp_SecureHashType
        var sortedParams = queryParams
            .Where(kv => kv.Key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase) &&
                         !kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                         !kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase) &&
                         !string.IsNullOrEmpty(kv.Value))
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .ToList();

        var hashData = new StringBuilder();
        foreach (var kv in sortedParams)
        {
            if (hashData.Length > 0) hashData.Append('&');
            hashData.Append(WebUtility.UrlEncode(kv.Key))
                    .Append('=')
                    .Append(WebUtility.UrlEncode(kv.Value));
        }

        return ComputeHmacSha512(hashData.ToString(), _settings.HashSecret);
    }

    /// <inheritdoc />
    public async Task<Result<IReadOnlyList<PaymentDto>>> GetPaymentsByOrderAsync(
        string orderNumber,
        CancellationToken ct = default)
    {
        var payments = await _context.Payments
            .Where(p => p.OrderNumber == orderNumber.Trim().ToUpper())
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

    private static string ComputeHmacSha512(string message, string secretKey)
    {
        byte[] keyBytes = Encoding.UTF8.GetBytes(secretKey);
        byte[] messageBytes = Encoding.UTF8.GetBytes(message);

        using var hmac = new HMACSHA512(keyBytes);
        byte[] hash = hmac.ComputeHash(messageBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string GenerateOrderNumber()
    {
        var now = DateTime.UtcNow;
        var randomPart = RandomNumberGenerator.GetInt32(100000, 999999);
        return $"MK-{now:yyyyMMdd}-{randomPart}";
    }

    private static string GetVnpayErrorMessage(string responseCode) => responseCode switch
    {
        "00" => "Giao dịch thành công.",
        "07" => "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, bất thường).",
        "09" => "Giao dịch không thành công do: Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.",
        "10" => "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
        "11" => "Giao dịch không thành công do: Đã hết hạn chờ thanh toán.",
        "12" => "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
        "13" => "Giao dịch không thành công do nhập sai mật khẩu xác thực OTP.",
        "24" => "Giao dịch không thành công do khách hàng đã hủy giao dịch.",
        "51" => "Giao dịch không thành công do tài khoản không đủ số dư.",
        "65" => "Giao dịch không thành công do tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
        "75" => "Ngân hàng thanh toán đang bảo trì.",
        "79" => "Giao dịch không thành công do nhập sai mật khẩu thanh toán quá số lần quy định.",
        _ => $"Giao dịch thanh toán thất bại (Mã lỗi: {responseCode})."
    };

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

