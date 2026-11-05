using System.Text.Json;
using System.Text.RegularExpressions;
using MadK.Application.DTOs.Notifications;
using MadK.Application.DTOs.Payment;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MadK.Infrastructure.Services;

/// <summary>
/// Dịch vụ tiếp nhận và xử lý Webhook chuyển khoản ngân hàng tự động (VietQR / SePAY).
/// </summary>
public class BankTransferService : IBankTransferService
{
    private readonly IAppDbContext _context;
    private readonly IEmailSender? _emailSender;
    private readonly ITelegramNotificationService? _telegramService;
    private readonly ILogger<BankTransferService> _logger;
    private readonly BankTransferSettings _settings;

    // Regex trích xuất mã đơn hàng định dạng MK-... (e.g. MK-20261104-ABC123 hoặc MK2026...)
    private static readonly Regex OrderNumberRegex = new(
        @"(MK-[A-Za-z0-9-]+|MK[0-9]{8}[A-Za-z0-9]+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public BankTransferService(
        IAppDbContext context,
        IOptions<BankTransferSettings> options,
        IConfiguration configuration,
        ILogger<BankTransferService> logger,
        IEmailSender? emailSender = null,
        ITelegramNotificationService? telegramService = null)
    {
        _context = context;
        _logger = logger;
        _emailSender = emailSender;
        _telegramService = telegramService;
        _settings = options.Value ?? new BankTransferSettings();

        // Đọc cấu hình từ biến môi trường nếu có
        var envApiKey = configuration["SEPAY_API_KEY"] ?? configuration["BANK_TRANSFER_API_KEY"];
        if (!string.IsNullOrWhiteSpace(envApiKey))
        {
            _settings.ApiKey = envApiKey.Trim();
        }
    }

    public async Task<BankTransferWebhookResponseDto> ProcessSepayWebhookAsync(
        SepayWebhookDto dto,
        string? authHeader = null,
        CancellationToken ct = default)
    {
        if (dto == null)
        {
            return new BankTransferWebhookResponseDto(false, "Payload webhook rỗng.");
        }

        // 1. Xác thực bảo mật API Key nếu có cấu hình
        if (!string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            bool isAuthorized = false;
            if (!string.IsNullOrWhiteSpace(authHeader))
            {
                // SePAY hỗ trợ format: "Apikey {API_KEY}" hoặc token trực tiếp
                var token = authHeader.Replace("Apikey ", "", StringComparison.OrdinalIgnoreCase)
                                      .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)
                                      .Trim();
                isAuthorized = string.Equals(token, _settings.ApiKey, StringComparison.Ordinal);
            }

            if (!isAuthorized)
            {
                _logger.LogWarning("BankTransfer Webhook: Unauthorized attempt. Invalid or missing API Key.");
                return new BankTransferWebhookResponseDto(false, "Xác thực API Key thất bại.");
            }
        }

        // 2. Chỉ xử lý giao dịch tiền vào (tiền nạp vào tài khoản)
        if (!string.Equals(dto.TransferType, "in", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("BankTransfer Webhook: Ignored transferType '{Type}' (not 'in')", dto.TransferType);
            return new BankTransferWebhookResponseDto(true, "Bỏ qua giao dịch không phải tiền vào.");
        }

        // 3. Trích xuất mã đơn hàng từ nội dung chuyển khoản
        var fullText = $"{dto.Content} {dto.Description}".Trim();
        var orderNumber = ExtractOrderNumber(fullText);

        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            _logger.LogWarning("BankTransfer Webhook: Không tìm thấy mã đơn hàng hợp lệ trong nội dung '{Text}'", fullText);
            // Vẫn trả về success=false nhưng không throw error để webhook không retry vô ích
            return new BankTransferWebhookResponseDto(false, "Không tìm thấy mã đơn hàng trong nội dung chuyển khoản.");
        }

