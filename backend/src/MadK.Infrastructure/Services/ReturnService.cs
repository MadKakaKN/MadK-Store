using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Returns;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

/// <summary>
/// Triển khai nghiệp vụ Yêu cầu Đổi trả (Returns) và Hoàn tiền (Refunds).
/// Đảm bảo tính toàn vẹn: Không hoàn quá số đã thanh toán, không hoàn 2 lần (Idempotent),
/// cập nhật tồn kho khi nhận lại hàng và ghi nhận đầy đủ AuditLog.
/// </summary>
public class ReturnService : IReturnService
{
    private readonly IAppDbContext _context;
    private readonly DbContext _efContext;
    private readonly IInventoryService _inventoryService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<ReturnService> _logger;

    public ReturnService(
        IAppDbContext context,
        IInventoryService inventoryService,
        IAuditLogService auditLogService,
        ILogger<ReturnService> logger)
    {
        _context = context;
        _efContext = (DbContext)context;
        _inventoryService = inventoryService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<Result<ReturnRequestDto>> CreateReturnRequestAsync(
        string orderNumber,
        Guid? userId,
        CreateReturnRequestDto request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return Result<ReturnRequestDto>.Failure("Mã đơn hàng không hợp lệ.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            return Result<ReturnRequestDto>.Failure("Vui lòng cung cấp lý do yêu cầu đổi trả.");

        var cleanOrderNumber = orderNumber.Trim().ToUpper();
        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.OrderNumber == cleanOrderNumber, ct);

        if (order == null)
            return Result<ReturnRequestDto>.Failure("Không tìm thấy đơn hàng.");

        // Chống IDOR: Khách hàng chỉ được gửi yêu cầu cho đơn của chính mình
        if (userId.HasValue && order.UserId.HasValue && order.UserId.Value != userId.Value)
        {
            return Result<ReturnRequestDto>.Failure("Bạn không có quyền gửi yêu cầu đổi trả cho đơn hàng này.");
        }

        // Quy tắc theo docs/order-states.md: Chỉ được đổi trả khi đơn ở trạng thái Completed (hoặc Returned nếu đang xử lý)
        if (order.Status != OrderStatus.Completed)
        {
            return Result<ReturnRequestDto>.Failure($"Không thể yêu cầu đổi trả cho đơn hàng ở trạng thái '{order.Status}'. Chỉ áp dụng cho đơn đã hoàn tất giao hàng (Completed).");
        }

        // Kiểm tra xem đơn hàng đã có yêu cầu đổi trả nào đang hoạt động chưa
        var hasActiveRequest = await _context.ReturnRequests
            .AnyAsync(r => r.OrderId == order.Id &&
                          (r.Status == ReturnRequestStatus.Pending || r.Status == ReturnRequestStatus.Approved), ct);

        if (hasActiveRequest)
        {
            return Result<ReturnRequestDto>.Failure("Đơn hàng này đang có một yêu cầu đổi trả đang chờ xử lý.");
        }

        // Kiểm tra tổng tiền đã thanh toán và đã hoàn
        var (totalPaid, totalRefunded, maxRefundable) = await GetOrderFinancialsAsync(order, ct);
        if (maxRefundable <= 0)
        {
            return Result<ReturnRequestDto>.Failure("Đơn hàng chưa được thanh toán hoặc đã được hoàn tiền đầy đủ.");
        }

        // Xử lý danh sách sản phẩm đổi trả
        var itemsToReturn = new List<ReturnRequestItem>();
        decimal calculatedRefundAmount = 0m;

        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var reqItem in request.Items)
            {
                if (reqItem.Quantity <= 0) continue;

                var orderItem = order.Items.FirstOrDefault(i => i.VariantId == reqItem.VariantId);
                if (orderItem == null)
                {
                    return Result<ReturnRequestDto>.Failure("Một trong các sản phẩm yêu cầu đổi trả không thuộc đơn hàng này.");
                }

                if (reqItem.Quantity > orderItem.Quantity)
                {
                    return Result<ReturnRequestDto>.Failure(
                        $"Số lượng yêu cầu đổi trả cho '{orderItem.ProductNameSnapshot}' ({reqItem.Quantity}) vượt quá số lượng đã mua ({orderItem.Quantity}).");
                }

                var lineTotal = orderItem.UnitPriceSnapshot * reqItem.Quantity;
                calculatedRefundAmount += lineTotal;

                itemsToReturn.Add(new ReturnRequestItem
                {
                    Id = Guid.NewGuid(),
                    OrderItemId = orderItem.Id,
                    VariantId = orderItem.VariantId,
                    ProductName = orderItem.ProductNameSnapshot,
                    VariantName = orderItem.VariantNameSnapshot,
                    Sku = orderItem.SkuSnapshot,
                    Quantity = reqItem.Quantity,
                    UnitPrice = orderItem.UnitPriceSnapshot,
                    TotalPrice = lineTotal,
                    Reason = reqItem.Reason ?? request.Reason,
                    Condition = reqItem.Condition ?? "Đã mở hộp"
                });
            }
        }
        else
        {
            // Mặc định: Trả toàn bộ đơn hàng
            foreach (var orderItem in order.Items)
            {
                calculatedRefundAmount += orderItem.TotalPrice;
                itemsToReturn.Add(new ReturnRequestItem
                {
                    Id = Guid.NewGuid(),
                    OrderItemId = orderItem.Id,
                    VariantId = orderItem.VariantId,
                    ProductName = orderItem.ProductNameSnapshot,
                    VariantName = orderItem.VariantNameSnapshot,
                    Sku = orderItem.SkuSnapshot,
                    Quantity = orderItem.Quantity,
                    UnitPrice = orderItem.UnitPriceSnapshot,
                    TotalPrice = orderItem.TotalPrice,
                    Reason = request.Reason,
                    Condition = "Đã nhận hàng"
                });
            }
        }

