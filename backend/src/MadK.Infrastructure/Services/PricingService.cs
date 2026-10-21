using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Pricing;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class PricingService : IPricingService
{
    private readonly IAppDbContext _context;
    private readonly ILogger<PricingService> _logger;

    public PricingService(IAppDbContext context, ILogger<PricingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Hàm tính "giá hiện hành" dùng chung cho catalog, giỏ hàng, đơn hàng.
    /// Tính giá có hiệu lực tại thời điểm xác định (mặc định là UtcNow).
    /// </summary>
    public async Task<CurrentPriceResult> GetCurrentPriceAsync(
        Guid variantId,
        DateTimeOffset? atTime = null,
        CancellationToken ct = default)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.PriceSchedules)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == variantId, ct);

        if (variant == null)
        {
            return new CurrentPriceResult
            {
                VariantId = variantId,
                OriginalPrice = 0m,
                CurrentPrice = 0m,
                IsOnSale = false
            };
        }

        return CalculateCurrentPrice(variant, atTime);
    }

    /// <summary>
    /// Hàm tính "giá hiện hành" từ thực thể ProductVariant đã nạp sẵn danh sách PriceSchedules trong bộ nhớ.
    /// Dùng cho các luồng duyệt catalog, giỏ hàng, tạo đơn hàng để tối ưu hiệu năng không query N+1.
    /// </summary>
    public CurrentPriceResult CalculateCurrentPrice(ProductVariant variant, DateTimeOffset? atTime = null)
    {
        var time = atTime ?? DateTimeOffset.UtcNow;

        // Tìm lịch khuyến mãi đang có hiệu lực tại thời điểm "time"
        // Điều kiện: Active, chưa xóa mềm, khác Standard price, StartDate <= time <= EndDate
        var activePromotion = variant.PriceSchedules?
            .Where(s => s.IsActive
                        && !s.IsDeleted
                        && s.PriceType != PriceType.Standard
                        && s.StartDate <= time
                        && (!s.EndDate.HasValue || time <= s.EndDate.Value))
            .OrderBy(s => s.PriceType == PriceType.FlashSale ? 0 : 1)
            .ThenBy(s => s.Price)
            .ThenByDescending(s => s.CreatedAt)
            .FirstOrDefault();

        if (activePromotion != null)
        {
            var originalPrice = activePromotion.OriginalPrice > 0 ? activePromotion.OriginalPrice : variant.OriginalPrice;
            return new CurrentPriceResult
            {
                VariantId = variant.Id,
                OriginalPrice = originalPrice,
                CurrentPrice = activePromotion.Price,
                IsOnSale = true,
                PromotionName = activePromotion.Reason,
                PromotionStartDate = activePromotion.StartDate,
                PromotionEndDate = activePromotion.EndDate,
                ActiveScheduleId = activePromotion.Id
            };
        }

        return new CurrentPriceResult
        {
            VariantId = variant.Id,
            OriginalPrice = variant.OriginalPrice,
            CurrentPrice = variant.SalePrice,
            IsOnSale = false,
            PromotionName = null,
            PromotionStartDate = null,
            PromotionEndDate = null,
            ActiveScheduleId = null
        };
    }

    /// <summary>
    /// Lấy toàn bộ lịch sử và cấu hình giá theo biến thể.
    /// </summary>
    public async Task<Result<VariantPricingDto>> GetVariantPricingAsync(Guid variantId, CancellationToken ct = default)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.Product)
            .Include(v => v.Images)
            .Include(v => v.PriceSchedules)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == variantId, ct);

        if (variant == null)
        {
            return Result<VariantPricingDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        var now = DateTimeOffset.UtcNow;
        var currentPrice = CalculateCurrentPrice(variant, now);

        var schedulesDto = (variant.PriceSchedules ?? new List<PriceSchedule>())
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapToScheduleDto(s, now))
            .ToList();

        var dto = new VariantPricingDto
        {
            VariantId = variant.Id,
            ProductId = variant.ProductId,
            Sku = variant.Sku,
            VariantName = variant.Name,
            ProductName = variant.Product?.Name ?? variant.Name,
            ProductSlug = variant.Product?.Slug ?? string.Empty,
            ThumbnailUrl = variant.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl ?? variant.Product?.ThumbnailUrl,
            BaseOriginalPrice = variant.OriginalPrice,
            BaseSalePrice = variant.SalePrice,
            CurrentPrice = currentPrice,
            Schedules = schedulesDto
        };

        return Result<VariantPricingDto>.Success(dto);
    }

    /// <summary>
    /// Tạo khoảng giá khuyến mãi theo thời gian cho biến thể.
    /// Từ chối nếu khoảng thời gian bị chồng chéo với khuyến mãi hiện có.
    /// </summary>
    public async Task<Result<PriceScheduleDto>> CreatePromotionScheduleAsync(
        Guid variantId,
        CreatePriceScheduleDto dto,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.PriceSchedules)
            .FirstOrDefaultAsync(v => v.Id == variantId, ct);

        if (variant == null)
        {
            return Result<PriceScheduleDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        // 1. Kiểm tra tính hợp lệ cơ bản
        if (dto.EndDate.HasValue && dto.EndDate.Value <= dto.StartDate)
        {
            return Result<PriceScheduleDto>.Failure("Thời gian kết thúc khuyến mãi phải sau thời gian bắt đầu.");
        }

        if (dto.Price <= 0)
        {
            return Result<PriceScheduleDto>.Failure("Giá khuyến mãi phải lớn hơn 0đ.");
        }

        var effectiveOriginalPrice = dto.OriginalPrice.HasValue && dto.OriginalPrice.Value > 0
            ? dto.OriginalPrice.Value
            : variant.OriginalPrice;

        if (dto.Price > effectiveOriginalPrice)
        {
            return Result<PriceScheduleDto>.Failure($"Giá khuyến mãi ({dto.Price:N0}đ) không thể cao hơn giá gốc niêm yết ({effectiveOriginalPrice:N0}đ).");
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return Result<PriceScheduleDto>.Failure("Vui lòng nhập tên chương trình hoặc lý do khuyến mãi.");
        }

        // 2. Kiểm tra chồng chéo khoảng thời gian (Overlap Check)
        var newStart = dto.StartDate;
        var newEnd = dto.EndDate ?? DateTimeOffset.MaxValue;

        var existingSchedules = variant.PriceSchedules
            .Where(s => s.IsActive && !s.IsDeleted && s.PriceType != PriceType.Standard)
            .ToList();

        foreach (var existing in existingSchedules)
        {
            var exStart = existing.StartDate;
            var exEnd = existing.EndDate ?? DateTimeOffset.MaxValue;

            // Điều kiện chồng chéo 2 khoảng [A, B] và [C, D]: A <= D && C <= B
            if (newStart <= exEnd && exStart <= newEnd)
            {
                var exEndStr = existing.EndDate.HasValue ? existing.EndDate.Value.ToString("dd/MM/yyyy HH:mm") : "Vô thời hạn";
                var newEndStr = dto.EndDate.HasValue ? dto.EndDate.Value.ToString("dd/MM/yyyy HH:mm") : "Vô thời hạn";

                return Result<PriceScheduleDto>.Failure(
                    $"Khoảng thời gian khuyến mãi ({newStart:dd/MM/yyyy HH:mm} - {newEndStr}) bị chồng chéo với chương trình '{existing.Reason}' ({exStart:dd/MM/yyyy HH:mm} - {exEndStr}).");
            }
        }

        // 3. Tạo PriceSchedule mới
        var schedule = new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = dto.PriceType,
            Price = dto.Price,
            OriginalPrice = effectiveOriginalPrice,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Reason = dto.Reason.Trim(),
            Note = dto.Note?.Trim(),
            IsActive = true,
            CreatedBy = actorEmail ?? "Admin",
            CreatedAt = DateTime.UtcNow
        };

        _context.PriceSchedules.Add(schedule);
        variant.PriceSchedules.Add(schedule);

        // Nếu khuyến mãi có hiệu lực ngay bây giờ, đồng bộ SalePrice của variant
        var now = DateTimeOffset.UtcNow;
        var currentPriceResult = CalculateCurrentPrice(variant, now);
        if (currentPriceResult.IsOnSale)
        {
            variant.SalePrice = currentPriceResult.CurrentPrice;
            variant.UpdatedAt = DateTime.UtcNow;
        }

        // 4. Ghi AuditLog
        await LogAuditAsync(
            actorId: actorId,
            actorEmail: actorEmail,
            action: "CreatePromotionSchedule",
            entityName: "PriceSchedule",
            entityId: schedule.Id.ToString(),
            oldValues: null,
            newValues: JsonSerializer.Serialize(new
            {
                variantId = variant.Id,
                sku = variant.Sku,
                price = schedule.Price,
                originalPrice = schedule.OriginalPrice,
                startDate = schedule.StartDate,
                endDate = schedule.EndDate,
                reason = schedule.Reason
            }),
            ct: ct);

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Tạo khuyến mãi thành công cho SKU {Sku}: {Reason} [{Price:N0}đ, {Start} - {End}]",
            variant.Sku, schedule.Reason, schedule.Price, schedule.StartDate, schedule.EndDate);

        return Result<PriceScheduleDto>.Success(MapToScheduleDto(schedule, now));
    }

    /// <summary>
    /// Cập nhật giá niêm yết và giá bán chuẩn của biến thể, đồng thời lưu lịch sử thay đổi.
    /// </summary>
    public async Task<Result<VariantPricingDto>> UpdateBasePriceAsync(
        Guid variantId,
        UpdateBasePriceDto dto,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.Product)
            .Include(v => v.PriceSchedules)
            .FirstOrDefaultAsync(v => v.Id == variantId, ct);

        if (variant == null)
        {
            return Result<VariantPricingDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        if (dto.NewOriginalPrice <= 0 || dto.NewSalePrice <= 0)
        {
            return Result<VariantPricingDto>.Failure("Giá niêm yết và giá bán chuẩn phải lớn hơn 0đ.");
        }

        if (dto.NewSalePrice > dto.NewOriginalPrice)
        {
            return Result<VariantPricingDto>.Failure("Giá bán chuẩn không được lớn hơn giá niêm yết gốc.");
        }

        var oldOriginal = variant.OriginalPrice;
        var oldSale = variant.SalePrice;

        // Lưu bản ghi lịch sử giá chuẩn
        var historySchedule = new PriceSchedule
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            PriceType = PriceType.Standard,
            Price = dto.NewSalePrice,
            OriginalPrice = dto.NewOriginalPrice,
            StartDate = DateTimeOffset.UtcNow,
            EndDate = null,
            Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Điều chỉnh giá niêm yết & giá chuẩn" : dto.Reason.Trim(),
            Note = dto.Note?.Trim(),
            IsActive = true,
            CreatedBy = actorEmail ?? "Admin",
            CreatedAt = DateTime.UtcNow
        };

        _context.PriceSchedules.Add(historySchedule);
        variant.PriceSchedules.Add(historySchedule);

        variant.OriginalPrice = dto.NewOriginalPrice;
        variant.SalePrice = dto.NewSalePrice;
        variant.UpdatedAt = DateTime.UtcNow;

        // 4. Ghi AuditLog
        await LogAuditAsync(
            actorId: actorId,
            actorEmail: actorEmail,
            action: "UpdateBasePrice",
            entityName: "ProductVariant",
            entityId: variant.Id.ToString(),
            oldValues: JsonSerializer.Serialize(new { originalPrice = oldOriginal, salePrice = oldSale }),
            newValues: JsonSerializer.Serialize(new { originalPrice = variant.OriginalPrice, salePrice = variant.SalePrice, reason = dto.Reason }),
            ct: ct);

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Cập nhật giá chuẩn SKU {Sku}: Gốc {OldOrig:N0} -> {NewOrig:N0}, Bán {OldSale:N0} -> {NewSale:N0}",
            variant.Sku, oldOriginal, variant.OriginalPrice, oldSale, variant.SalePrice);

        return await GetVariantPricingAsync(variant.Id, ct);
    }

    /// <summary>
    /// Bật/tắt kích hoạt một lịch trình giá khuyến mãi.
    /// </summary>
    public async Task<Result<bool>> ToggleScheduleActiveAsync(
        Guid scheduleId,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default)
    {
        var schedule = await _context.PriceSchedules
            .Include(s => s.Variant)
                .ThenInclude(v => v.PriceSchedules)
            .FirstOrDefaultAsync(s => s.Id == scheduleId, ct);

        if (schedule == null)
        {
            return Result<bool>.Failure("Không tìm thấy chương trình giá.");
        }

        var oldState = schedule.IsActive;
        var newState = !oldState;

        // Nếu bật lại một lịch trình, kiểm tra xem có bị trùng với khuyến mãi đang active khác không
        if (newState && schedule.PriceType != PriceType.Standard)
        {
            var targetStart = schedule.StartDate;
            var targetEnd = schedule.EndDate ?? DateTimeOffset.MaxValue;

            var conflict = schedule.Variant.PriceSchedules
                .Where(s => s.Id != schedule.Id && s.IsActive && !s.IsDeleted && s.PriceType != PriceType.Standard)
                .FirstOrDefault(s => targetStart <= (s.EndDate ?? DateTimeOffset.MaxValue) && s.StartDate <= targetEnd);

            if (conflict != null)
            {
                return Result<bool>.Failure(
                    $"Không thể kích hoạt lại vì khoảng thời gian bị chồng chéo với chương trình '{conflict.Reason}'.");
            }
        }

        schedule.IsActive = newState;
        schedule.UpdatedAt = DateTime.UtcNow;

        // Đồng bộ lại current price vào variant.SalePrice
        var currentPriceResult = CalculateCurrentPrice(schedule.Variant, DateTimeOffset.UtcNow);
        schedule.Variant.SalePrice = currentPriceResult.CurrentPrice;
        schedule.Variant.UpdatedAt = DateTime.UtcNow;

        await LogAuditAsync(
            actorId: actorId,
            actorEmail: actorEmail,
            action: newState ? "ActivatePriceSchedule" : "DeactivatePriceSchedule",
            entityName: "PriceSchedule",
            entityId: schedule.Id.ToString(),
            oldValues: JsonSerializer.Serialize(new { isActive = oldState }),
            newValues: JsonSerializer.Serialize(new { isActive = newState }),
            ct: ct);

        await _context.SaveChangesAsync(ct);

        return Result<bool>.Success(schedule.IsActive);
    }

    /// <summary>
    /// Xóa mềm một lịch trình giá khuyến mãi.
    /// </summary>
    public async Task<Result<bool>> DeleteScheduleAsync(
        Guid scheduleId,
        Guid? actorId = null,
        string? actorEmail = null,
        CancellationToken ct = default)
    {
        var schedule = await _context.PriceSchedules
            .Include(s => s.Variant)
                .ThenInclude(v => v.PriceSchedules)
            .FirstOrDefaultAsync(s => s.Id == scheduleId, ct);

        if (schedule == null)
        {
            return Result<bool>.Failure("Không tìm thấy chương trình giá.");
        }

        schedule.IsDeleted = true;
        schedule.DeletedAt = DateTime.UtcNow;
        schedule.IsActive = false;
        schedule.UpdatedAt = DateTime.UtcNow;

        // Cập nhật lại variant.SalePrice nếu chương trình vừa xóa đang được áp dụng
        var currentPriceResult = CalculateCurrentPrice(schedule.Variant, DateTimeOffset.UtcNow);
        schedule.Variant.SalePrice = currentPriceResult.CurrentPrice;
        schedule.Variant.UpdatedAt = DateTime.UtcNow;

        await LogAuditAsync(
            actorId: actorId,
            actorEmail: actorEmail,
            action: "DeletePriceSchedule",
            entityName: "PriceSchedule",
            entityId: schedule.Id.ToString(),
            oldValues: JsonSerializer.Serialize(new { isDeleted = false, reason = schedule.Reason }),
            newValues: JsonSerializer.Serialize(new { isDeleted = true, deletedAt = schedule.DeletedAt }),
            ct: ct);

        await _context.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }

    /// <summary>
    /// Lấy danh sách biến thể kèm giá hiện hành và trạng thái khuyến mãi (dành cho Admin Pricing UI).
    /// </summary>
    public async Task<Result<PagedResult<AdminVariantPriceItemDto>>> GetAdminVariantPricesAsync(
        AdminPricingQueryParams queryParams,
        CancellationToken ct = default)
    {
        var query = _context.ProductVariants
            .Include(v => v.Product)
                .ThenInclude(p => p.Category)
            .Include(v => v.Product)
                .ThenInclude(p => p.Brand)
            .Include(v => v.Images)
            .Include(v => v.PriceSchedules)
            .AsNoTracking()
            .AsQueryable();

        // 1. Lọc theo search
        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(v =>
                v.Sku.ToLower().Contains(search) ||
                v.Name.ToLower().Contains(search) ||
                v.Product.Name.ToLower().Contains(search));
        }

        // 2. Lọc theo Category
        if (queryParams.CategoryId.HasValue)
        {
            query = query.Where(v => v.Product.CategoryId == queryParams.CategoryId.Value);
        }

        // 3. Lọc theo Brand
        if (queryParams.BrandId.HasValue)
        {
            query = query.Where(v => v.Product.BrandId == queryParams.BrandId.Value);
        }

        var now = DateTimeOffset.UtcNow;

        var allVariants = await query.ToListAsync(ct);

        // Map and compute current prices
        var items = allVariants.Select(v =>
        {
            var priceResult = CalculateCurrentPrice(v, now);
            var activeSchedules = v.PriceSchedules?.Where(s => s.IsActive && !s.IsDeleted).ToList() ?? new List<PriceSchedule>();

            var hasUpcoming = activeSchedules.Any(s => s.PriceType != PriceType.Standard && s.StartDate > now);

            return new AdminVariantPriceItemDto
            {
                VariantId = v.Id,
                ProductId = v.ProductId,
                ProductName = v.Product?.Name ?? v.Name,
                VariantName = v.Name,
                Sku = v.Sku,
                CategoryName = v.Product?.Category?.Name ?? string.Empty,
                BrandName = v.Product?.Brand?.Name ?? string.Empty,
                ThumbnailUrl = v.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl ?? v.Product?.ThumbnailUrl,
                BaseOriginalPrice = v.OriginalPrice,
                BaseSalePrice = v.SalePrice,
                EffectivePrice = priceResult.CurrentPrice,
                IsOnSale = priceResult.IsOnSale,
                DiscountPercent = priceResult.DiscountPercent,
                ActivePromotionName = priceResult.PromotionName,
                PromotionStartDate = priceResult.PromotionStartDate,
                PromotionEndDate = priceResult.PromotionEndDate,
                TotalSchedulesCount = activeSchedules.Count,
                StockQuantity = v.StockQuantity,
                IsActive = v.IsActive
            };
        }).AsQueryable();

        // 4. Lọc trạng thái OnSale hoặc Upcoming
        if (queryParams.OnlyOnSale == true)
        {
            items = items.Where(x => x.IsOnSale);
        }

        var totalItems = items.Count();
        var pagedItems = items
            .OrderByDescending(x => x.IsOnSale)
            .ThenBy(x => x.ProductName)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToList();

        var result = new PagedResult<AdminVariantPriceItemDto>(pagedItems, queryParams.Page, queryParams.PageSize, totalItems);
        return Result<PagedResult<AdminVariantPriceItemDto>>.Success(result);
    }

    private static PriceScheduleDto MapToScheduleDto(PriceSchedule s, DateTimeOffset now)
    {
        var isCurrent = s.IsActive && s.StartDate <= now && (!s.EndDate.HasValue || now <= s.EndDate.Value);
        var isUpcoming = s.IsActive && now < s.StartDate;
        var isExpired = s.EndDate.HasValue && now > s.EndDate.Value;

        return new PriceScheduleDto
        {
            Id = s.Id,
            VariantId = s.VariantId,
            PriceType = s.PriceType,
            Price = s.Price,
            OriginalPrice = s.OriginalPrice,
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            Reason = s.Reason,
            Note = s.Note,
            IsActive = s.IsActive,
            IsCurrent = isCurrent,
            IsUpcoming = isUpcoming,
            IsExpired = isExpired,
            CreatedBy = s.CreatedBy,
            CreatedAt = s.CreatedAt
        };
    }

    private Task LogAuditAsync(
        Guid? actorId,
        string? actorEmail,
        string action,
        string entityName,
        string entityId,
        string? oldValues,
        string? newValues,
        CancellationToken ct)
    {
        try
        {
            var audit = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = actorId,
                UserEmail = actorEmail,
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(audit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi ghi AuditLog cho {Action} trên {EntityName}:{EntityId}", action, entityName, entityId);
        }
        return Task.CompletedTask;
    }
}