        // 4. Tìm kiếm đơn hàng trong Database
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);

        if (order == null)
        {
            _logger.LogWarning("BankTransfer Webhook: Không tìm thấy đơn hàng {OrderNumber} trong hệ thống", orderNumber);
            return new BankTransferWebhookResponseDto(false, $"Không tìm thấy đơn hàng {orderNumber}.", orderNumber);
        }

        // 5. Kiểm tra Idempotency (Tránh xử lý lặp khi webhook gửi lại nhiều lần)
        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            _logger.LogInformation("BankTransfer Webhook: Đơn hàng {OrderNumber} đã được thanh toán trước đó (Idempotent).", orderNumber);
            return new BankTransferWebhookResponseDto(true, "Đơn hàng đã được thanh toán trước đó.", orderNumber, order.TotalAmount);
        }

        // 6. Đối soát số tiền
        if (dto.TransferAmount < order.TotalAmount)
        {
            var warningNote = $"[VietQR Cảnh báo] Khách chuyển thiếu tiền vào {DateTime.UtcNow:yyyy-MM-dd HH:mm}: Nhận {dto.TransferAmount:N0}đ, cần {order.TotalAmount:N0}đ (Ref: {dto.ReferenceCode})";
            order.AdminNote = string.IsNullOrWhiteSpace(order.AdminNote) ? warningNote : $"{order.AdminNote}\n{warningNote}";
            await _context.SaveChangesAsync(ct);

            _logger.LogWarning("BankTransfer Webhook: Đơn {OrderNumber} chuyển thiếu tiền: Nhận {Received:N0}đ / Cần {Required:N0}đ",
                orderNumber, dto.TransferAmount, order.TotalAmount);

            return new BankTransferWebhookResponseDto(false,
                $"Số tiền chuyển ({dto.TransferAmount:N0}đ) nhỏ hơn tổng đơn hàng ({order.TotalAmount:N0}đ).",
                orderNumber, dto.TransferAmount);
        }

        // 7. Cập nhật trạng thái đơn hàng -> ĐÃ THANH TOÁN (Paid) & ĐANG XỬ LÝ (Processing)
        var oldStatus = order.Status;
        order.PaymentStatus = PaymentStatus.Paid;
        order.PaymentMethod = PaymentMethod.BankTransfer;

        if (order.Status == OrderStatus.Pending || order.Status == OrderStatus.PendingPayment)
        {
            order.Status = OrderStatus.Processing;
        }

        order.UpdatedAt = DateTime.UtcNow;

        // Ghi nhận bản ghi thanh toán vào bảng Payments
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            TxnRef = dto.ReferenceCode ?? $"SEPAY_{dto.Id}",
            TransactionNo = dto.ReferenceCode ?? dto.Id.ToString(),
            Amount = dto.TransferAmount,
            Currency = "VND",
            PaymentMethod = PaymentMethod.BankTransfer,
            Status = PaymentStatus.Paid,
            BankCode = dto.Gateway ?? _settings.BankName,
            BankTranNo = dto.ReferenceCode,
            OrderInfo = dto.Content ?? $"Thanh toan don hang {order.OrderNumber}",
            IpAddress = "Webhook",
            RawPayload = JsonSerializer.Serialize(dto),
            CreatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);

        // Ghi lịch sử trạng thái đơn
        var history = new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            FromStatus = oldStatus,
            ToStatus = order.Status,
            ChangedByName = "VietQR Bank Webhook",
            Reason = $"Tự động duyệt đơn: Nhận {dto.TransferAmount:N0}đ qua {dto.Gateway ?? _settings.BankName} (Mã GD: {dto.ReferenceCode})",
            CreatedAt = DateTime.UtcNow
        };
        _context.OrderStatusHistories.Add(history);

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("BankTransfer Webhook: THÀNH CÔNG duyệt đơn {OrderNumber}. Nhận {Amount:N0}đ.",
            orderNumber, dto.TransferAmount);

        // 8. Gửi email xác nhận thanh toán tự động cho khách
        if (_emailSender != null && !string.IsNullOrWhiteSpace(order.CustomerEmail))
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
                    RecipientEmail: order.CustomerEmail,
                    RecipientName: "Khách hàng",
                    RecipientPhone: order.CustomerPhone ?? "",
                    ShippingAddress: order.ShippingAddressSnapshot,
                    PaymentMethod: "Chuyển khoản VietQR (Techcombank) - ĐÃ THANH TOÁN",
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
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send confirmation email for auto-paid order {OrderNumber}", orderNumber);
            }
        }

        // 9. Bắn thông báo Telegram Bot tới Ban Quản Trị (tiền về tài khoản)
        if (_telegramService != null)
        {
            _ = _telegramService.SendPaymentReceivedAlertAsync(
                orderNumber,
                dto.TransferAmount,
                dto.Gateway ?? _settings.BankName,
                dto.ReferenceCode,
                ct);
        }

        return new BankTransferWebhookResponseDto(true, "Tự động duyệt đơn hàng thành công.", orderNumber, dto.TransferAmount);
    }

    public async Task<BankTransferWebhookResponseDto> SimulateTransferAsync(
        SimulateBankTransferRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.OrderNumber))
        {
            return new BankTransferWebhookResponseDto(false, "Vui lòng cung cấp mã đơn hàng.");
        }

        var sepayPayload = new SepayWebhookDto
        {
            Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Gateway = "Techcombank",
            TransactionDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
            AccountNumber = _settings.AccountNumber,
            TransferType = "in",
            TransferAmount = dto.Amount,
            Content = dto.Content ?? $"MADK {dto.OrderNumber} thanh toan",
            Description = dto.Content ?? $"MADK {dto.OrderNumber}",
            ReferenceCode = $"SIM_{Guid.NewGuid():N}"[..18]
        };

        // Bỏ qua xác thực authHeader khi gọi hàm simulate
        return await ProcessSepayWebhookAsync(sepayPayload, _settings.ApiKey, ct);
    }

    /// <summary>
    /// Trích xuất mã đơn hàng từ nội dung chuyển khoản.
    /// Ưu tiên tìm pattern MK-...
    /// </summary>
    private static string? ExtractOrderNumber(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var match = OrderNumberRegex.Match(text);
        if (match.Success)
        {
            return match.Value.ToUpperInvariant();
        }

        return null;
    }
}
