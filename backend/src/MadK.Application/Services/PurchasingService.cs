using MadK.Application.Common;
using MadK.Application.DTOs.Inventory;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Application.Services;

public class PurchasingService : IPurchasingService
{
    private readonly IAppDbContext _context;
    private readonly IInventoryService _inventoryService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<PurchasingService> _logger;

    public PurchasingService(
        IAppDbContext context,
        IInventoryService inventoryService,
        IAuditLogService auditLogService,
        ILogger<PurchasingService> logger)
    {
        _context = context;
        _inventoryService = inventoryService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    #region Suppliers

    public async Task<Result<IReadOnlyList<SupplierDto>>> GetSuppliersAsync(string? search = null, bool? isActive = null, CancellationToken ct = default)
    {
        var query = _context.Suppliers.AsNoTracking().AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(sup => sup.Name.ToLower().Contains(s) || sup.Code.ToLower().Contains(s) || (sup.Phone != null && sup.Phone.Contains(s)));
        }

        var list = await query
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto(
                s.Id,
                s.Code,
                s.Name,
                s.ContactPerson,
                s.Phone,
                s.Email,
                s.Address,
                s.IsActive,
                s.Notes,
                s.CreatedAt,
                s.UpdatedAt
            ))
            .ToListAsync(ct);