        if (itemsToReturn.Count == 0)
        {
            return Result<ReturnRequestDto>.Failure("Cần chọn ít nhất một sản phẩm hợp lệ để đổi trả.");
        }

        // Đảm bảo không hoàn quá số tiền tối đa có thể hoàn của đơn
        var finalRefundAmount = Math.Min(calculatedRefundAmount, maxRefundable);

        var now = DateTime.UtcNow;
        var returnRequest = new ReturnRequest
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Order = order,
            OrderNumber = order.OrderNumber,
            UserId = order.UserId,
            CustomerName = order.CustomerEmail,
            CustomerEmail = order.CustomerEmail,
            CustomerPhone = order.CustomerPhone,
            Status = ReturnRequestStatus.Pending,
            Reason = request.Reason.Trim(),
            CustomerNote = request.CustomerNote?.Trim(),
            RefundAmount = finalRefundAmount,
            RefundStatus = RefundStatus.Pending,
            Items = itemsToReturn,
            CreatedAt = now
        };

        order.ReturnRequests.Add(returnRequest);

        // Chuyển trạng thái đơn sang ReturnRequested theo docs/order-states.md
        order.Status = OrderStatus.ReturnRequested;
        order.UpdatedAt = now;

        var history = new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            FromStatus = OrderStatus.Completed,
            ToStatus = OrderStatus.ReturnRequested,
            ChangedByUserId = userId,
            ChangedByName = userId.HasValue ? "Khách hàng" : "Khách vãng lai",
            Reason = $"Khách hàng gửi yêu cầu đổi trả: {request.Reason.Trim()}",
            CreatedAt = now
        };

        _context.ReturnRequests.Add(returnRequest);
        _context.OrderStatusHistories.Add(history);
        order.StatusHistories.Add(history);

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Return request {RequestId} created for order {OrderNumber} by user {UserId}. RefundAmount: {Refund:N0}đ",
            returnRequest.Id, order.OrderNumber, userId, finalRefundAmount);

        // Ghi AuditLog
        await _auditLogService.LogAsync(
            action: "RETURN_REQUEST_CREATED",
            entityName: "ReturnRequest",
            entityId: returnRequest.Id.ToString(),
            oldValues: null,
            newValues: new
            {
                returnRequest.Id,
                returnRequest.OrderNumber,
                returnRequest.Reason,
                returnRequest.RefundAmount,
                ItemCount = itemsToReturn.Count
            },
            userId: userId,
            userEmail: order.CustomerEmail,
            userRole: "Customer",
            note: $"Khách hàng gửi yêu cầu đổi trả cho đơn {order.OrderNumber}",
            ct: ct);

        return Result<ReturnRequestDto>.Success(MapToDto(returnRequest), "Tạo yêu cầu đổi trả thành công. Nhân viên sẽ liên hệ và xử lý trong thời gian sớm nhất.");
    }

    /// <inheritdoc />
    public async Task<Result<ReturnRequestDto>> GetReturnRequestByIdAsync(
        Guid id,
        Guid? userId,
        bool isStaffOrAdmin,
        CancellationToken ct = default)
    {
        var returnRequest = await _context.ReturnRequests
            .Include(r => r.Items)
            .Include(r => r.Order)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (returnRequest == null)
            return Result<ReturnRequestDto>.Failure("Không tìm thấy yêu cầu đổi trả.");

        // Chống IDOR
        if (returnRequest.UserId.HasValue && !isStaffOrAdmin)
        {
            if (!userId.HasValue || returnRequest.UserId.Value != userId.Value)
            {
                return Result<ReturnRequestDto>.Failure("Bạn không có quyền xem yêu cầu đổi trả này.");
            }
        }

        return Result<ReturnRequestDto>.Success(MapToDto(returnRequest));
    }

    /// <inheritdoc />
    public async Task<Result<IReadOnlyList<ReturnRequestDto>>> GetReturnRequestsByOrderAsync(
        string orderNumber,
        Guid? userId,
        bool isStaffOrAdmin,
        CancellationToken ct = default)
    {
        var clean = orderNumber.Trim().ToUpper();
        var query = _context.ReturnRequests
            .Include(r => r.Items)
            .AsNoTracking()
            .Where(r => r.OrderNumber == clean);

        if (!isStaffOrAdmin && userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var list = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        var dtos = list.Select(MapToDto).ToList();
        return Result<IReadOnlyList<ReturnRequestDto>>.Success(dtos);
    }

    /// <inheritdoc />
    public async Task<Result<PagedResult<ReturnRequestDto>>> GetAllReturnRequestsAsync(
        ReturnFilterDto filter,
        CancellationToken ct = default)
    {
        var query = _context.ReturnRequests
            .Include(r => r.Items)
            .AsNoTracking()
            .AsQueryable();

        if (filter.Status.HasValue)
        {
            query = query.Where(r => r.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToLower();
            query = query.Where(r =>
                r.OrderNumber.ToLower().Contains(s) ||
                (r.CustomerEmail != null && r.CustomerEmail.ToLower().Contains(s)) ||
                (r.CustomerPhone != null && r.CustomerPhone.Contains(s)) ||
                r.Reason.ToLower().Contains(s));
        }

        var total = await query.CountAsync(ct);
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapToDto).ToList();
        return Result<PagedResult<ReturnRequestDto>>.Success(new PagedResult<ReturnRequestDto>(dtos, total, page, pageSize));
    }

    /// <inheritdoc />
    public async Task<Result<ReturnRequestDto>> ApproveReturnRequestAsync(
        Guid returnRequestId,
        Guid staffUserId,
        string staffName,
        string staffEmail,
        string staffRole,
        ApproveReturnRequestDto request,
        CancellationToken ct = default)
    {
        var returnRequest = await _context.ReturnRequests
            .Include(r => r.Items)
            .Include(r => r.Order)
                .ThenInclude(o => o!.StatusHistories)
            .FirstOrDefaultAsync(r => r.Id == returnRequestId, ct);

        if (returnRequest == null)
            return Result<ReturnRequestDto>.Failure("Không tìm thấy yêu cầu đổi trả.");

        if (returnRequest.Status != ReturnRequestStatus.Pending)
        {
            return Result<ReturnRequestDto>.Failure($"Không thể duyệt yêu cầu ở trạng thái '{returnRequest.Status}'. Yêu cầu phải ở trạng thái Chờ duyệt (Pending).");
        }

        var now = DateTime.UtcNow;
        returnRequest.Status = ReturnRequestStatus.Approved;
        returnRequest.SalesNote = request.SalesNote?.Trim();
        returnRequest.ProcessedByUserId = staffUserId;
        returnRequest.ProcessedByName = staffName;
        returnRequest.ProcessedAt = now;
        returnRequest.UpdatedAt = now;

        var order = returnRequest.Order ?? await _context.Orders
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.Id == returnRequest.OrderId, ct);

        if (order != null)
        {
            var history = new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = returnRequest.OrderId,
                FromStatus = order.Status,
                ToStatus = order.Status,
                ChangedByUserId = staffUserId,
                ChangedByName = staffName,
                Reason = "Sales duyệt yêu cầu đổi trả: " + (request.SalesNote?.Trim() ?? "Đồng ý tiếp nhận hàng đổi trả"),
                Note = "RETURN_APPROVED",
                CreatedAt = now
            };
            _context.OrderStatusHistories.Add(history);
            order.StatusHistories.Add(history);
            order.UpdatedAt = now;
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Return request {RequestId} approved by {StaffName} ({StaffEmail})",
            returnRequest.Id, staffName, staffEmail);

        await _auditLogService.LogAsync(
            action: "RETURN_REQUEST_APPROVED",
            entityName: "ReturnRequest",
            entityId: returnRequest.Id.ToString(),
            oldValues: new { Status = ReturnRequestStatus.Pending.ToString() },
            newValues: new { Status = ReturnRequestStatus.Approved.ToString(), SalesNote = request.SalesNote },
            userId: staffUserId,
            userEmail: staffEmail,
            userRole: staffRole,
            note: $"Nhân viên {staffName} duyệt yêu cầu đổi trả {returnRequest.Id} đơn {returnRequest.OrderNumber}",
            ct: ct);

        return Result<ReturnRequestDto>.Success(MapToDto(returnRequest), "Duyệt yêu cầu đổi trả thành công. Đang chờ khách gửi hàng về kho.");
    }

    /// <inheritdoc />
    public async Task<Result<ReturnRequestDto>> RejectReturnRequestAsync(
        Guid returnRequestId,
        Guid staffUserId,
        string staffName,
        string staffEmail,
        string staffRole,
        RejectReturnRequestDto request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request?.RejectionReason))
        {
            return Result<ReturnRequestDto>.Failure("Vui lòng nhập lý do từ chối yêu cầu đổi trả.");
        }

        var returnRequest = await _context.ReturnRequests
            .Include(r => r.Items)
            .Include(r => r.Order)
                .ThenInclude(o => o!.StatusHistories)
            .FirstOrDefaultAsync(r => r.Id == returnRequestId, ct);

        if (returnRequest == null)
            return Result<ReturnRequestDto>.Failure("Không tìm thấy yêu cầu đổi trả.");

        if (returnRequest.Status != ReturnRequestStatus.Pending && returnRequest.Status != ReturnRequestStatus.Approved)
        {
            return Result<ReturnRequestDto>.Failure($"Không thể từ chối yêu cầu ở trạng thái '{returnRequest.Status}'.");
        }

        var now = DateTime.UtcNow;
        var oldStatus = returnRequest.Status;

        returnRequest.Status = ReturnRequestStatus.Rejected;
        returnRequest.RejectionReason = request.RejectionReason.Trim();
        returnRequest.RefundStatus = RefundStatus.NotApplicable;
        returnRequest.ProcessedByUserId = staffUserId;
        returnRequest.ProcessedByName = staffName;
        returnRequest.ProcessedAt = now;
        returnRequest.UpdatedAt = now;

        // Theo docs/order-states.md: ReturnRequested -> Completed (khi Sales từ chối đổi trả)
        var order = returnRequest.Order ?? await _context.Orders
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.Id == returnRequest.OrderId, ct);

        if (order != null)
        {
            var oldOrderStatus = order.Status;
            order.Status = OrderStatus.Completed;
            order.UpdatedAt = now;

            var history = new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = returnRequest.OrderId,
                FromStatus = oldOrderStatus,
                ToStatus = OrderStatus.Completed,
                ChangedByUserId = staffUserId,
                ChangedByName = staffName,
                Reason = $"Từ chối yêu cầu đổi trả: {request.RejectionReason.Trim()}",
                Note = "RETURN_REJECTED",
                CreatedAt = now
            };
            _context.OrderStatusHistories.Add(history);
            order.StatusHistories.Add(history);
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Return request {RequestId} rejected by {StaffName}. Reason: {Reason}",
            returnRequest.Id, staffName, request.RejectionReason);

        await _auditLogService.LogAsync(
            action: "RETURN_REQUEST_REJECTED",
            entityName: "ReturnRequest",
            entityId: returnRequest.Id.ToString(),
            oldValues: new { Status = oldStatus.ToString() },
            newValues: new { Status = ReturnRequestStatus.Rejected.ToString(), RejectionReason = request.RejectionReason },
            userId: staffUserId,
            userEmail: staffEmail,
            userRole: staffRole,
            note: $"Từ chối yêu cầu đổi trả đơn {returnRequest.OrderNumber}: {request.RejectionReason.Trim()}",
            ct: ct);

        return Result<ReturnRequestDto>.Success(MapToDto(returnRequest), "Đã từ chối yêu cầu đổi trả.");
    }

    /// <inheritdoc />
    public async Task<Result<ReturnRequestDto>> CompleteReturnAndRefundAsync(
        Guid returnRequestId,
        Guid staffUserId,
        string staffName,
        string staffEmail,
        string staffRole,
        ProcessReturnRefundDto request,
        CancellationToken ct = default)
    {
        var returnRequest = await _context.ReturnRequests
            .Include(r => r.Items)
            .Include(r => r.Order)
                .ThenInclude(o => o!.StatusHistories)
            .FirstOrDefaultAsync(r => r.Id == returnRequestId, ct);

        if (returnRequest == null)
            return Result<ReturnRequestDto>.Failure("Không tìm thấy yêu cầu đổi trả.");

        // 1. KIỂM TRA IDEMPOTENCY: Không xử lý hoàn tiền 2 lần cho cùng một yêu cầu
        if (returnRequest.Status == ReturnRequestStatus.Completed || returnRequest.RefundStatus == RefundStatus.Refunded)
        {
            _logger.LogInformation("Return request {RequestId} already completed and refunded. Returning idempotent response.", returnRequestId);
            return Result<ReturnRequestDto>.Failure("Yêu cầu đổi trả này đã được hoàn tất và hoàn tiền trước đó (Idempotent).");
        }

        if (returnRequest.Status != ReturnRequestStatus.Approved && returnRequest.Status != ReturnRequestStatus.Pending)
        {
            return Result<ReturnRequestDto>.Failure($"Không thể hoàn tất yêu cầu ở trạng thái '{returnRequest.Status}'. Yêu cầu phải được duyệt trước.");
        }

        var order = returnRequest.Order ?? await _context.Orders
            .Include(o => o.Payments)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.Id == returnRequest.OrderId, ct);
        if (order == null)
        {
            return Result<ReturnRequestDto>.Failure("Không tìm thấy thông tin đơn hàng tương ứng.");
        }

        // 2. TÍNH TOÁN VÀ KIỂM SOÁT HẠN MỨC HOÀN TIỀN: Không hoàn quá số đã thanh toán!
        var (totalPaid, totalRefunded, maxRefundable) = await GetOrderFinancialsAsync(order, ct);
        decimal effectiveRefund = request.RefundAmount ?? returnRequest.RefundAmount;

        if (effectiveRefund <= 0)
        {
            return Result<ReturnRequestDto>.Failure("Số tiền hoàn phải lớn hơn 0đ.");
        }

        if (effectiveRefund > maxRefundable)
        {
            return Result<ReturnRequestDto>.Failure(
                $"Số tiền hoàn ({effectiveRefund:N0}đ) vượt quá số tiền có thể hoàn tối đa ({maxRefundable:N0}đ) của đơn hàng {order.OrderNumber}.");
        }

        // Khóa Idempotency cho giao dịch hoàn tiền
        var idempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey)
            ? $"REFUND_{returnRequest.Id}"
            : request.IdempotencyKey.Trim();

        var existingRefundPayment = await _context.Payments
            .FirstOrDefaultAsync(p => p.TxnRef == idempotencyKey, ct);

        if (existingRefundPayment != null)
        {
            return Result<ReturnRequestDto>.Failure("Giao dịch hoàn tiền này đã được thực hiện trước đó (Idempotent).");
        }

        bool isRelational = _efContext.Database.IsRelational();
        await using var tx = isRelational ? await _efContext.Database.BeginTransactionAsync(ct) : null;

        try
        {
            var now = DateTime.UtcNow;

            // 3. CẬP NHẬT TỒN KHO: Khi hàng trả về được nhập lại vào kho (+OnHandQuantity)
            if (request.RestockInventory && !returnRequest.IsRestocked)
            {
                foreach (var item in returnRequest.Items)
                {
                    if (item.VariantId.HasValue && item.Quantity > 0)
                    {
                        var restockResult = await _inventoryService.RestockAsync(
                            variantId: item.VariantId.Value,
                            quantity: item.Quantity,
                            reason: $"Nhập kho hàng trả về từ đơn {order.OrderNumber} (Yêu cầu đổi trả #{returnRequest.Id.ToString()[..8]})",
                            referenceType: "ReturnRestock",
                            referenceId: returnRequest.Id.ToString(),
                            ct: ct);

                        if (!restockResult.IsSuccess)
                        {
                            _logger.LogWarning("Restock warning for variant {VariantId}: {Err}", item.VariantId, restockResult.Error);
                        }
                    }
                }

                returnRequest.IsRestocked = true;
                returnRequest.RestockedAt = now;
            }

            // 4. GHI NHẬN BẢN GHI HOÀN TIỀN VÀO BẢNG PAYMENTS
            var refundTransactionNo = $"REF_{Guid.NewGuid().ToString("N")[..10].ToUpper()}";
            var refundPayment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                TxnRef = idempotencyKey,
                TransactionNo = refundTransactionNo,
                Amount = effectiveRefund,
                Currency = "VND",
                PaymentMethod = order.PaymentMethod,
                Status = PaymentStatus.Refunded,
                OrderInfo = $"Hoan tien don hang {order.OrderNumber} (Yeu cau doi tra {returnRequest.Id.ToString()[..8]})",
                ResponseCode = "00",
                TransactionStatus = "00",
                RawPayload = JsonSerializer.Serialize(new
                {
                    type = "REFUND",
                    returnRequestId = returnRequest.Id,
                    orderNumber = order.OrderNumber,
                    refundAmount = effectiveRefund,
                    staffUserId,
                    staffName,
                    staffEmail,
                    note = request.Note,
                    processedAt = now
                }),
                PaymentTime = now,
                CreatedAt = now
            };

            _context.Payments.Add(refundPayment);

            // 5. CẬP NHẬT TRẠNG THÁI YÊU CẦU ĐỔI TRẢ
            returnRequest.Status = ReturnRequestStatus.Completed;
            returnRequest.RefundStatus = RefundStatus.Refunded;
            returnRequest.RefundAmount = effectiveRefund;
            returnRequest.RefundTransactionNo = refundTransactionNo;
            returnRequest.RefundedAt = now;
            returnRequest.ProcessedByUserId = staffUserId;
            returnRequest.ProcessedByName = staffName;
            returnRequest.ProcessedAt = now;
            returnRequest.UpdatedAt = now;
            returnRequest.IdempotencyKey = idempotencyKey;

            // 6. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG VÀ SỔ LỊCH SỬ
            var oldOrderStatus = order.Status;
            order.Status = OrderStatus.Returned;
            order.PaymentStatus = (totalRefunded + effectiveRefund >= totalPaid)
                ? PaymentStatus.Refunded
                : PaymentStatus.PartiallyRefunded;
            order.UpdatedAt = now;

            var history = new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                FromStatus = oldOrderStatus,
                ToStatus = OrderStatus.Returned,
                ChangedByUserId = staffUserId,
                ChangedByName = staffName,
                Reason = $"Hoàn tất đổi trả: Nhập lại kho và hoàn tiền {effectiveRefund:N0}đ (Mã hoàn: {refundTransactionNo})",
                Note = "RETURN_COMPLETED_REFUNDED",
                CreatedAt = now
            };

            _context.OrderStatusHistories.Add(history);
            order.StatusHistories.Add(history);

            await _context.SaveChangesAsync(ct);

            if (tx != null)
            {
                await tx.CommitAsync(ct);
            }

            _logger.LogInformation("Return request {RequestId} successfully completed and refunded {Amount:N0}đ by {StaffName}",
                returnRequest.Id, effectiveRefund, staffName);

            // 7. GHI AUDIT LOG
            await _auditLogService.LogAsync(
                action: "RETURN_REQUEST_COMPLETED",
                entityName: "ReturnRequest",
                entityId: returnRequest.Id.ToString(),
                oldValues: new { Status = ReturnRequestStatus.Approved.ToString() },
                newValues: new
                {
                    Status = ReturnRequestStatus.Completed.ToString(),
                    RefundStatus = RefundStatus.Refunded.ToString(),
                    RefundAmount = effectiveRefund,
                    RefundTransactionNo = refundTransactionNo,
                    IsRestocked = returnRequest.IsRestocked
                },
                userId: staffUserId,
                userEmail: staffEmail,
                userRole: staffRole,
                note: $"Hoàn tất yêu cầu đổi trả đơn {order.OrderNumber}: Hoàn {effectiveRefund:N0}đ và nhập lại kho",
                ct: ct);

            await _auditLogService.LogAsync(
                action: "PAYMENT_REFUNDED",
                entityName: "Payment",
                entityId: refundPayment.Id.ToString(),
                oldValues: null,
                newValues: new
                {
                    refundPayment.Id,
                    refundPayment.OrderNumber,
                    refundPayment.Amount,
                    refundPayment.TransactionNo,
                    refundPayment.TxnRef
                },
                userId: staffUserId,
                userEmail: staffEmail,
                userRole: staffRole,
                note: $"Hoàn tiền {effectiveRefund:N0}đ cho đơn hàng {order.OrderNumber}",
                ct: ct);

            return Result<ReturnRequestDto>.Success(MapToDto(returnRequest), $"Đã hoàn tất đổi trả: Nhập lại kho và hoàn tiền {effectiveRefund:N0}đ thành công.");
        }
        catch (Exception ex)
        {
            if (tx != null) await tx.RollbackAsync(ct);
            _logger.LogError(ex, "Error completing return and refund for request {RequestId}", returnRequestId);
            return Result<ReturnRequestDto>.Failure("Lỗi hệ thống khi hoàn tất đổi trả: " + ex.Message);
        }
    }

    /// <summary>
    /// Tính toán tài chính của đơn hàng: tổng tiền đã thanh toán, tổng tiền đã hoàn, và số tiền tối đa còn có thể hoàn.
    /// </summary>
    private async Task<(decimal totalPaid, decimal totalRefunded, decimal maxRefundable)> GetOrderFinancialsAsync(
        Order order,
        CancellationToken ct)
    {
        // 1. Tổng tiền đã thanh toán
        decimal totalPaid = 0m;
        if (order.PaymentStatus == PaymentStatus.Paid ||
            order.PaymentStatus == PaymentStatus.Refunded ||
            order.PaymentStatus == PaymentStatus.PartiallyRefunded)
        {
            totalPaid = order.TotalAmount;
        }
        else
        {
            var paidPayments = await _context.Payments
                .Where(p => p.OrderId == order.Id && p.Status == PaymentStatus.Paid)
                .SumAsync(p => (decimal?)p.Amount, ct);
            totalPaid = paidPayments ?? 0m;
        }

        // 2. Tổng tiền đã hoàn trước đó
        var refundedPayments = await _context.Payments
            .Where(p => p.OrderId == order.Id && p.Status == PaymentStatus.Refunded)
            .SumAsync(p => (decimal?)p.Amount, ct);
        decimal totalRefunded = refundedPayments ?? 0m;

        decimal maxRefundable = Math.Max(0m, totalPaid - totalRefunded);
        return (totalPaid, totalRefunded, maxRefundable);
    }

    private static ReturnRequestDto MapToDto(ReturnRequest r) =>
        new(
            r.Id,
            r.OrderId,
            r.OrderNumber,
            r.UserId,
            r.CustomerName,
            r.CustomerEmail,
            r.CustomerPhone,
            r.Status,
            r.Reason,
            r.CustomerNote,
            r.RefundAmount,
            r.RefundStatus,
            r.RefundTransactionNo,
            r.RefundedAt,
            r.SalesNote,
            r.RejectionReason,
            r.ProcessedByUserId,
            r.ProcessedByName,
            r.ProcessedAt,
            r.IsRestocked,
            r.RestockedAt,
            (r.Items ?? Array.Empty<ReturnRequestItem>()).Select(i => new ReturnRequestItemDto(
                i.Id,
                i.OrderItemId,
                i.VariantId,
                i.ProductName,
                i.VariantName,
                i.Sku,
                i.Quantity,
                i.UnitPrice,
                i.TotalPrice,
                i.Reason,
                i.Condition
            )).ToList(),
            r.CreatedAt,
            r.UpdatedAt
        );
}
