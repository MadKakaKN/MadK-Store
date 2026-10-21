using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Audit;
using MadK.Application.DTOs.Order;
using MadK.Domain.Constants;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class OrderAdminTestFixture : AuthMatrixTestFixture
{
    public string TestOrderNumber { get; } = "MK-TEST-ORDER-1001";
    public string TestOrderNumber2 { get; } = "MK-TEST-ORDER-1002";
    public Guid TestVariantId { get; private set; }

    public async Task EnsureOrderDataInitializedAsync()
    {
        await EnsureInitializedAsync();

        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Ensure inventory exists for stock commit/release tests
        var variant = await context.ProductVariants.FirstOrDefaultAsync();
        if (variant == null)
        {
            var brand = new Brand { Id = Guid.NewGuid(), Name = "Logitech", Slug = "logitech-" + Guid.NewGuid() };
            var cat = new Category { Id = Guid.NewGuid(), Name = "Accessories", Slug = "acc-" + Guid.NewGuid() };
            var prod = new Product { Id = Guid.NewGuid(), Name = "Logitech MX Master 3S", Slug = "mx-master-3s-" + Guid.NewGuid(), Brand = brand, Category = cat };
            variant = new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = prod.Id,
                Product = prod,
                Sku = "MX-3S-BLK",
                Name = "MX Master 3S Black",
                SalePrice = 2490000m,
                OriginalPrice = 2990000m
            };
            context.Brands.Add(brand);
            context.Categories.Add(cat);
            context.Products.Add(prod);
            context.ProductVariants.Add(variant);
            context.Inventories.Add(new Inventory
            {
                Id = Guid.NewGuid(),
                VariantId = variant.Id,
                OnHandQuantity = 20,
                ReservedQuantity = 5
            });
            await context.SaveChangesAsync();
        }
        TestVariantId = variant.Id;

        var inv = await context.Inventories.FirstOrDefaultAsync(i => i.VariantId == variant.Id);
        if (inv != null)
        {
            inv.OnHandQuantity = Math.Max(inv.OnHandQuantity, 20);
            inv.ReservedQuantity = Math.Max(inv.ReservedQuantity, 5);
        }
        else
        {
            context.Inventories.Add(new Inventory
            {
                Id = Guid.NewGuid(),
                VariantId = variant.Id,
                OnHandQuantity = 20,
                ReservedQuantity = 5
            });
        }
        await context.SaveChangesAsync();

        if (!await context.Orders.AnyAsync(o => o.OrderNumber == TestOrderNumber))
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = TestOrderNumber,
                UserId = CustomerId,
                CustomerEmail = "khachhang@madk.vn",
                CustomerPhone = "0912345678",
                ShippingAddressSnapshot = JsonSerializer.Serialize(new
                {
                    recipientName = "Nguyễn Văn Nam",
                    phoneNumber = "0912345678",
                    provinceName = "Hà Nội",
                    districtName = "Cầu Giấy",
                    wardName = "Dịch Vọng",
                    detailedAddress = "Tòa nhà FPT, Phố Duy Tân",
                    fullAddress = "Tòa nhà FPT, Phố Duy Tân, Dịch Vọng, Cầu Giấy, Hà Nội"
                }),
                Status = OrderStatus.Pending,
                PaymentMethod = PaymentMethod.COD,
                PaymentStatus = PaymentStatus.Pending,
                SubtotalAmount = 2490000m,
                TotalAmount = 2490000m,
                AdminNote = "Đơn mới cần gọi xác nhận",
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            };

            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                VariantId = variant.Id,
                ProductId = variant.ProductId,
                ProductNameSnapshot = "Logitech MX Master 3S",
                VariantNameSnapshot = "MX Master 3S Black",
                SkuSnapshot = "MX-3S-BLK",
                UnitPriceSnapshot = 2490000m,
                OriginalPriceSnapshot = 2990000m,
                Quantity = 1,
                TotalPrice = 2490000m,
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            };

            order.Items.Add(orderItem);
            order.StatusHistories.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                FromStatus = null,
                ToStatus = OrderStatus.Pending,
                ChangedByName = "Khách hàng",
                Reason = "Khởi tạo đơn hàng COD",
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            });

            context.Orders.Add(order);
            await context.SaveChangesAsync();
        }

        if (!await context.Orders.AnyAsync(o => o.OrderNumber == TestOrderNumber2))
        {
            var order2 = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = TestOrderNumber2,
                CustomerEmail = "nguyenthimai@gmail.com",
                CustomerPhone = "0987654321",
                ShippingAddressSnapshot = JsonSerializer.Serialize(new
                {
                    recipientName = "Lê Thị Mai",
                    phoneNumber = "0987654321",
                    provinceName = "TP Hồ Chí Minh",
                    districtName = "Quận 1",
                    wardName = "Bến Nghé",
                    detailedAddress = "123 Lê Lợi",
                    fullAddress = "123 Lê Lợi, Bến Nghé, Quận 1, TP Hồ Chí Minh"
                }),
                Status = OrderStatus.Processing,
                PaymentMethod = PaymentMethod.COD,
                PaymentStatus = PaymentStatus.Pending,
                SubtotalAmount = 4980000m,
                TotalAmount = 4980000m,
                AdminNote = "Đã xác nhận, chờ kho xuất hàng",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };

            context.Orders.Add(order2);
            await context.SaveChangesAsync();
        }
    }
}