        return Result<IReadOnlyList<SupplierDto>>.Success(list);
    }

    public async Task<Result<SupplierDto>> GetSupplierByIdAsync(Guid id, CancellationToken ct = default)
    {
        var s = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s == null)
        {
            return Result<SupplierDto>.Failure("Không tìm thấy nhà cung cấp.");
        }

        return Result<SupplierDto>.Success(new SupplierDto(
            s.Id,
            s.Code,
            s.Name,
            s.ContactPerson,
            s.Phone,
            s.Email,
            s.Address,
            s.IsActive,
            s.Notes,
            s.CreatedAt,
            s.UpdatedAt
        ));
    }

    public async Task<Result<SupplierDto>> CreateSupplierAsync(CreateSupplierDto dto, CancellationToken ct = default)
    {
        var code = dto.Code.Trim().ToUpperInvariant();
        var exists = await _context.Suppliers.AnyAsync(s => s.Code == code, ct);
        if (exists)
        {
            return Result<SupplierDto>.Failure($"Mã nhà cung cấp '{code}' đã tồn tại.");
        }

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = dto.Name.Trim(),
            ContactPerson = dto.ContactPerson?.Trim(),
            Phone = dto.Phone?.Trim(),
            Email = dto.Email?.Trim(),
            Address = dto.Address?.Trim(),
            Notes = dto.Notes?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync(ct);

        return Result<SupplierDto>.Success(new SupplierDto(
            supplier.Id,
            supplier.Code,
            supplier.Name,
            supplier.ContactPerson,
            supplier.Phone,
            supplier.Email,
            supplier.Address,
            supplier.IsActive,
            supplier.Notes,
            supplier.CreatedAt,
            supplier.UpdatedAt
        ), "Tạo nhà cung cấp thành công.");
    }

    public async Task<Result<SupplierDto>> UpdateSupplierAsync(Guid id, UpdateSupplierDto dto, CancellationToken ct = default)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (supplier == null)
        {
            return Result<SupplierDto>.Failure("Không tìm thấy nhà cung cấp.");
        }

        supplier.Name = dto.Name.Trim();
        supplier.ContactPerson = dto.ContactPerson?.Trim();
        supplier.Phone = dto.Phone?.Trim();
        supplier.Email = dto.Email?.Trim();
        supplier.Address = dto.Address?.Trim();
        supplier.IsActive = dto.IsActive;
        supplier.Notes = dto.Notes?.Trim();
        supplier.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return Result<SupplierDto>.Success(new SupplierDto(
            supplier.Id,
            supplier.Code,
            supplier.Name,
            supplier.ContactPerson,
            supplier.Phone,
            supplier.Email,
            supplier.Address,
            supplier.IsActive,
            supplier.Notes,
            supplier.CreatedAt,
            supplier.UpdatedAt
        ), "Cập nhật nhà cung cấp thành công.");
    }

    public async Task<Result<bool>> DeleteSupplierAsync(Guid id, CancellationToken ct = default)
    {
        var supplier = await _context.Suppliers
            .Include(s => s.PurchaseOrders)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (supplier == null)
        {
            return Result<bool>.Failure("Không tìm thấy nhà cung cấp.");
        }

        if (supplier.PurchaseOrders.Any())
        {
            // Soft delete by deactivating
            supplier.IsActive = false;
            supplier.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            return Result<bool>.Success(true, "Nhà cung cấp đã có phiếu nhập, chuyển trạng thái ngưng hoạt động.");
        }

        _context.Suppliers.Remove(supplier);
        await _context.SaveChangesAsync(ct);
        return Result<bool>.Success(true, "Đã xóa nhà cung cấp.");
    }

    #endregion

    #region Purchase Orders

    public async Task<Result<IReadOnlyList<PurchaseOrderDto>>> GetPurchaseOrdersAsync(PurchaseOrderQueryFilter filter, CancellationToken ct = default)
    {
        var query = _context.PurchaseOrders
            .AsNoTracking()
            .Include(po => po.Supplier)
            .Include(po => po.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
            .AsQueryable();

        if (filter.SupplierId.HasValue && filter.SupplierId.Value != Guid.Empty)
        {
            query = query.Where(po => po.SupplierId == filter.SupplierId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(po => po.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToLower();
            query = query.Where(po => po.Code.ToLower().Contains(s) || (po.Supplier != null && po.Supplier.Name.ToLower().Contains(s)));
        }

        var list = await query
            .OrderByDescending(po => po.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(po => MapToPurchaseOrderDto(po))
            .ToListAsync(ct);

        return Result<IReadOnlyList<PurchaseOrderDto>>.Success(list);
    }

    public async Task<Result<PurchaseOrderDto>> GetPurchaseOrderByIdAsync(Guid id, CancellationToken ct = default)
    {
        var po = await _context.PurchaseOrders
            .AsNoTracking()
            .Include(p => p.Supplier)
            .Include(p => p.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (po == null)
        {
            return Result<PurchaseOrderDto>.Failure("Không tìm thấy phiếu nhập hàng.");
        }

        return Result<PurchaseOrderDto>.Success(MapToPurchaseOrderDto(po));
    }

    public async Task<Result<PurchaseOrderDto>> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, string? createdBy = null, CancellationToken ct = default)
    {
        if (dto.Items == null || !dto.Items.Any())
        {
            return Result<PurchaseOrderDto>.Failure("Phiếu nhập phải có ít nhất 1 mặt hàng.");
        }

        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == dto.SupplierId, ct);
        if (supplier == null)
        {
            return Result<PurchaseOrderDto>.Failure("Nhà cung cấp không tồn tại.");
        }

        var code = string.IsNullOrWhiteSpace(dto.Code)
            ? $"PO-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : dto.Code.Trim().ToUpperInvariant();

        var existing = await _context.PurchaseOrders.AnyAsync(p => p.Code == code, ct);
        if (existing)
        {
            return Result<PurchaseOrderDto>.Failure($"Mã phiếu nhập '{code}' đã tồn tại.");
        }

        decimal totalAmount = 0;
        var poItems = new List<PurchaseOrderItem>();

        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0)
            {
                return Result<PurchaseOrderDto>.Failure("Số lượng nhập phải lớn hơn 0.");
            }
            if (item.UnitCost < 0)
            {
                return Result<PurchaseOrderDto>.Failure("Giá vốn không được âm.");
            }

            var lineTotal = item.Quantity * item.UnitCost;
            totalAmount += lineTotal;

            poItems.Add(new PurchaseOrderItem
            {
                Id = Guid.NewGuid(),
                VariantId = item.VariantId,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost,
                TotalCost = lineTotal,
                Notes = item.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow
            });
        }

        var po = new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            Code = code,
            SupplierId = supplier.Id,
            Supplier = supplier,
            Status = PurchaseOrderStatus.Draft,
            TotalAmount = totalAmount,
            Notes = dto.Notes?.Trim(),
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Items = poItems
        };

        _context.PurchaseOrders.Add(po);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created purchase order {Code} with {Count} items for supplier {Supplier}",
            po.Code, po.Items.Count, supplier.Name);

        return await GetPurchaseOrderByIdAsync(po.Id, ct);
    }

    public async Task<Result<PurchaseOrderDto>> ReceivePurchaseOrderAsync(Guid id, string? receivedBy = null, CancellationToken ct = default)
    {
        var po = await _context.PurchaseOrders
            .Include(p => p.Supplier)
            .Include(p => p.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (po == null)
        {
            return Result<PurchaseOrderDto>.Failure("Không tìm thấy phiếu nhập hàng.");
        }

        if (po.Status == PurchaseOrderStatus.Received)
        {
            return Result<PurchaseOrderDto>.Failure("Phiếu nhập hàng này đã được nhập kho trước đó.");
        }

        if (po.Status == PurchaseOrderStatus.Cancelled)
        {
            return Result<PurchaseOrderDto>.Failure("Không thể nhập hàng cho phiếu đã bị hủy.");
        }

        // THỰC HIỆN NHẬP KHO: MỌI BIẾN ĐỘNG TỒN ĐI QUA INVENTORY SERVICE
        foreach (var item in po.Items)
        {
            var restockResult = await _inventoryService.RestockAsync(
                variantId: item.VariantId,
                quantity: item.Quantity,
                reason: $"Nhập hàng theo phiếu {po.Code} từ NCC {po.Supplier?.Name ?? "N/A"}",
                referenceType: "PurchaseOrder",
                referenceId: po.Id.ToString(),
                ct: ct);

            if (!restockResult.IsSuccess)
            {
                return Result<PurchaseOrderDto>.Failure($"Lỗi khi nhập kho biến thể {item.Variant?.Sku ?? item.VariantId.ToString()}: {restockResult.Error}");
            }

            // Ghi nhận và cập nhật giá vốn (CostPrice) lên ProductVariant
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == item.VariantId, ct);
            if (variant != null)
            {
                variant.CostPrice = item.UnitCost;
                variant.UpdatedAt = DateTime.UtcNow;
            }
        }

        po.Status = PurchaseOrderStatus.Received;
        po.ReceivedAt = DateTime.UtcNow;
        po.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PURCHASE_ORDER_RECEIVED",
            entityName: "PurchaseOrder",
            entityId: po.Id.ToString(),
            oldValues: new { Status = "Draft" },
            newValues: new { Status = "Received", TotalAmount = po.TotalAmount, ItemsCount = po.Items.Count },
            userId: null,
            userEmail: receivedBy,
            userRole: "Staff",
            note: $"Hoàn tất nhập hàng theo phiếu {po.Code}. Đã cập nhật giá vốn và tăng tồn kho tương ứng.",
            ct: ct);

        return await GetPurchaseOrderByIdAsync(po.Id, ct);
    }

    public async Task<Result<PurchaseOrderDto>> CancelPurchaseOrderAsync(Guid id, string? reason = null, CancellationToken ct = default)
    {
        var po = await _context.PurchaseOrders
            .Include(p => p.Supplier)
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (po == null)
        {
            return Result<PurchaseOrderDto>.Failure("Không tìm thấy phiếu nhập hàng.");
        }

        if (po.Status == PurchaseOrderStatus.Received)
        {
            return Result<PurchaseOrderDto>.Failure("Không thể hủy phiếu nhập đã nhận hàng vào kho.");
        }

        po.Status = PurchaseOrderStatus.Cancelled;
        po.Notes = string.IsNullOrWhiteSpace(reason) ? po.Notes : $"{po.Notes} [Hủy: {reason}]";
        po.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return await GetPurchaseOrderByIdAsync(po.Id, ct);
    }

    #endregion

    #region Inventory Audits

    public async Task<Result<IReadOnlyList<InventoryAuditDto>>> GetInventoryAuditsAsync(CancellationToken ct = default)
    {
        var list = await _context.InventoryAudits
            .AsNoTracking()
            .Include(ia => ia.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
            .OrderByDescending(ia => ia.CreatedAt)
            .Select(ia => MapToAuditDto(ia))
            .ToListAsync(ct);

        return Result<IReadOnlyList<InventoryAuditDto>>.Success(list);
    }

    public async Task<Result<InventoryAuditDto>> GetInventoryAuditByIdAsync(Guid id, CancellationToken ct = default)
    {
        var audit = await _context.InventoryAudits
            .AsNoTracking()
            .Include(ia => ia.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(ia => ia.Id == id, ct);

        if (audit == null)
        {
            return Result<InventoryAuditDto>.Failure("Không tìm thấy phiếu kiểm kê kho.");
        }

        return Result<InventoryAuditDto>.Success(MapToAuditDto(audit));
    }

    public async Task<Result<InventoryAuditDto>> CreateInventoryAuditAsync(CreateInventoryAuditDto dto, string? createdBy = null, CancellationToken ct = default)
    {
        if (dto.Items == null || !dto.Items.Any())
        {
            return Result<InventoryAuditDto>.Failure("Đợt kiểm kê phải có ít nhất 1 sản phẩm.");
        }

        var code = string.IsNullOrWhiteSpace(dto.Code)
            ? $"AUD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : dto.Code.Trim().ToUpperInvariant();

        var existing = await _context.InventoryAudits.AnyAsync(a => a.Code == code, ct);
        if (existing)
        {
            return Result<InventoryAuditDto>.Failure($"Mã kiểm kê '{code}' đã tồn tại.");
        }

        var auditItems = new List<InventoryAuditItem>();

        foreach (var reqItem in dto.Items)
        {
            var inv = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.VariantId == reqItem.VariantId, ct);
            var variant = await _context.ProductVariants.AsNoTracking().FirstOrDefaultAsync(v => v.Id == reqItem.VariantId, ct);
            if (variant == null)
            {
                continue;
            }

            int systemQty = inv?.OnHandQuantity ?? variant.StockQuantity;
            int actualQty = reqItem.ActualQuantity ?? systemQty;

            auditItems.Add(new InventoryAuditItem
            {
                Id = Guid.NewGuid(),
                VariantId = reqItem.VariantId,
                SystemQuantity = systemQty,
                ActualQuantity = actualQty,
                Reason = reqItem.Reason?.Trim(),
                CreatedAt = DateTime.UtcNow
            });
        }

        var audit = new InventoryAudit
        {
            Id = Guid.NewGuid(),
            Code = code,
            Status = InventoryAuditStatus.Draft,
            Notes = dto.Notes?.Trim(),
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Items = auditItems
        };

        _context.InventoryAudits.Add(audit);
        await _context.SaveChangesAsync(ct);

        return await GetInventoryAuditByIdAsync(audit.Id, ct);
    }

    public async Task<Result<InventoryAuditDto>> CompleteInventoryAuditAsync(Guid id, CompleteInventoryAuditDto dto, string? completedBy = null, CancellationToken ct = default)
    {
        var audit = await _context.InventoryAudits
            .Include(a => a.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (audit == null)
        {
            return Result<InventoryAuditDto>.Failure("Không tìm thấy phiếu kiểm kê kho.");
        }

        if (audit.Status == InventoryAuditStatus.Completed)
        {
            return Result<InventoryAuditDto>.Failure("Phiếu kiểm kê này đã được hoàn tất trước đó.");
        }

        if (audit.Status == InventoryAuditStatus.Cancelled)
        {
            return Result<InventoryAuditDto>.Failure("Không thể chốt phiếu kiểm kê đã bị hủy.");
        }

        // Cập nhật số lượng đếm thực tế nếu có trong payload
        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var update in dto.Items)
            {
                var target = audit.Items.FirstOrDefault(i => i.VariantId == update.VariantId);
                if (target != null)
                {
                    target.ActualQuantity = update.ActualQuantity;
                    if (!string.IsNullOrWhiteSpace(update.Reason))
                    {
                        target.Reason = update.Reason.Trim();
                    }
                    target.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        // CÂN BẰNG TỒN KHO: VỚI MỖI MÓN CÓ LỆCH, ĐIỀU CHỈNH QUA INVENTORY SERVICE
        foreach (var item in audit.Items)
        {
            int discrepancy = item.ActualQuantity - item.SystemQuantity;
            if (discrepancy != 0)
            {
                var reason = $"Kiểm kho {audit.Code}: {(discrepancy > 0 ? "+" : "")}{discrepancy} ({item.Reason ?? "Kiểm kê định kỳ"})";
                var adjustResult = await _inventoryService.AdjustStockAsync(
                    variantId: item.VariantId,
                    quantityChange: discrepancy,
                    reason: reason,
                    referenceType: "InventoryAudit",
                    referenceId: audit.Id.ToString(),
                    ct: ct);

                if (!adjustResult.IsSuccess)
                {
                    return Result<InventoryAuditDto>.Failure($"Lỗi khi cân bằng tồn cho {item.Variant?.Sku ?? item.VariantId.ToString()}: {adjustResult.Error}");
                }
            }
        }

        audit.Status = InventoryAuditStatus.Completed;
        audit.CompletedAt = DateTime.UtcNow;
        audit.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "INVENTORY_AUDIT_COMPLETED",
            entityName: "InventoryAudit",
            entityId: audit.Id.ToString(),
            oldValues: new { Status = "Draft" },
            newValues: new { Status = "Completed", ItemsCount = audit.Items.Count },
            userId: null,
            userEmail: completedBy,
            userRole: "Staff",
            note: $"Hoàn tất kiểm kê kho {audit.Code} và đã thực hiện cân bằng tồn kho.",
            ct: ct);

        return await GetInventoryAuditByIdAsync(audit.Id, ct);
    }

    public async Task<Result<InventoryAuditDto>> CancelInventoryAuditAsync(Guid id, string? reason = null, CancellationToken ct = default)
    {
        var audit = await _context.InventoryAudits.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (audit == null)
        {
            return Result<InventoryAuditDto>.Failure("Không tìm thấy phiếu kiểm kê kho.");
        }

        if (audit.Status == InventoryAuditStatus.Completed)
        {
            return Result<InventoryAuditDto>.Failure("Không thể hủy phiếu kiểm kê đã hoàn tất cân bằng tồn.");
        }

        audit.Status = InventoryAuditStatus.Cancelled;
        audit.Notes = string.IsNullOrWhiteSpace(reason) ? audit.Notes : $"{audit.Notes} [Hủy: {reason}]";
        audit.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return await GetInventoryAuditByIdAsync(audit.Id, ct);
    }

    #endregion

    #region Mappings

    private static PurchaseOrderDto MapToPurchaseOrderDto(PurchaseOrder po) =>
        new(
            po.Id,
            po.Code,
            po.SupplierId,
            po.Supplier?.Name,
            po.Status,
            po.TotalAmount,
            po.Notes,
            po.CreatedBy,
            po.ReceivedAt,
            po.CreatedAt,
            po.Items.Select(i => new PurchaseOrderItemDto(
                i.Id,
                i.PurchaseOrderId,
                i.VariantId,
                i.Variant?.Sku,
                i.Variant?.Name,
                i.Variant?.Product?.Name,
                i.Quantity,
                i.UnitCost,
                i.TotalCost,
                i.Notes
            )).ToList()
        );

    private static InventoryAuditDto MapToAuditDto(InventoryAudit ia) =>
        new(
            ia.Id,
            ia.Code,
            ia.Status,
            ia.Notes,
            ia.CreatedBy,
            ia.CompletedAt,
            ia.CreatedAt,
            ia.Items.Select(i => new InventoryAuditItemDto(
                i.Id,
                i.InventoryAuditId,
                i.VariantId,
                i.Variant?.Sku,
                i.Variant?.Name,
                i.Variant?.Product?.Name,
                i.SystemQuantity,
                i.ActualQuantity,
                i.Discrepancy,
                i.Reason
            )).ToList()
        );

    #endregion
}
