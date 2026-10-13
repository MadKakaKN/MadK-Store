using System.Collections.Concurrent;
using FluentAssertions;
using MadK.Application.Services;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Xunit;

namespace MadK.Infrastructure.Tests;

/// <summary>
/// Bộ kiểm thử Concurrency \u0026 Atomicity cho nghiệp vụ Tồn kho lõi chạy trên PostgreSQL thật.
/// Kiểm chứng:
/// 1. 50-100 request đồng thời giành món cuối cùng (chỉ đúng số lượng có hàng thành công).
/// 2. Release/Commit lặp lại không làm sai số liệu (Idempotency).
/// 3. Không bao giờ để tồn khả dụng (AvailableQuantity) bị âm.
/// </summary>
public class InventoryConcurrencyTests : IAsyncLifetime
{
    private static readonly string ConnectionString =
        Environment.GetEnvironmentVariable("TEST_POSTGRES_CONNECTION")
        ?? "Host=127.0.0.1;Port=5433;Database=madkstore_test;Username=postgres;Include Error Detail=true;Pooling=true;Maximum Pool Size=300";

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        return new AppDbContext(options);
    }

    public async Task InitializeAsync()
    {
        // Khởi tạo bảng và ràng buộc trên PostgreSQL thật nếu chưa có
        await using var db = CreateDbContext();
        await db.Database.EnsureCreatedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<ProductVariant> CreateTestVariantAsync(int initialStock)
    {
        await using var db = CreateDbContext();

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Linh kiện Test " + Guid.NewGuid().ToString("N")[..8],
            Slug = "linh-kien-test-" + Guid.NewGuid().ToString("N")[..8],
            IsActive = true
        };
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "MadK Tech " + Guid.NewGuid().ToString("N")[..8],
            Slug = "madk-tech-" + Guid.NewGuid().ToString("N")[..8],
            IsActive = true
        };
        db.Categories.Add(category);
        db.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id,
            Name = "Sản phẩm Concurrency " + Guid.NewGuid().ToString("N")[..8],
            Slug = "sp-concurrency-" + Guid.NewGuid().ToString("N")[..8],
            BasePrice = 1000000m,
            IsActive = true
        };
        db.Products.Add(product);

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "TEST-SKU-" + Guid.NewGuid().ToString("N")[..8],
            Name = "Phiên bản Giới Hạn",
            OriginalPrice = 1000000m,
            SalePrice = 1000000m,
            StockQuantity = initialStock,
            IsActive = true
        };
        db.ProductVariants.Add(variant);

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = initialStock,
            ReservedQuantity = 0,
            CreatedAt = DateTime.UtcNow
        };
        db.Inventories.Add(inventory);

        await db.SaveChangesAsync();
        return variant;
    }

    [Fact]
    public async Task Concurrency_100Requests_CompeteFor10Items_Exactly10MustSucceed_AndAvailableNeverNegative()
    {
        // Arrange: Có 10 sản phẩm trong kho (OnHand = 10, Reserved = 0, Available = 10)
        var variant = await CreateTestVariantAsync(initialStock: 10);
        int totalRequests = 100;

        var successCount = 0;
        var failureCount = 0;
        var results = new ConcurrentBag<bool>();

        // Act: 100 request đồng thời tranh nhau giữ 1 sản phẩm
        var tasks = Enumerable.Range(0, totalRequests).Select(async i =>
        {
            await using var db = CreateDbContext();
            var service = new InventoryService(db, NullLogger<InventoryService>.Instance);

            var res = await service.ReserveAsync(
                variantId: variant.Id,
                quantity: 1,
                referenceType: "Order",
                referenceId: $"Order_100_{i}_{Guid.NewGuid():N}",
                reason: $"Concurrent reservation #{i}"
            );

            results.Add(res.IsSuccess);
            if (res.IsSuccess)
            {
                Interlocked.Increment(ref successCount);
            }
            else
            {
                Interlocked.Increment(ref failureCount);
            }
        });

        await Task.WhenAll(tasks);

        // Assert:
        // 1. Đúng chính xác 10 request thành công, 90 request thất bại
        successCount.Should().Be(10, "Chỉ đúng 10 sản phẩm có sẵn trong kho thì chỉ đúng 10 request thành công");
        failureCount.Should().Be(90, "90 request còn lại phải nhận thông báo hết hàng");

        // 2. Kiểm tra trực tiếp trên PostgreSQL thật: Tồn khả dụng không bao giờ âm
        await using var verifyDb = CreateDbContext();
        var finalInventory = await verifyDb.Inventories.AsNoTracking().FirstAsync(i => i.VariantId == variant.Id);

        finalInventory.OnHandQuantity.Should().Be(10);
        finalInventory.ReservedQuantity.Should().Be(10);
        finalInventory.AvailableQuantity.Should().Be(0, "Tồn khả dụng cuối cùng phải đúng bằng 0, không bao giờ được âm");

        // 3. Kiểm tra sổ cái biến động (StockMovement): Đúng chính xác 10 bản ghi Reserve được lưu
        var movements = await verifyDb.StockMovements
            .AsNoTracking()
            .Where(m => m.VariantId == variant.Id && m.Type == StockMovementType.Reserve)
            .ToListAsync();

        movements.Should().HaveCount(10);
        movements.All(m => m.OnHandAfter == 10).Should().BeTrue();
    }

    [Fact]
    public async Task Concurrency_50Requests_CompeteForLast1Item_Exactly1MustSucceed()
    {
        // Arrange: Chỉ còn đúng 1 món duy nhất trong kho (OnHand = 1, Reserved = 0, Available = 1)
        var variant = await CreateTestVariantAsync(initialStock: 1);
        int totalRequests = 50;

        var successCount = 0;
        var failureCount = 0;

        // Act: 50 request đồng thời tranh chấp món cuối cùng
        var tasks = Enumerable.Range(0, totalRequests).Select(async i =>
        {
            await using var db = CreateDbContext();
            var service = new InventoryService(db, NullLogger<InventoryService>.Instance);

            var res = await service.ReserveAsync(
                variantId: variant.Id,
                quantity: 1,
                referenceType: "Order",
                referenceId: $"Order_50_{i}_{Guid.NewGuid():N}",
                reason: $"争奪戦 Request #{i}"
            );

            if (res.IsSuccess)
            {
                Interlocked.Increment(ref successCount);
            }
            else
            {
                Interlocked.Increment(ref failureCount);
            }
        });

        await Task.WhenAll(tasks);

        // Assert:
        successCount.Should().Be(1, "Chỉ duy nhất 1 người giành được món hàng cuối cùng");
        failureCount.Should().Be(49, "49 người còn lại phải thất bại");

        await using var verifyDb = CreateDbContext();
        var finalInventory = await verifyDb.Inventories.AsNoTracking().FirstAsync(i => i.VariantId == variant.Id);

        finalInventory.OnHandQuantity.Should().Be(1);
        finalInventory.ReservedQuantity.Should().Be(1);
        finalInventory.AvailableQuantity.Should().Be(0);
    }

    [Fact]
    public async Task Idempotency_RepeatedRelease_ShouldNotCorruptStockNumbers()
    {
        // Arrange: Có 10 sản phẩm, đã giữ 4 sản phẩm cho đơn Order-999
        var variant = await CreateTestVariantAsync(initialStock: 10);
        string orderId = "Order_Idempotent_Release_" + Guid.NewGuid().ToString("N");

        await using var setupDb = CreateDbContext();
        var service = new InventoryService(setupDb, NullLogger<InventoryService>.Instance);
        var reserveResult = await service.ReserveAsync(variant.Id, 4, "Order", orderId, "Giữ 4 cái");
        reserveResult.IsSuccess.Should().BeTrue();

        // Act: Gọi Release lặp lại 3 lần cho cùng 1 đơn hàng Order-999
        var release1 = await service.ReleaseAsync(variant.Id, 4, "Order", orderId);
        var release2 = await service.ReleaseAsync(variant.Id, 4, "Order", orderId);
        var release3 = await service.ReleaseAsync(variant.Id, 4, "Order", orderId);

        // Assert:
        release1.IsSuccess.Should().BeTrue();
        release2.IsSuccess.Should().BeTrue("Lần 2 phải thành công theo nguyên tắc Idempotent");
        release3.IsSuccess.Should().BeTrue("Lần 3 phải thành công theo nguyên tắc Idempotent");

        await using var verifyDb = CreateDbContext();
        var finalInventory = await verifyDb.Inventories.AsNoTracking().FirstAsync(i => i.VariantId == variant.Id);

        // Reserved không được giảm lố thành số âm (-4 hoặc -8)
        finalInventory.OnHandQuantity.Should().Be(10);
        finalInventory.ReservedQuantity.Should().Be(0, "Reserved phải về 0 và KHÔNG ĐƯỢC GIẢM TIẾP THÀNH ÂM");
        finalInventory.AvailableQuantity.Should().Be(10);
    }

    [Fact]
    public async Task Idempotency_RepeatedCommit_ShouldNotDeductMultipleTimes()
    {
        // Arrange: Có 10 sản phẩm, đã giữ 3 sản phẩm cho đơn Order-888
        var variant = await CreateTestVariantAsync(initialStock: 10);
        string orderId = "Order_Idempotent_Commit_" + Guid.NewGuid().ToString("N");

        await using var setupDb = CreateDbContext();
        var service = new InventoryService(setupDb, NullLogger<InventoryService>.Instance);
        await service.ReserveAsync(variant.Id, 3, "Order", orderId, "Giữ 3 cái");

        // Act: Gọi Commit lặp lại 3 lần cho cùng 1 đơn hàng (ví dụ retry webhook hoặc click đúp thanh toán)
        var commit1 = await service.CommitAsync(variant.Id, 3, "Order", orderId);
        var commit2 = await service.CommitAsync(variant.Id, 3, "Order", orderId);
        var commit3 = await service.CommitAsync(variant.Id, 3, "Order", orderId);

        // Assert:
        commit1.IsSuccess.Should().BeTrue();
        commit2.IsSuccess.Should().BeTrue("Lần 2 idempotent");
        commit3.IsSuccess.Should().BeTrue("Lần 3 idempotent");

        await using var verifyDb = CreateDbContext();
        var finalInventory = await verifyDb.Inventories.AsNoTracking().FirstAsync(i => i.VariantId == variant.Id);

        // OnHand ban đầu là 10, chỉ được trừ đúng 3 cái (còn 7), KHÔNG được trừ 3 lần thành 1 (10 - 3 - 3 - 3)
        finalInventory.OnHandQuantity.Should().Be(7, "Chỉ được trừ kho đúng 1 lần cho đơn hàng này");
        finalInventory.ReservedQuantity.Should().Be(0);
        finalInventory.AvailableQuantity.Should().Be(7);
    }

    [Fact]
    public async Task FullLifecycle_Restock_Reserve_Commit_Release_LedgerIntegrityVerified()
    {
        // Arrange
        var variant = await CreateTestVariantAsync(initialStock: 0);

        await using var db = CreateDbContext();
        var service = new InventoryService(db, NullLogger<InventoryService>.Instance);

        // 1. Restock: Nhập thêm 20
        var restockRes = await service.RestockAsync(variant.Id, 20, "Lô hàng tháng 10");
        restockRes.IsSuccess.Should().BeTrue();
        restockRes.Data!.OnHandQuantity.Should().Be(20);
        restockRes.Data.AvailableQuantity.Should().Be(20);

        // 2. Reserve Đơn A: 8 cái
        string orderA = "Order_A_" + Guid.NewGuid().ToString("N");
        var resA = await service.ReserveAsync(variant.Id, 8, "Order", orderA);
        resA.IsSuccess.Should().BeTrue();
        resA.Data!.ReservedQuantity.Should().Be(8);
        resA.Data.AvailableQuantity.Should().Be(12);

        // 3. Reserve Đơn B: 5 cái
        string orderB = "Order_B_" + Guid.NewGuid().ToString("N");
        var resB = await service.ReserveAsync(variant.Id, 5, "Order", orderB);
        resB.IsSuccess.Should().BeTrue();
        resB.Data!.ReservedQuantity.Should().Be(13);
        resB.Data.AvailableQuantity.Should().Be(7);

        // 4. Commit Đơn A: Thanh toán thành công 8 cái (OnHand giảm từ 20 -> 12, Reserved giảm từ 13 -> 5)
        var commitA = await service.CommitAsync(variant.Id, 8, "Order", orderA);
        commitA.IsSuccess.Should().BeTrue();
        commitA.Data!.OnHandQuantity.Should().Be(12);
        commitA.Data.ReservedQuantity.Should().Be(5);
        commitA.Data.AvailableQuantity.Should().Be(7);

        // 5. Release Đơn B: Khách hủy đơn, hoàn trả 5 cái (Reserved giảm từ 5 -> 0, Available tăng từ 7 -> 12)
        var releaseB = await service.ReleaseAsync(variant.Id, 5, "Order", orderB);
        releaseB.IsSuccess.Should().BeTrue();
        releaseB.Data!.OnHandQuantity.Should().Be(12);
        releaseB.Data.ReservedQuantity.Should().Be(0);
        releaseB.Data.AvailableQuantity.Should().Be(12);

        // 6. Kiểm tra toàn bộ Sổ cái (Stock Movements)
        var movementsRes = await service.GetMovementsAsync(variant.Id);
        movementsRes.IsSuccess.Should().BeTrue();
        var movements = movementsRes.Data!;

        // 4 nghiệp vụ: Restock, Reserve A, Reserve B, Commit A, Release B
        movements.Should().HaveCount(5);
        movements.Should().Contain(m => m.Type == StockMovementType.Restock && m.Quantity == 20);
        movements.Should().Contain(m => m.Type == StockMovementType.Reserve && m.ReferenceId == orderA && m.Quantity == 8);
        movements.Should().Contain(m => m.Type == StockMovementType.Reserve && m.ReferenceId == orderB && m.Quantity == 5);
        movements.Should().Contain(m => m.Type == StockMovementType.Commit && m.ReferenceId == orderA && m.Quantity == 8);
        movements.Should().Contain(m => m.Type == StockMovementType.Release && m.ReferenceId == orderB && m.Quantity == 5);
    }
}
