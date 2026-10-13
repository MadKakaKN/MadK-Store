using System.Data;
using MadK.Application.Common;
using MadK.Application.DTOs.Inventory;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly IAppDbContext _context;
    private readonly DbContext _efContext;
    private readonly ILogger<InventoryService> _logger;
    private static readonly object _inMemoryLock = new();

    public InventoryService(IAppDbContext context, ILogger<InventoryService> logger)
    {
        _context = context;
        _efContext = (DbContext)context;
        _logger = logger;
    }

    public async Task<Result<InventoryDto>> GetStockAsync(Guid variantId, CancellationToken ct = default)
    {
        var inventory = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.VariantId == variantId, ct);
        if (inventory == null)
        {
            inventory = await GetOrCreateInventoryAsync(variantId, ct);
        }

        if (inventory == null)
        {
            return Result<InventoryDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        return Result<InventoryDto>.Success(MapToDto(inventory));
    }

    public async Task<Result<InventoryDto>> RestockAsync(Guid variantId, int quantity, string? reason = null, CancellationToken ct = default)
    {
        if (quantity <= 0)
        {
            return Result<InventoryDto>.Failure("Số lượng nhập kho phải lớn hơn 0.");
        }

        var inventory = await GetOrCreateInventoryAsync(variantId, ct);
        if (inventory == null)
        {
            return Result<InventoryDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        bool isRelational = _efContext.Database.IsRelational();
        DateTime now = DateTime.UtcNow;

        if (isRelational)
        {
            var existingTx = _efContext.Database.CurrentTransaction;
            bool ownsTx = existingTx == null;
            await using var tx = ownsTx ? await _efContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct) : null;
            try
            {
                // Đọc trạng thái trước
                var current = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.VariantId == variantId, ct);
                int onHandBefore = current?.OnHandQuantity ?? 0;
                int reservedBefore = current?.ReservedQuantity ?? 0;

                // Thao tác nguyên tử trên DB: Tăng OnHand
                int affected = await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE inventories 
                       SET on_hand_quantity = on_hand_quantity + {quantity}, 
                           updated_at = {now} 
                       WHERE variant_id = {variantId};", ct);

                if (affected == 0)
                {
                    if (tx != null) await tx.RollbackAsync(ct);
                    return Result<InventoryDto>.Failure("Không thể cập nhật số lượng nhập kho.");
                }

                int onHandAfter = onHandBefore + quantity;
                int reservedAfter = reservedBefore;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = inventory.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Restock,
                    Quantity = quantity,
                    OnHandBefore = onHandBefore,
                    OnHandAfter = onHandAfter,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = reservedAfter,
                    ReferenceType = "Manual",
                    ReferenceId = null,
                    Reason = reason ?? "Nhập hàng vào kho",
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);

                // Đồng bộ tồn kho khả dụng lên biến thể
                await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE product_variants 
                       SET stock_quantity = {onHandAfter - reservedAfter}, 
                            updated_at = {now} 
                       WHERE id = {variantId};", ct);

                await _context.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);

                inventory.OnHandQuantity = onHandAfter;
                inventory.ReservedQuantity = reservedAfter;
                inventory.UpdatedAt = now;

                _logger.LogInformation("Restocked variant {VariantId}: +{Qty} (OnHand: {Before} -> {After})",
                    variantId, quantity, onHandBefore, onHandAfter);

                return Result<InventoryDto>.Success(MapToDto(inventory), "Nhập kho thành công.");
            }
            catch (Exception ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);
                _logger.LogError(ex, "Restock error for variant {VariantId}", variantId);
                return Result<InventoryDto>.Failure("Lỗi hệ thống khi nhập kho.");
            }
        }
        else
        {
            // Fallback InMemory cho test cơ bản
            lock (_inMemoryLock)
            {
                int onHandBefore = inventory.OnHandQuantity;
                int reservedBefore = inventory.ReservedQuantity;

                inventory.OnHandQuantity += quantity;
                inventory.UpdatedAt = now;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = inventory.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Restock,
                    Quantity = quantity,
                    OnHandBefore = onHandBefore,
                    OnHandAfter = inventory.OnHandQuantity,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = reservedBefore,
                    ReferenceType = "Manual",
                    ReferenceId = null,
                    Reason = reason ?? "Nhập hàng vào kho",
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);
                _context.SaveChangesAsync(ct).GetAwaiter().GetResult();
            }

            return Result<InventoryDto>.Success(MapToDto(inventory), "Nhập kho thành công.");
        }
    }

    public async Task<Result<InventoryDto>> ReserveAsync(
        Guid variantId,
        int quantity,
        string referenceType,
        string referenceId,
        string? reason = null,
        CancellationToken ct = default)
    {
        if (quantity <= 0)
        {
            return Result<InventoryDto>.Failure("Số lượng cần giữ phải lớn hơn 0.");
        }

        var inventory = await GetOrCreateInventoryAsync(variantId, ct);
        if (inventory == null)
        {
            return Result<InventoryDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        bool isRelational = _efContext.Database.IsRelational();
        DateTime now = DateTime.UtcNow;

        if (isRelational)
        {
            var existingTx = _efContext.Database.CurrentTransaction;
            bool ownsTx = existingTx == null;
            await using var tx = ownsTx ? await _efContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct) : null;
            try
            {
                // Kiểm tra Idempotency: Nếu reference đã từng Reserve rồi thì không reserve trùng lặp
                if (!string.IsNullOrWhiteSpace(referenceType) && !string.IsNullOrWhiteSpace(referenceId))
                {
                    var existingMovement = await _context.StockMovements
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m => m.VariantId == variantId
                                               && m.ReferenceType == referenceType
                                               && m.ReferenceId == referenceId
                                               && m.Type == StockMovementType.Reserve, ct);
                    if (existingMovement != null)
                    {
                        var currentInv = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.VariantId == variantId, ct);
                        return Result<InventoryDto>.Success(MapToDto(currentInv ?? inventory), "Yêu cầu giữ hàng đã được thực hiện trước đó (Idempotent).");
                    }
                }

                // THAO TÁC NGUYÊN TỬ: Không bao giờ kiểm tra trước rồi mới trừ!
                // Câu lệnh UPDATE có điều kiện (Conditional Update) kiểm tra (on_hand_quantity - reserved_quantity) >= quantity
                // PostgreSQL áp dụng Row Lock độc quyền ngay tại dòng này.
                int affected = await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE inventories 
                       SET reserved_quantity = reserved_quantity + {quantity}, 
                           updated_at = {now} 
                       WHERE variant_id = {variantId} 
                         AND (on_hand_quantity - reserved_quantity) >= {quantity};", ct);

                if (affected == 0)
                {
                    if (tx != null) await tx.RollbackAsync(ct);
                    _logger.LogWarning("Reserve failed: Insufficient available stock for variant {VariantId} (requested {Qty})", variantId, quantity);
                    return Result<InventoryDto>.Failure("Không đủ tồn kho khả dụng để đặt trước/giữ hàng.");
                }

                // Truy vấn bản ghi đã được cập nhật nguyên tử
                var updated = await _context.Inventories.AsNoTracking().FirstAsync(i => i.VariantId == variantId, ct);
                int onHandAfter = updated.OnHandQuantity;
                int reservedAfter = updated.ReservedQuantity;
                int reservedBefore = reservedAfter - quantity;

                // Ghi nhận biến động vào StockMovement
                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = updated.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Reserve,
                    Quantity = quantity,
                    OnHandBefore = onHandAfter,
                    OnHandAfter = onHandAfter,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = reservedAfter,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Reason = reason ?? $"Giữ hàng cho {referenceType}:{referenceId}",
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);

                // Đồng bộ tồn kho khả dụng lên biến thể sản phẩm
                await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE product_variants 
                       SET stock_quantity = {onHandAfter - reservedAfter}, 
                           updated_at = {now} 
                       WHERE id = {variantId};", ct);

                await _context.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);

                _logger.LogInformation("Reserved variant {VariantId}: +{Qty} reserved (Available left: {Avail})",
                    variantId, quantity, onHandAfter - reservedAfter);

                return Result<InventoryDto>.Success(MapToDto(updated), "Giữ hàng thành công.");
            }
            catch (Exception ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);
                _logger.LogError(ex, "Reserve transaction error for variant {VariantId}", variantId);
                return Result<InventoryDto>.Failure("Lỗi hệ thống trong quá trình giữ hàng.");
            }
        }
        else
        {
            // InMemory Provider fallback
            lock (_inMemoryLock)
            {
                if (inventory.AvailableQuantity < quantity)
                {
                    return Result<InventoryDto>.Failure("Không đủ tồn kho khả dụng để đặt trước/giữ hàng.");
                }

                int onHand = inventory.OnHandQuantity;
                int reservedBefore = inventory.ReservedQuantity;
                inventory.ReservedQuantity += quantity;
                inventory.UpdatedAt = now;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = inventory.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Reserve,
                    Quantity = quantity,
                    OnHandBefore = onHand,
                    OnHandAfter = onHand,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = inventory.ReservedQuantity,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Reason = reason,
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);
                _context.SaveChangesAsync(ct).GetAwaiter().GetResult();
            }

            return Result<InventoryDto>.Success(MapToDto(inventory), "Giữ hàng thành công.");
        }
    }

    public async Task<Result<InventoryDto>> ReleaseAsync(
        Guid variantId,
        int quantity,
        string referenceType,
        string referenceId,
        string? reason = null,
        CancellationToken ct = default)
    {
        if (quantity <= 0)
        {
            return Result<InventoryDto>.Failure("Số lượng cần giải phóng phải lớn hơn 0.");
        }

        var inventory = await GetOrCreateInventoryAsync(variantId, ct);
        if (inventory == null)
        {
            return Result<InventoryDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        bool isRelational = _efContext.Database.IsRelational();
        DateTime now = DateTime.UtcNow;

        if (isRelational)
        {
            var existingTx = _efContext.Database.CurrentTransaction;
            bool ownsTx = existingTx == null;
            await using var tx = ownsTx ? await _efContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct) : null;
            try
            {
                // Kiểm tra Idempotency: Giải phóng lặp lại không làm sai số liệu!
                if (!string.IsNullOrWhiteSpace(referenceType) && !string.IsNullOrWhiteSpace(referenceId))
                {
                    var existingRelease = await _context.StockMovements
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m => m.VariantId == variantId
                                               && m.ReferenceType == referenceType
                                               && m.ReferenceId == referenceId
                                               && m.Type == StockMovementType.Release, ct);
                    if (existingRelease != null)
                    {
                        var currentInv = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.VariantId == variantId, ct);
                        return Result<InventoryDto>.Success(MapToDto(currentInv ?? inventory), "Hàng đã được giải phóng trước đó (Idempotent).");
                    }
                }

                // Thao tác nguyên tử: Giảm ReservedQuantity với điều kiện reserved_quantity >= quantity
                int affected = await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE inventories 
                       SET reserved_quantity = reserved_quantity - {quantity}, 
                           updated_at = {now} 
                       WHERE variant_id = {variantId} 
                         AND reserved_quantity >= {quantity};", ct);

                if (affected == 0)
                {
                    if (tx != null) await tx.RollbackAsync(ct);
                    return Result<InventoryDto>.Failure("Số lượng yêu cầu giải phóng vượt quá số lượng đang giữ.");
                }

                var updated = await _context.Inventories.AsNoTracking().FirstAsync(i => i.VariantId == variantId, ct);
                int onHand = updated.OnHandQuantity;
                int reservedAfter = updated.ReservedQuantity;
                int reservedBefore = reservedAfter + quantity;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = updated.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Release,
                    Quantity = quantity,
                    OnHandBefore = onHand,
                    OnHandAfter = onHand,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = reservedAfter,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Reason = reason ?? $"Giải phóng hàng cho {referenceType}:{referenceId}",
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);

                await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE product_variants 
                       SET stock_quantity = {onHand - reservedAfter}, 
                           updated_at = {now} 
                       WHERE id = {variantId};", ct);

                await _context.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);

                _logger.LogInformation("Released variant {VariantId}: -{Qty} reserved (Available now: {Avail})",
                    variantId, quantity, onHand - reservedAfter);

                return Result<InventoryDto>.Success(MapToDto(updated), "Giải phóng hàng thành công.");
            }
            catch (Exception ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);
                _logger.LogError(ex, "Release transaction error for variant {VariantId}", variantId);
                return Result<InventoryDto>.Failure("Lỗi hệ thống khi giải phóng hàng.");
            }
        }
        else
        {
            // InMemory Provider
            lock (_inMemoryLock)
            {
                if (inventory.ReservedQuantity < quantity)
                {
                    return Result<InventoryDto>.Failure("Số lượng yêu cầu giải phóng vượt quá số lượng đang giữ.");
                }

                int onHand = inventory.OnHandQuantity;
                int reservedBefore = inventory.ReservedQuantity;
                inventory.ReservedQuantity -= quantity;
                inventory.UpdatedAt = now;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = inventory.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Release,
                    Quantity = quantity,
                    OnHandBefore = onHand,
                    OnHandAfter = onHand,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = inventory.ReservedQuantity,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Reason = reason,
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);
                _context.SaveChangesAsync(ct).GetAwaiter().GetResult();
            }

            return Result<InventoryDto>.Success(MapToDto(inventory), "Giải phóng hàng thành công.");
        }
    }

    public async Task<Result<InventoryDto>> CommitAsync(
        Guid variantId,
        int quantity,
        string referenceType,
        string referenceId,
        string? reason = null,
        CancellationToken ct = default)
    {
        if (quantity <= 0)
        {
            return Result<InventoryDto>.Failure("Số lượng cần trừ thật (commit) phải lớn hơn 0.");
        }

        var inventory = await GetOrCreateInventoryAsync(variantId, ct);
        if (inventory == null)
        {
            return Result<InventoryDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        bool isRelational = _efContext.Database.IsRelational();
        DateTime now = DateTime.UtcNow;

        if (isRelational)
        {
            var existingTx = _efContext.Database.CurrentTransaction;
            bool ownsTx = existingTx == null;
            await using var tx = ownsTx ? await _efContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct) : null;
            try
            {
                // Kiểm tra Idempotency: Commit lặp lại không làm trừ thật đúp!
                if (!string.IsNullOrWhiteSpace(referenceType) && !string.IsNullOrWhiteSpace(referenceId))
                {
                    var existingCommit = await _context.StockMovements
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m => m.VariantId == variantId
                                               && m.ReferenceType == referenceType
                                               && m.ReferenceId == referenceId
                                               && m.Type == StockMovementType.Commit, ct);
                    if (existingCommit != null)
                    {
                        var currentInv = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.VariantId == variantId, ct);
                        return Result<InventoryDto>.Success(MapToDto(currentInv ?? inventory), "Giao dịch trừ kho đã được thực hiện trước đó (Idempotent).");
                    }
                }

                // Thao tác nguyên tử: Giảm cả OnHandQuantity VÀ ReservedQuantity
                // Điều kiện: reserved_quantity >= quantity VÀ on_hand_quantity >= quantity
                int affected = await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE inventories 
                       SET on_hand_quantity = on_hand_quantity - {quantity}, 
                           reserved_quantity = reserved_quantity - {quantity}, 
                           updated_at = {now} 
                       WHERE variant_id = {variantId} 
                         AND reserved_quantity >= {quantity} 
                         AND on_hand_quantity >= {quantity};", ct);

                if (affected == 0)
                {
                    if (tx != null) await tx.RollbackAsync(ct);
                    return Result<InventoryDto>.Failure("Không thể trừ kho vì số lượng đang giữ hoặc tồn thực tế không đủ.");
                }

                var updated = await _context.Inventories.AsNoTracking().FirstAsync(i => i.VariantId == variantId, ct);
                int onHandAfter = updated.OnHandQuantity;
                int reservedAfter = updated.ReservedQuantity;
                int onHandBefore = onHandAfter + quantity;
                int reservedBefore = reservedAfter + quantity;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = updated.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Commit,
                    Quantity = quantity,
                    OnHandBefore = onHandBefore,
                    OnHandAfter = onHandAfter,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = reservedAfter,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Reason = reason ?? $"Trừ kho thực tế cho {referenceType}:{referenceId}",
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);

                await _efContext.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE product_variants 
                       SET stock_quantity = {onHandAfter - reservedAfter}, 
                           updated_at = {now} 
                       WHERE id = {variantId};", ct);

                await _context.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);

                _logger.LogInformation("Committed variant {VariantId}: -{Qty} on-hand & reserved (OnHand left: {OnHand}, Avail: {Avail})",
                    variantId, quantity, onHandAfter, onHandAfter - reservedAfter);

                return Result<InventoryDto>.Success(MapToDto(updated), "Trừ kho thực tế thành công.");
            }
            catch (Exception ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);
                _logger.LogError(ex, "Commit transaction error for variant {VariantId}", variantId);
                return Result<InventoryDto>.Failure("Lỗi hệ thống khi trừ kho thực tế.");
            }
        }
        else
        {
            // InMemory Provider
            lock (_inMemoryLock)
            {
                if (inventory.ReservedQuantity < quantity || inventory.OnHandQuantity < quantity)
                {
                    return Result<InventoryDto>.Failure("Không thể trừ kho vì số lượng đang giữ hoặc tồn thực tế không đủ.");
                }

                int onHandBefore = inventory.OnHandQuantity;
                int reservedBefore = inventory.ReservedQuantity;

                inventory.OnHandQuantity -= quantity;
                inventory.ReservedQuantity -= quantity;
                inventory.UpdatedAt = now;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    InventoryId = inventory.Id,
                    VariantId = variantId,
                    Type = StockMovementType.Commit,
                    Quantity = quantity,
                    OnHandBefore = onHandBefore,
                    OnHandAfter = inventory.OnHandQuantity,
                    ReservedBefore = reservedBefore,
                    ReservedAfter = inventory.ReservedQuantity,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Reason = reason,
                    CreatedAt = now
                };
                _context.StockMovements.Add(movement);
                _context.SaveChangesAsync(ct).GetAwaiter().GetResult();
            }

            return Result<InventoryDto>.Success(MapToDto(inventory), "Trừ kho thực tế thành công.");
        }
    }

    public async Task<Result<IReadOnlyList<StockMovementDto>>> GetMovementsAsync(Guid variantId, int limit = 50, CancellationToken ct = default)
    {
        var movements = await _context.StockMovements
            .AsNoTracking()
            .Where(m => m.VariantId == variantId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(Math.Clamp(limit, 1, 200))
            .Select(m => new StockMovementDto(
                m.Id,
                m.VariantId,
                m.Type,
                m.Quantity,
                m.OnHandBefore,
                m.OnHandAfter,
                m.ReservedBefore,
                m.ReservedAfter,
                m.ReferenceType,
                m.ReferenceId,
                m.Reason,
                m.CreatedAt
            ))
            .ToListAsync(ct);

        return Result<IReadOnlyList<StockMovementDto>>.Success(movements);
    }

    private async Task<Inventory?> GetOrCreateInventoryAsync(Guid variantId, CancellationToken ct)
    {
        var inventory = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.VariantId == variantId, ct);
        if (inventory != null)
        {
            return inventory;
        }

        var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId, ct);
        if (variant == null)
        {
            return null;
        }

        // Tạo bản ghi tồn kho ban đầu lấy theo variant.StockQuantity
        inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = Math.Max(0, variant.StockQuantity),
            ReservedQuantity = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Inventories.Add(inventory);
        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Trong trường hợp có request đồng thời khác vừa tạo xong row này
            inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.VariantId == variantId, ct);
        }

        return inventory;
    }

    private static InventoryDto MapToDto(Inventory inventory) =>
        new(
            inventory.Id,
            inventory.VariantId,
            inventory.OnHandQuantity,
            inventory.ReservedQuantity,
            inventory.AvailableQuantity,
            inventory.UpdatedAt
        );
}
