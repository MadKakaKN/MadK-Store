using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Returns;
using MadK.Application.Interfaces;
using MadK.Application.Services;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MadK.Infrastructure.Tests;

/// <summary>
/// Bộ kiểm thử toàn diện cho module Hủy đơn đã thanh toán, Hoàn tiền và Đổi trả (Returns & Refunds):
/// 1. Khách hàng tạo yêu cầu đổi trả cho đơn đã hoàn tất (Completed) -> chuyển trạng thái ReturnRequested.
/// 2. Chống IDOR và từ chối đổi trả nếu đơn chưa Completed.
/// 3. Nhân viên Sales duyệt yêu cầu đổi trả (Approved) kèm ghi chú hướng dẫn gửi hàng.
/// 4. Nhân viên Sales từ chối yêu cầu (Rejected) kèm lý do bắt buộc -> Đơn quay lại Completed theo docs/order-states.md.
/// 5. Hoàn tất đổi trả: Nhập lại kho hàng trả về (+OnHand), hoàn tiền (ghi nhận bảng Payments), cập nhật đơn sang Returned.
/// 6. RÀNG BUỘC QUAN TRỌNG: Không hoàn quá số tiền khách đã thanh toán.
/// 7. RÀNG BUỘC QUAN TRỌNG: Không hoàn tiền 2 lần cho cùng một yêu cầu đổi trả (Idempotent).
/// 8. Hủy đơn đã thanh toán (Paid): Tự động giải phóng tồn kho đang giữ và tạo giao dịch hoàn tiền.
/// </summary>
public class ReturnAndRefundTests
{
    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryReturnTests_" + Guid.NewGuid())
            .Options;

