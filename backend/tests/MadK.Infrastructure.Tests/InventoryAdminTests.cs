using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Audit;
using MadK.Application.DTOs.Inventory;
using MadK.Application.Interfaces;
using MadK.Application.Services;
using MadK.Domain.Constants;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class InventoryAdminTests : IClassFixture<AuthMatrixTestFixture>, IAsyncLifetime
{
    private readonly AuthMatrixTestFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public InventoryAdminTests(AuthMatrixTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        await _fixture.EnsureInitializedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private HttpClient CreateRoleClient(string role)
    {
        var client = _fixture.CreateClient();
        var token = role switch
        {
            "Admin" => _fixture.AdminToken,
            "Warehouse" => _fixture.WarehouseToken,
            "Sales" => _fixture.SalesToken,
            "Customer" => _fixture.CustomerToken,
            _ => null
        };

        if (!string.IsNullOrEmpty(token))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return client;
    }

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryInventoryAdminDb_" + Guid.NewGuid())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<(Category category, Brand brand, Product product, ProductVariant variant)> SeedProductAsync(
        AppDbContext db,
        int initialStock = 50,
        decimal costPrice = 1000000m,
        decimal salePrice = 1500000m)
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím cơ",
            Slug = "ban-phim-co-" + Guid.NewGuid().ToString("N")[..8],
            IsActive = true
        };
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "MadK Tech",
            Slug = "madk-tech-" + Guid.NewGuid().ToString("N")[..8],
            IsActive = true
        };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím cơ MadK Pro",
            Slug = "ban-phim-co-madk-pro-" + Guid.NewGuid().ToString("N")[..8],
            CategoryId = category.Id,
            BrandId = brand.Id,
            BasePrice = salePrice,
            IsActive = true
        };
        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "MK-PRO-TEST-" + Guid.NewGuid().ToString("N")[..6].ToUpper(),
            Name = "Red Switch / Black",
            OriginalPrice = salePrice * 1.2m,
            SalePrice = salePrice,
            CostPrice = costPrice,
            StockQuantity = initialStock,
            IsActive = true
        };

        db.Categories.Add(category);
        db.Brands.Add(brand);
        db.Products.Add(product);
        db.ProductVariants.Add(variant);
        await db.SaveChangesAsync();

        return (category, brand, product, variant);
    }

    #region Unit Tests: Restock, Adjustment & Boundary Invariants

    [Fact]
    public async Task Restock_IncreasesOnHandAndAvailableCorrectly_AndRecordsMovement()
    {
        await using var db = CreateInMemoryDbContext();
        var (_, _, _, variant) = await SeedProductAsync(db, initialStock: 20);

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);

        // Act: Restock thêm 15 sản phẩm
        var result = await inventoryService.RestockAsync(
            variantId: variant.Id,
            quantity: 15,
            reason: "Nhập lô hàng mới",
            referenceType: "PurchaseOrder",
            referenceId: "PO-001");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.OnHandQuantity.Should().Be(35);
        result.Data.AvailableQuantity.Should().Be(35);

        // Kiểm tra biến thể được đồng bộ tồn
        var updatedVariant = await db.ProductVariants.FindAsync(variant.Id);
        updatedVariant!.StockQuantity.Should().Be(35);

        // Kiểm tra sổ cái biến động (StockMovement)
        var movements = await db.StockMovements.Where(m => m.VariantId == variant.Id).ToListAsync();
        movements.Should().ContainSingle();
        var movement = movements.First();
        movement.Type.Should().Be(StockMovementType.Restock);
        movement.Quantity.Should().Be(15);
        movement.OnHandBefore.Should().Be(20);
        movement.OnHandAfter.Should().Be(35);
        movement.ReferenceType.Should().Be("PurchaseOrder");
        movement.ReferenceId.Should().Be("PO-001");
    }

    [Fact]
    public async Task AdjustStock_PositiveQuantity_IncreasesStockAndRecordsAdjustmentMovement()
    {
        await using var db = CreateInMemoryDbContext();
        var (_, _, _, variant) = await SeedProductAsync(db, initialStock: 20);

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);

        // Act: Điều chỉnh tăng thêm 5
        var result = await inventoryService.AdjustStockAsync(
            variantId: variant.Id,
            quantityChange: 5,
            reason: "Kiểm đếm phát hiện thừa 5 cái");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.OnHandQuantity.Should().Be(25);
        result.Data.AvailableQuantity.Should().Be(25);

        var movements = await db.StockMovements.Where(m => m.VariantId == variant.Id).ToListAsync();
        movements.Should().ContainSingle();
        var movement = movements.First();
        movement.Type.Should().Be(StockMovementType.Adjustment);
        movement.Quantity.Should().Be(5);
        movement.OnHandBefore.Should().Be(20);
        movement.OnHandAfter.Should().Be(25);
        movement.Reason.Should().Be("Kiểm đếm phát hiện thừa 5 cái");
    }

    [Fact]
    public async Task AdjustStock_NegativeQuantity_WithinAvailableStock_Succeeds()
    {
        await using var db = CreateInMemoryDbContext();
        var (_, _, _, variant) = await SeedProductAsync(db, initialStock: 20);

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);

        // Giữ trước 5 món cho 1 đơn hàng -> Available = 20 - 5 = 15
        await inventoryService.ReserveAsync(variant.Id, 5, "Order", "ORD-123");

        // Act: Điều chỉnh giảm 10 món (vẫn <= 15 khả dụng)
        var result = await inventoryService.AdjustStockAsync(
            variantId: variant.Id,
            quantityChange: -10,
            reason: "Hàng bị ẩm hỏng trong kho");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.OnHandQuantity.Should().Be(10); // 20 - 10 = 10
        result.Data.ReservedQuantity.Should().Be(5);
        result.Data.AvailableQuantity.Should().Be(5); // 10 - 5 = 5

        var movements = await db.StockMovements
            .Where(m => m.VariantId == variant.Id && m.Type == StockMovementType.Adjustment)
            .ToListAsync();
        movements.Should().ContainSingle();
        movements.First().OnHandBefore.Should().Be(20);
        movements.First().OnHandAfter.Should().Be(10);
    }

    [Fact]
    public async Task AdjustStock_NegativeQuantity_ExceedingAvailableStock_IsRejected()
    {
        await using var db = CreateInMemoryDbContext();
        var (_, _, _, variant) = await SeedProductAsync(db, initialStock: 10);

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);

        // Giữ 6 món cho đơn hàng -> Available = 10 - 6 = 4
        await inventoryService.ReserveAsync(variant.Id, 6, "Order", "ORD-123");

        // Act: Cố điều chỉnh giảm 5 món (vượt quá 4 khả dụng)
        var result = await inventoryService.AdjustStockAsync(
            variantId: variant.Id,
            quantityChange: -5,
            reason: "Hàng vỡ hỏng");

        // Assert: Phải bị từ chối ngay lập tức
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("vượt quá tồn kho khả dụng");

        // Tồn kho không bị thay đổi
        var stock = await inventoryService.GetStockAsync(variant.Id);
        stock.Data!.OnHandQuantity.Should().Be(10);
        stock.Data.ReservedQuantity.Should().Be(6);
        stock.Data.AvailableQuantity.Should().Be(4);

        // Không phát sinh StockMovement loại Adjustment
        var adjustMovements = await db.StockMovements
            .Where(m => m.VariantId == variant.Id && m.Type == StockMovementType.Adjustment)
            .ToListAsync();
        adjustMovements.Should().BeEmpty();
    }

    [Fact]
    public async Task AdjustStock_NegativeQuantity_ExactlyEqualAvailableStock_ReducesAvailableToZero()
    {
        await using var db = CreateInMemoryDbContext();
        var (_, _, _, variant) = await SeedProductAsync(db, initialStock: 10);

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);

        // Giữ 4 món -> Available = 6
        await inventoryService.ReserveAsync(variant.Id, 4, "Order", "ORD-123");

        // Act: Điều chỉnh giảm đúng bằng 6
        var result = await inventoryService.AdjustStockAsync(
            variantId: variant.Id,
            quantityChange: -6,
            reason: "Chuyển kho mẫu");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.OnHandQuantity.Should().Be(4);
        result.Data.ReservedQuantity.Should().Be(4);
        result.Data.AvailableQuantity.Should().Be(0);
    }

    #endregion

    #region Purchasing & Supplier Integration Tests

    [Fact]
    public async Task PurchaseOrder_Receive_RestocksVariantsAndUpdatesCostPrice()
    {
        await using var db = CreateInMemoryDbContext();
        var (_, _, _, variant) = await SeedProductAsync(db, initialStock: 10, costPrice: 1000000m);

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Code = "SUP-001",
            Name = "Công ty TNHH Phân phối Linh kiện Á Châu",
            ContactPerson = "Nguyễn Văn A",
            Phone = "0988111222",
            IsActive = true
        };
        db.Suppliers.Add(supplier);
        await db.SaveChangesAsync();

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var auditLogService = new MockAuditLogService();
        var purchasingService = new PurchasingService(db, inventoryService, auditLogService, NullLogger<PurchasingService>.Instance);

        // 1. Tạo đơn mua hàng (PO) với giá vốn mới 1,200,000 VND và số lượng 30
        var createPoResult = await purchasingService.CreatePurchaseOrderAsync(new CreatePurchaseOrderDto(
            SupplierId: supplier.Id,
            Code: "PO-2026-TEST-01",
            Notes: "Nhập đợt 1",
            Items: new List<CreatePurchaseOrderItemDto>
            {
                new(variant.Id, Quantity: 30, UnitCost: 1200000m, Notes: "Hàng chính hãng")
            }
        ), createdBy: "admin@madkstore.vn");

        createPoResult.IsSuccess.Should().BeTrue();
        var poId = createPoResult.Data!.Id;
        createPoResult.Data.TotalAmount.Should().Be(30 * 1200000m);
        createPoResult.Data.Status.Should().Be(PurchaseOrderStatus.Draft);

        // 2. Nhận hàng (Receive PO) -> Tồn kho tăng, giá vốn trên variant cập nhật
        var receiveResult = await purchasingService.ReceivePurchaseOrderAsync(poId, receivedBy: "warehouse@madkstore.vn");

        receiveResult.IsSuccess.Should().BeTrue();
        receiveResult.Data!.Status.Should().Be(PurchaseOrderStatus.Received);
        receiveResult.Data.ReceivedAt.Should().NotBeNull();

        // Kiểm tra tồn kho variant: 10 ban đầu + 30 nhập = 40
        var updatedStock = await inventoryService.GetStockAsync(variant.Id);
        updatedStock.Data!.OnHandQuantity.Should().Be(40);
        updatedStock.Data.AvailableQuantity.Should().Be(40);

        // Kiểm tra giá vốn trên variant đã được ghi nhận: 1,200,000
        var updatedVariant = await db.ProductVariants.FindAsync(variant.Id);
        updatedVariant!.CostPrice.Should().Be(1200000m);

        // Kiểm tra StockMovement đã được ghi qua InventoryService
        var movements = await db.StockMovements.Where(m => m.VariantId == variant.Id).ToListAsync();
        movements.Should().Contain(m =>
            m.Type == StockMovementType.Restock &&
            m.Quantity == 30 &&
            m.ReferenceType == "PurchaseOrder" &&
            m.ReferenceId == poId.ToString());
    }

    [Fact]
    public async Task InventoryAudit_Complete_AdjustsStockDiscrepanciesAutomatically()
    {
        await using var db = CreateInMemoryDbContext();
        var (_, _, _, variant1) = await SeedProductAsync(db, initialStock: 20);
        var (_, _, _, variant2) = await SeedProductAsync(db, initialStock: 15);

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var auditLogService = new MockAuditLogService();
        var purchasingService = new PurchasingService(db, inventoryService, auditLogService, NullLogger<PurchasingService>.Instance);

        // 1. Tạo phiếu kiểm kho cho 2 biến thể
        var createAuditResult = await purchasingService.CreateInventoryAuditAsync(new CreateInventoryAuditDto(
            Code: "AUD-2026-TEST-01",
            Notes: "Kiểm kê định kỳ tháng 10",
            Items: new List<CreateInventoryAuditItemDto>
            {
                new(variant1.Id, ActualQuantity: 20), // Tạm ghi bằng hệ thống
                new(variant2.Id, ActualQuantity: 15)
            }
        ), createdBy: "admin@madkstore.vn");

        createAuditResult.IsSuccess.Should().BeTrue();
        var auditId = createAuditResult.Data!.Id;

        // 2. Nhập số liệu thực tế đếm được:
        // Variant 1: Thực tế đếm 23 cái (thừa 3)
        // Variant 2: Thực tế đếm 12 cái (thiếu 3)
        var completeResult = await purchasingService.CompleteInventoryAuditAsync(auditId, new CompleteInventoryAuditDto(
            Items: new List<CompleteInventoryAuditItemDto>
            {
                new(variant1.Id, ActualQuantity: 23, Reason: "Nhập thừa chưa nhập phiếu"),
                new(variant2.Id, ActualQuantity: 12, Reason: "Hàng bị vỡ khi bốc dỡ")
            }
        ), completedBy: "warehouse@madkstore.vn");

        completeResult.IsSuccess.Should().BeTrue();
        completeResult.Data!.Status.Should().Be(InventoryAuditStatus.Completed);
        completeResult.Data.CompletedAt.Should().NotBeNull();

        // 3. Kiểm tra số lượng tồn kho đã được tự động cân bằng:
        // Variant 1: 20 + 3 = 23
        var stock1 = await inventoryService.GetStockAsync(variant1.Id);
        stock1.Data!.OnHandQuantity.Should().Be(23);

        // Variant 2: 15 - 3 = 12
        var stock2 = await inventoryService.GetStockAsync(variant2.Id);
        stock2.Data!.OnHandQuantity.Should().Be(12);

        // 4. Kiểm tra sổ cái biến động kho có 2 bản ghi Adjustment tương ứng
        var movementsV1 = await db.StockMovements.Where(m => m.VariantId == variant1.Id && m.Type == StockMovementType.Adjustment).ToListAsync();
        movementsV1.Should().ContainSingle();
        movementsV1.First().OnHandBefore.Should().Be(20);
        movementsV1.First().OnHandAfter.Should().Be(23);

        var movementsV2 = await db.StockMovements.Where(m => m.VariantId == variant2.Id && m.Type == StockMovementType.Adjustment).ToListAsync();
        movementsV2.Should().ContainSingle();
        movementsV2.First().OnHandBefore.Should().Be(15);
        movementsV2.First().OnHandAfter.Should().Be(12);
    }

    #endregion

    #region Security & Role-Based Access Control (RBAC) Tests

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task InventoryAdjust_SecurityMatrix(string role, HttpStatusCode expectedStatus)
    {
        var client = CreateRoleClient(role);

        var response = await client.PostAsJsonAsync("/api/v1/admin/inventory/adjust", new AdjustStockRequestDto(
            VariantId: Guid.NewGuid(),
            QuantityChange: 5,
            Reason: "Test RBAC"
        ));

        // Nếu quyền hợp lệ, có thể trả về BadRequest vì variant Guid giả không tồn tại, hoặc OK
        if (expectedStatus == HttpStatusCode.OK)
        {
            response.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.BadRequest);
        }
        else
        {
            response.StatusCode.Should().Be(expectedStatus);
        }
    }

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Purchasing_CreatePurchaseOrder_SecurityMatrix(string role, HttpStatusCode expectedStatus)
    {
        var client = CreateRoleClient(role);

        var response = await client.PostAsJsonAsync("/api/v1/admin/purchasing/purchase-orders", new CreatePurchaseOrderDto(
            SupplierId: Guid.NewGuid(),
            Code: "PO-TEST",
            Notes: "Test RBAC",
            Items: new List<CreatePurchaseOrderItemDto>()
        ));

        if (expectedStatus == HttpStatusCode.OK)
        {
            response.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.BadRequest);
        }
        else
        {
            response.StatusCode.Should().Be(expectedStatus);
        }
    }

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Inventory_ViewMovements_SecurityMatrix(string role, HttpStatusCode expectedStatus)
    {
        var client = CreateRoleClient(role);

        var response = await client.GetAsync("/api/v1/admin/inventory/movements");

        response.StatusCode.Should().Be(expectedStatus);
    }

    #endregion

    private class MockAuditLogService : IAuditLogService
    {
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
            CancellationToken ct = default) => Task.CompletedTask;

        public Task<Result<PagedResult<AuditLogDto>>> GetAuditLogsAsync(AuditLogQueryFilter filter, CancellationToken ct = default) =>
            Task.FromResult(Result<PagedResult<AuditLogDto>>.Success(new PagedResult<AuditLogDto>([], 0, 1, 10)));
    }
}