public class OrderAdminTests : IClassFixture<OrderAdminTestFixture>, IAsyncLifetime
{
    private readonly OrderAdminTestFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public OrderAdminTests(OrderAdminTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        await _fixture.EnsureOrderDataInitializedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private HttpClient CreateRoleClient(string role)
    {
        var client = _fixture.CreateClient();
        var token = role switch
        {
            "Admin" => _fixture.AdminToken,
            "Sales" => _fixture.SalesToken,
            "Warehouse" => _fixture.WarehouseToken,
            "Customer" => _fixture.CustomerToken,
            _ => null
        };

        if (!string.IsNullOrEmpty(token))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return client;
    }

    [Fact]
    public async Task GetAllOrders_ShouldFilterByStatusAndSearch()
    {
        using var client = CreateRoleClient("Sales");

        // Filter by Status: Pending
        var res = await client.GetAsync($"/api/v1/admin/orders?status={OrderStatus.Pending}&search=Nam");
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await res.Content.ReadFromJsonAsync<Result<PagedResult<OrderDto>>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data!.Items.Should().NotBeEmpty();
        content.Data.Items.Should().OnlyContain(o => o.Status == OrderStatus.Pending);
        content.Data.Items.Any(o => o.OrderNumber == _fixture.TestOrderNumber).Should().BeTrue();
    }

    [Fact]
    public async Task GetAllOrders_ShouldFilterByDateRange()
    {
        using var client = CreateRoleClient("Sales");

        var fromDate = DateTime.UtcNow.AddDays(-1).ToString("o");
        var toDate = DateTime.UtcNow.AddDays(1).ToString("o");

        var res = await client.GetAsync($"/api/v1/admin/orders?fromDate={Uri.EscapeDataString(fromDate)}&toDate={Uri.EscapeDataString(toDate)}");
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await res.Content.ReadFromJsonAsync<Result<PagedResult<OrderDto>>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data!.Items.Any(o => o.OrderNumber == _fixture.TestOrderNumber).Should().BeTrue();
    }

    [Fact]
    public async Task GetOrderDetail_ShouldReturnFullOrderDetails()
    {
        using var client = CreateRoleClient("Warehouse");

        // Warehouse has OrderView permission
        var res = await client.GetAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber}");
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await res.Content.ReadFromJsonAsync<Result<OrderDto>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data!.OrderNumber.Should().Be(_fixture.TestOrderNumber);
        content.Data.Items.Should().NotBeEmpty();
        content.Data.StatusHistory.Should().NotBeEmpty();
        content.Data.AdminNote.Should().Be("Đơn mới cần gọi xác nhận");
    }

    [Fact]
    public async Task UpdateOrderNote_ShouldUpdateAdminNote_AndWriteAuditLog()
    {
        using var client = CreateRoleClient("Sales");

        var payload = new UpdateOrderNoteRequestDto("Khách hẹn giao buổi chiều sau 15h");
        var res = await client.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber}/note", payload);
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await res.Content.ReadFromJsonAsync<Result<OrderDto>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data!.AdminNote.Should().Be("Khách hẹn giao buổi chiều sau 15h");