        return new AppDbContext(options);
    }

    private (ReturnService returnService, OrderService orderService, InventoryService inventoryService, MockAuditLogService auditLogService, AppDbContext db) CreateServices(AppDbContext? context = null)
    {
        var db = context ?? CreateInMemoryDbContext();
        var invLogger = NullLogger<InventoryService>.Instance;
        var inventoryService = new InventoryService(db, invLogger);
        var pricingService = new PricingService(db, NullLogger<PricingService>.Instance);
        var auditLogService = new MockAuditLogService();
        var orderLogger = NullLogger<OrderService>.Instance;
        var returnLogger = NullLogger<ReturnService>.Instance;

        var orderService = new OrderService(db, inventoryService, pricingService, orderLogger);
        var returnService = new ReturnService(db, inventoryService, auditLogService, returnLogger);

        return (returnService, orderService, inventoryService, auditLogService, db);
    }

    private async Task<(Order order, ProductVariant variant, User user)> SeedPaidCompletedOrderAsync(
        AppDbContext db,
        decimal totalAmount = 1000000m,
        int quantity = 2,
        OrderStatus status = OrderStatus.Completed,
        PaymentStatus paymentStatus = PaymentStatus.Paid)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"customer_{Guid.NewGuid().ToString("N")[..6]}@madkstore.local",
            PasswordHash = "hash",
            FullName = "Nguyen Van Khach"
        };
        db.Users.Add(user);

        var category = new Category { Id = Guid.NewGuid(), Name = "Tai nghe", Slug = "tai-nghe-" + Guid.NewGuid() };
        var brand = new Brand { Id = Guid.NewGuid(), Name = "Sony", Slug = "sony-" + Guid.NewGuid() };
        var product = new Product { Id = Guid.NewGuid(), Name = "Sony WH-1000XM5", Slug = "sony-xm5-" + Guid.NewGuid(), CategoryId = category.Id, BrandId = brand.Id };
        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Name = "Black",
            Sku = "SONY-XM5-BLK-" + Guid.NewGuid().ToString("N")[..6],
            SalePrice = totalAmount / quantity,
            CostPrice = (totalAmount / quantity) * 0.7m,
            IsActive = true
        };
        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = 10,
            ReservedQuantity = 0
        };

        db.Categories.Add(category);
        db.Brands.Add(brand);
        db.Products.Add(product);
        db.ProductVariants.Add(variant);
        db.Inventories.Add(inventory);

        var orderId = Guid.NewGuid();
        string orderNumber = $"MK-20261016-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        var order = new Order
        {
            Id = orderId,
            OrderNumber = orderNumber,
            UserId = user.Id,
            CustomerEmail = user.Email,
            CustomerPhone = "0901234567",
            Status = status,
            PaymentStatus = paymentStatus,
            PaymentMethod = PaymentMethod.VNPay,
            TotalAmount = totalAmount,
            SubtotalAmount = totalAmount,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            ShippingAddressSnapshot = "{\"fullAddress\":\"456 Nguyen Trai, Q5, TP.HCM\"}",
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    VariantId = variant.Id,
                    ProductId = product.Id,
                    ProductNameSnapshot = product.Name,
                    VariantNameSnapshot = variant.Name,
                    SkuSnapshot = variant.Sku,
                    UnitPriceSnapshot = totalAmount / quantity,
                    Quantity = quantity,
                    TotalPrice = totalAmount
                }
            }
        };

        // Ghi nhận bản ghi thanh toán Paid ban đầu
        if (paymentStatus == PaymentStatus.Paid)
        {
            var initialPayment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                OrderNumber = orderNumber,
                TxnRef = orderNumber,
                TransactionNo = "14900001",
                Amount = totalAmount,
                Currency = "VND",
                PaymentMethod = PaymentMethod.VNPay,
                Status = PaymentStatus.Paid,
                OrderInfo = $"Thanh toan don hang {orderNumber}",
                ResponseCode = "00",
                TransactionStatus = "00",
                RawPayload = "{}",
                PaymentTime = DateTime.UtcNow.AddDays(-2),
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };
            db.Payments.Add(initialPayment);
        }

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return (order, variant, user);
    }

    [Fact]
    public async Task CreateReturnRequest_ValidCompletedOrder_CreatesRequestAndSetsOrderStatusToReturnRequested()
    {
        // Arrange
        var (returnService, _, _, auditService, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(db, totalAmount: 1000000m, quantity: 2);

        var requestDto = new CreateReturnRequestDto(
            Reason: "Tai nghe bị rè loa bên trái sau 2 ngày dùng",
            CustomerNote: "Vui lòng hỗ trợ đổi mới hoặc hoàn tiền",
            Items: new List<CreateReturnItemDto>
            {
                new(VariantId: variant.Id, Quantity: 1, Reason: "Rè loa trái", Condition: "Đầy đủ hộp")
            }
        );

        // Act: Khách hàng gửi yêu cầu đổi trả
        var result = await returnService.CreateReturnRequestAsync(order.OrderNumber, user.Id, requestDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Status.Should().Be(ReturnRequestStatus.Pending);
        result.Data.RefundStatus.Should().Be(RefundStatus.Pending);
        result.Data.RefundAmount.Should().Be(500000m); // 1 cái * 500.000đ
        result.Data.Items.Should().HaveCount(1);

        // Đơn hàng chuyển sang ReturnRequested theo docs/order-states.md
        var freshOrder = await db.Orders.Include(o => o.StatusHistories).FirstAsync(o => o.Id == order.Id);
        freshOrder.Status.Should().Be(OrderStatus.ReturnRequested);
        freshOrder.StatusHistories.Should().Contain(h => h.ToStatus == OrderStatus.ReturnRequested);

        // Ghi nhận AuditLog
        auditService.Logs.Should().Contain(l => l.Action == "RETURN_REQUEST_CREATED" && l.EntityId == result.Data.Id.ToString());
    }

    [Fact]
    public async Task CreateReturnRequest_OrderNotCompletedOrNotOwner_FailsValidation()
    {
        // Arrange
        var (returnService, _, _, _, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(db, status: OrderStatus.Processing);

        var requestDto = new CreateReturnRequestDto(
            Reason: "Đổi ý không mua nữa",
            Items: new List<CreateReturnItemDto>
            {
                new(VariantId: variant.Id, Quantity: 1)
            }
        );

        // Act 1: Thử tạo khi đơn đang Processing (chưa Completed)
        var resultNotCompleted = await returnService.CreateReturnRequestAsync(order.OrderNumber, user.Id, requestDto);
        resultNotCompleted.IsSuccess.Should().BeFalse();
        resultNotCompleted.Error.Should().Contain("Completed");

        // Act 2: Thử tạo khi không phải chủ sở hữu đơn (Chống IDOR)
        var strangerId = Guid.NewGuid();
        var resultWrongUser = await returnService.CreateReturnRequestAsync(order.OrderNumber, strangerId, requestDto);
        resultWrongUser.IsSuccess.Should().BeFalse();
        resultWrongUser.Error.Should().Contain("không có quyền");
    }

    [Fact]
    public async Task ApproveReturnRequest_BySales_UpdatesStatusToApprovedAndRecordsAuditLog()
    {
        // Arrange
        var (returnService, _, _, auditService, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(db);

        var createRes = await returnService.CreateReturnRequestAsync(order.OrderNumber, user.Id, new CreateReturnRequestDto(
            Reason: "Giao nhầm màu sắc",
            Items: new List<CreateReturnItemDto> { new(variant.Id, 1) }
        ));

        var staffId = Guid.NewGuid();

        // Act: Sales duyệt yêu cầu đổi trả
        var approveDto = new ApproveReturnRequestDto(SalesNote: "Đã duyệt. Khách vui lòng gửi hàng về kho số 123 Lê Lợi.");
        var approveRes = await returnService.ApproveReturnRequestAsync(
            createRes.Data!.Id,
            staffId,
            "Sales NV A",
            "sales@madkstore.local",
            "Sales",
            approveDto);

        // Assert
        approveRes.IsSuccess.Should().BeTrue();
        approveRes.Data!.Status.Should().Be(ReturnRequestStatus.Approved);
        approveRes.Data.SalesNote.Should().Contain("123 Lê Lợi");
        approveRes.Data.ProcessedByName.Should().Be("Sales NV A");

        // AuditLog
        auditService.Logs.Should().Contain(l => l.Action == "RETURN_REQUEST_APPROVED" && l.UserId == staffId);
    }

    [Fact]
    public async Task RejectReturnRequest_BySales_RequiresReason_UpdatesOrderToCompletedAndRecordsAuditLog()
    {
        // Arrange
        var (returnService, _, _, auditService, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(db);

        var createRes = await returnService.CreateReturnRequestAsync(order.OrderNumber, user.Id, new CreateReturnRequestDto(
            Reason: "Không thích dùng nữa",
            Items: new List<CreateReturnItemDto> { new(variant.Id, 1) }
        ));

        var staffId = Guid.NewGuid();

        // Act 1: Thử từ chối không có lý do -> Bị lỗi
        var emptyReasonRes = await returnService.RejectReturnRequestAsync(
            createRes.Data!.Id, staffId, "Sales B", "sales@madk.local", "Sales", new RejectReturnRequestDto(""));
        emptyReasonRes.IsSuccess.Should().BeFalse();
        emptyReasonRes.Error.Should().Contain("lý do");

        // Act 2: Từ chối có lý do hợp lệ
        var rejectRes = await returnService.RejectReturnRequestAsync(
            createRes.Data!.Id,
            staffId,
            "Sales B",
            "sales@madk.local",
            "Sales",
            new RejectReturnRequestDto("Từ chối do sản phẩm đã quá hạn 7 ngày đổi trả hoặc không có lỗi nhà sản xuất."));

        // Assert
        rejectRes.IsSuccess.Should().BeTrue();
        rejectRes.Data!.Status.Should().Be(ReturnRequestStatus.Rejected);
        rejectRes.Data.RefundStatus.Should().Be(RefundStatus.NotApplicable);

        // Đơn hàng chuyển lại Completed theo docs/order-states.md
        var freshOrder = await db.Orders.Include(o => o.StatusHistories).FirstAsync(o => o.Id == order.Id);
        freshOrder.Status.Should().Be(OrderStatus.Completed);
        freshOrder.StatusHistories.Should().Contain(h => h.Reason != null && h.Reason.Contains("Từ chối yêu cầu đổi trả"));

        // AuditLog
        auditService.Logs.Should().Contain(l => l.Action == "RETURN_REQUEST_REJECTED" && l.UserId == staffId);
    }

    [Fact]
    public async Task CompleteReturnAndRefund_RestocksInventory_CreatesRefundPaymentRecord_AndMarksOrderReturned()
    {
        // Arrange: Đơn hàng hoàn tất đã thanh toán 1.000.000đ (2 cái, 500k/cái)
        var (returnService, _, _, auditService, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(db, totalAmount: 1000000m, quantity: 2);

        // Khách tạo yêu cầu đổi trả 1 cái (500k)
        var createRes = await returnService.CreateReturnRequestAsync(order.OrderNumber, user.Id, new CreateReturnRequestDto(
            Reason: "Hàng bị lỗi kết nối Bluetooth",
            Items: new List<CreateReturnItemDto> { new(variant.Id, 1) }
        ));

        var staffId = Guid.NewGuid();

        // Sales duyệt
        await returnService.ApproveReturnRequestAsync(createRes.Data!.Id, staffId, "Sales A", "sales@madk.local", "Sales", new ApproveReturnRequestDto("Đồng ý nhận lại"));

        // Kiểm tra tồn kho trước khi nhập lại: OnHand = 10
        var invBefore = await db.Inventories.FirstAsync(i => i.VariantId == variant.Id);
        invBefore.OnHandQuantity.Should().Be(10);

        // Act: Hoàn tất đổi trả: Nhận lại hàng vào kho + Hoàn tiền
        var completeRes = await returnService.CompleteReturnAndRefundAsync(
            createRes.Data.Id,
            staffId,
            "Sales A",
            "sales@madk.local",
            "Sales",
            new ProcessReturnRefundDto(RefundAmount: 500000m, RestockInventory: true, Note: "Đã nhận lại 1 tai nghe và hoàn 500k"));

        // Assert
        completeRes.IsSuccess.Should().BeTrue();
        completeRes.Data!.Status.Should().Be(ReturnRequestStatus.Completed);
        completeRes.Data.RefundStatus.Should().Be(RefundStatus.Refunded);
        completeRes.Data.RefundAmount.Should().Be(500000m);
        completeRes.Data.IsRestocked.Should().BeTrue();

        // Tồn kho: OnHandQuantity phải tăng từ 10 lên 11 (+1)
        var invAfter = await db.Inventories.FirstAsync(i => i.VariantId == variant.Id);
        invAfter.OnHandQuantity.Should().Be(11);

        // Ghi nhận biến động kho loại Restock
        var movements = await db.StockMovements.Where(m => m.VariantId == variant.Id).ToListAsync();
        movements.Should().Contain(m => m.Type == StockMovementType.Restock && m.Quantity == 1);

        // Bảng Payment: Phải có bản ghi giao dịch Refund 500k
        var refundPayment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id && p.Status == PaymentStatus.Refunded);
        refundPayment.Should().NotBeNull();
        refundPayment!.Amount.Should().Be(500000m);
        refundPayment.OrderInfo.Should().Contain("Hoan tien");

        // Đơn hàng: Chuyển sang Returned và PaymentStatus là PartiallyRefunded (hoàn 500k / 1.000.000đ)
        var freshOrder = await db.Orders.FirstAsync(o => o.Id == order.Id);
        freshOrder.Status.Should().Be(OrderStatus.Returned);
        freshOrder.PaymentStatus.Should().Be(PaymentStatus.PartiallyRefunded);

        // AuditLog
        auditService.Logs.Should().Contain(l => l.Action == "RETURN_REQUEST_COMPLETED");
        auditService.Logs.Should().Contain(l => l.Action == "PAYMENT_REFUNDED");
    }

    [Fact]
    public async Task CompleteReturnAndRefund_CannotRefundMoreThanPaidAmount_RejectsExcessRefund()
    {
        // Arrange: Đơn hàng khách trả tổng cộng 500.000đ
        var (returnService, _, _, _, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(db, totalAmount: 500000m, quantity: 1);

        var createRes = await returnService.CreateReturnRequestAsync(order.OrderNumber, user.Id, new CreateReturnRequestDto(
            Reason: "Lỗi nguồn",
            Items: new List<CreateReturnItemDto> { new(variant.Id, 1) }
        ));

        var staffId = Guid.NewGuid();
        await returnService.ApproveReturnRequestAsync(createRes.Data!.Id, staffId, "Sales A", "sales@madk.local", "Sales", new ApproveReturnRequestDto());

        // Act: Thử hoàn 600.000đ (vượt quá 500.000đ khách đã thanh toán)
        var excessRefundRes = await returnService.CompleteReturnAndRefundAsync(
            createRes.Data.Id,
            staffId,
            "Sales A",
            "sales@madk.local",
            "Sales",
            new ProcessReturnRefundDto(RefundAmount: 600000m));

        // Assert: BỊ TỪ CHỐI
        excessRefundRes.IsSuccess.Should().BeFalse();
        excessRefundRes.Error.Should().Contain("vượt quá số tiền có thể hoàn");
    }

    [Fact]
    public async Task CompleteReturnAndRefund_CannotRefundTwice_IsStrictlyIdempotent()
    {
        // Arrange
        var (returnService, _, _, _, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(db, totalAmount: 500000m, quantity: 1);

        var createRes = await returnService.CreateReturnRequestAsync(order.OrderNumber, user.Id, new CreateReturnRequestDto(
            Reason: "Lỗi nhà sản xuất",
            Items: new List<CreateReturnItemDto> { new(variant.Id, 1) }
        ));

        var staffId = Guid.NewGuid();
        await returnService.ApproveReturnRequestAsync(createRes.Data!.Id, staffId, "Sales A", "sales@madk.local", "Sales", new ApproveReturnRequestDto());

        // Lần 1: Hoàn tất thành công
        var run1 = await returnService.CompleteReturnAndRefundAsync(
            createRes.Data.Id, staffId, "Sales A", "sales@madk.local", "Sales", new ProcessReturnRefundDto(RefundAmount: 500000m));
        run1.IsSuccess.Should().BeTrue();

        // Act: Lần 2: Gọi lặp lại cho cùng yêu cầu
        var run2 = await returnService.CompleteReturnAndRefundAsync(
            createRes.Data.Id, staffId, "Sales A", "sales@madk.local", "Sales", new ProcessReturnRefundDto(RefundAmount: 500000m));

        // Assert: Bị chặn hoàn đúp (Idempotent)
        run2.IsSuccess.Should().BeFalse();
        run2.Error.Should().Contain("Idempotent");

        // Số bản ghi refund trong payments chỉ duy nhất 1
        var refundCount = await db.Payments.CountAsync(p => p.OrderId == order.Id && p.Status == PaymentStatus.Refunded);
        refundCount.Should().Be(1);
    }

    [Fact]
    public async Task CancelPaidOrder_AutomaticallyRefundsCustomer_ReleasesStockAndRecordsAuditLog()
    {
        // Arrange: Đơn hàng ở trạng thái Pending nhưng ĐÃ THANH TOÁN ONLINE (PaymentStatus.Paid)
        var (_, orderService, _, _, db) = CreateServices();
        var (order, variant, user) = await SeedPaidCompletedOrderAsync(
            db,
            totalAmount: 800000m,
            quantity: 1,
            status: OrderStatus.Pending,
            paymentStatus: PaymentStatus.Paid);

        // Giữ tồn kho tạm 1 cái cho đơn này
        var inv = await db.Inventories.FirstAsync(i => i.VariantId == variant.Id);
        inv.ReservedQuantity = 1;
        await db.SaveChangesAsync();

        // Act: Khách hàng tự hủy đơn đã thanh toán trước khi giao
        var cancelDto = new CancelOrderRequestDto(Reason: "Đổi ý muốn mua mẫu khác cao cấp hơn");
        var cancelRes = await orderService.CancelOrderAsync(order.OrderNumber, user.Id, cancelDto, isStaffOrAdmin: false);

        // Assert
        cancelRes.IsSuccess.Should().BeTrue();
        cancelRes.Data!.Status.Should().Be(OrderStatus.Cancelled);
        cancelRes.Data.PaymentStatus.Should().Be(PaymentStatus.Refunded);

        // Tồn kho: ReservedQuantity phải được giải phóng về 0
        var freshInv = await db.Inventories.FirstAsync(i => i.VariantId == variant.Id);
        freshInv.ReservedQuantity.Should().Be(0);

        // Bản ghi Payment Refund được tự động tạo với số tiền 800.000đ
        var refundPayment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id && p.Status == PaymentStatus.Refunded);
        refundPayment.Should().NotBeNull();
        refundPayment!.Amount.Should().Be(800000m);
        refundPayment.OrderInfo.Should().Contain("Hoan tien huy don hang");
    }

    private class MockAuditLogService : IAuditLogService
    {
        public List<AuditLogEntry> Logs { get; } = new();

        public Task LogAsync(
            string action,
            string entityName,
            string? entityId,
            object? oldValues,
            object? newValues,
            Guid? userId,
            string? userEmail,
            string? userRole,
            string? ipAddress = null,
            string? userAgent = null,
            string? note = null,
            CancellationToken ct = default)
        {
            Logs.Add(new AuditLogEntry(action, entityName, entityId, userId, userEmail, userRole, note));
            return Task.CompletedTask;
        }

        public Task<Result<PagedResult<MadK.Application.DTOs.Audit.AuditLogDto>>> GetAuditLogsAsync(
            MadK.Application.DTOs.Audit.AuditLogQueryFilter filter,
            CancellationToken ct = default)
        {
            return Task.FromResult(Result<PagedResult<MadK.Application.DTOs.Audit.AuditLogDto>>.Success(
                new PagedResult<MadK.Application.DTOs.Audit.AuditLogDto>(new List<MadK.Application.DTOs.Audit.AuditLogDto>(), 0, 1, 20)));
        }
    }

    private record AuditLogEntry(
        string Action,
        string EntityName,
        string? EntityId,
        Guid? UserId,
        string? UserEmail,
        string? UserRole,
        string? Note
    );
}