        // Verify AuditLog was recorded
        using var adminClient = CreateRoleClient("Admin");
        var auditRes = await adminClient.GetAsync($"/api/v1/admin/audit-logs?entityName=Order&entityId={_fixture.TestOrderNumber}&action=ORDER_NOTE_UPDATED");
        auditRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var auditContent = await auditRes.Content.ReadFromJsonAsync<Result<PagedResult<AuditLogDto>>>(_jsonOptions);
        auditContent.Should().NotBeNull();
        auditContent!.IsSuccess.Should().BeTrue();
        auditContent.Data!.Items.Should().NotBeEmpty();
        var log = auditContent.Data.Items.First(l => l.EntityId == _fixture.TestOrderNumber && l.Action == "ORDER_NOTE_UPDATED");
        log.NewValues.Should().Contain("Khách hẹn giao buổi chiều sau 15h");
    }

    [Fact]
    public async Task OrderStateMachine_FullLifecycle_FromPendingToCompleted()
    {
        using var client = CreateRoleClient("Sales");

        // Step 1: Pending -> Confirmed
        var confirmReq = new UpdateOrderStatusRequestDto(OrderStatus.Confirmed, "Đã gọi điện xác nhận địa chỉ", "Giao giờ hành chính");
        var res1 = await client.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber}/status", confirmReq);
        res1.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto1 = (await res1.Content.ReadFromJsonAsync<Result<OrderDto>>(_jsonOptions))!.Data;
        dto1!.Status.Should().Be(OrderStatus.Confirmed);

        // Step 2: Confirmed -> Processing (Đang đóng gói)
        var procReq = new UpdateOrderStatusRequestDto(OrderStatus.Processing, "Kho tiến hành đóng gói kiện hàng");
        var res2 = await client.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber}/status", procReq);
        res2.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto2 = (await res2.Content.ReadFromJsonAsync<Result<OrderDto>>(_jsonOptions))!.Data;
        dto2!.Status.Should().Be(OrderStatus.Processing);

        // Step 3: Processing -> Shipping (Bàn giao ĐVVC)
        var shipReq = new UpdateOrderStatusRequestDto(OrderStatus.Shipping, "Bàn giao vận chuyển GHTK");
        var res3 = await client.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber}/status", shipReq);
        res3.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto3 = (await res3.Content.ReadFromJsonAsync<Result<OrderDto>>(_jsonOptions))!.Data;
        dto3!.Status.Should().Be(OrderStatus.Shipping);

        // Step 4: Shipping -> Completed (Giao hàng thành công)
        var compReq = new UpdateOrderStatusRequestDto(OrderStatus.Completed, "Khách hàng đã nhận và thanh toán COD");
        var res4 = await client.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber}/status", compReq);
        res4.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto4 = (await res4.Content.ReadFromJsonAsync<Result<OrderDto>>(_jsonOptions))!.Data;
        dto4!.Status.Should().Be(OrderStatus.Completed);
        dto4.PaymentStatus.Should().Be(PaymentStatus.Paid); // COD marked as Paid upon completion!

        // Step 5: Verify AuditLog for all transitions
        using var adminClient = CreateRoleClient("Admin");
        var auditRes = await adminClient.GetAsync($"/api/v1/admin/audit-logs?entityName=Order&entityId={_fixture.TestOrderNumber}&action=ORDER_STATUS_CHANGED");
        auditRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var auditContent = await auditRes.Content.ReadFromJsonAsync<Result<PagedResult<AuditLogDto>>>(_jsonOptions);
        auditContent!.IsSuccess.Should().BeTrue();
        auditContent.Data!.Items.Should().NotBeEmpty();
        auditContent.Data.Items.Count.Should().BeGreaterOrEqualTo(4);
    }

    [Fact]
    public async Task OrderStateMachine_InvalidTransition_ShouldBeRejected()
    {
        using var client = CreateRoleClient("Sales");

        // Invalid: From Processing to Completed directly (cannot skip Shipping)
        var invalidReq = new UpdateOrderStatusRequestDto(OrderStatus.Completed, "Chuyển thẳng sang Completed");
        var res = await client.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber2}/status", invalidReq);
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await res.Content.ReadFromJsonAsync<Result<OrderDto>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeFalse();
        content.Error.Should().Contain("không hợp lệ theo quy tắc vòng đời");
    }

    [Fact]
    public async Task WarehouseRole_CanView_ButCannotChangeOrderStatus()
    {
        // 1. Warehouse can view orders
        using var warehouseClient = CreateRoleClient("Warehouse");
        var viewRes = await warehouseClient.GetAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber2}");
        viewRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // 2. Warehouse cannot change status (403 Forbidden)
        var statusReq = new UpdateOrderStatusRequestDto(OrderStatus.Shipping, "Kho tự đổi trạng thái");
        var updateRes = await warehouseClient.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber2}/status", statusReq);
        updateRes.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // 3. Warehouse cannot update admin note (403 Forbidden)
        var noteReq = new UpdateOrderNoteRequestDto("Ghi chú từ kho");
        var noteRes = await warehouseClient.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.TestOrderNumber2}/note", noteReq);
        noteRes.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
