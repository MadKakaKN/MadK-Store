using MadK.Application.Common;
using MadK.Application.DTOs.Promotions;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class CouponService : ICouponService
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<CouponService> _logger;

    public CouponService(
        IAppDbContext context,
        IAuditLogService auditLogService,
        ILogger<CouponService> logger)
    {
        _context = context;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<Result<CouponCalculationResultDto>> ValidateAndCalculateDiscountAsync(
        string code,
        decimal subtotalAmount,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Result<CouponCalculationResultDto>.Failure("Vui lòng nhập mã giảm giá.");
        }

        var normalizedCode = code.Trim().ToUpperInvariant();
        var coupon = await _context.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Code == normalizedCode, ct);

        if (coupon == null)
        {
            return Result<CouponCalculationResultDto>.Failure("Mã giảm giá không tồn tại trong hệ thống.");
        }

        var validationError = ValidateCouponRules(coupon, subtotalAmount, DateTime.UtcNow);
        if (validationError != null)
        {
            return Result<CouponCalculationResultDto>.Failure(validationError);
        }

        decimal discountAmount = CalculateDiscount(coupon, subtotalAmount);

        var result = new CouponCalculationResultDto(
            IsValid: true,
            Code: coupon.Code,
            DiscountType: coupon.DiscountType,
            DiscountValue: coupon.DiscountValue,
            DiscountAmount: discountAmount,
            Description: coupon.Description,
            ErrorMessage: null
        );

        return Result<CouponCalculationResultDto>.Success(result);
    }

    public async Task<Result<(Coupon Coupon, decimal DiscountAmount)>> ClaimAndIncrementUsageAsync(
        string code,
        decimal subtotalAmount,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Result<(Coupon Coupon, decimal DiscountAmount)>.Failure("Mã giảm giá không hợp lệ.");
        }

        var normalizedCode = code.Trim().ToUpperInvariant();
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == normalizedCode, ct);

        if (coupon == null)
        {
            return Result<(Coupon Coupon, decimal DiscountAmount)>.Failure("Mã giảm giá không tồn tại trong hệ thống.");
        }

        var validationError = ValidateCouponRules(coupon, subtotalAmount, DateTime.UtcNow);
        if (validationError != null)
        {
            return Result<(Coupon Coupon, decimal DiscountAmount)>.Failure(validationError);
        }

        decimal discountAmount = CalculateDiscount(coupon, subtotalAmount);

        // Tăng UsedCount (được bảo vệ bởi [ConcurrencyCheck] khi DbContext lưu thay đổi)
        coupon.UsedCount += 1;
        coupon.UpdatedAt = DateTime.UtcNow;

        _logger.LogInformation("Claiming coupon {Code}. New UsedCount: {UsedCount}/{Limit}",
            coupon.Code, coupon.UsedCount, coupon.UsageLimit);

        return Result<(Coupon Coupon, decimal DiscountAmount)>.Success((coupon, discountAmount));
    }

    public async Task<Result<PagedResult<CouponDto>>> GetCouponsAsync(
        CouponFilterDto filter,
        CancellationToken ct = default)
    {
        var query = _context.Coupons.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToUpperInvariant();
            query = query.Where(c => c.Code.Contains(s) || (c.Description != null && c.Description.Contains(filter.Search.Trim())));
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == filter.IsActive.Value);
        }

        var totalItems = await query.CountAsync(ct);
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Max(1, filter.PageSize);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => MapToDto(c))
            .ToListAsync(ct);

        return Result<PagedResult<CouponDto>>.Success(new PagedResult<CouponDto>(items, page, pageSize, totalItems));
    }

    public async Task<Result<CouponDto>> GetCouponByIdAsync(Guid id, CancellationToken ct = default)
    {
        var coupon = await _context.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (coupon == null)
        {
            return Result<CouponDto>.Failure("Không tìm thấy mã giảm giá.");
        }
        return Result<CouponDto>.Success(MapToDto(coupon));
    }

    public async Task<Result<CouponDto>> CreateCouponAsync(
        CreateCouponDto dto,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return Result<CouponDto>.Failure("Mã giảm giá không được để trống.");
        }

        var normalizedCode = dto.Code.Trim().ToUpperInvariant();
        bool exists = await _context.Coupons.AnyAsync(c => c.Code == normalizedCode, ct);
        if (exists)
        {
            return Result<CouponDto>.Failure($"Mã giảm giá '{normalizedCode}' đã tồn tại trong hệ thống.");
        }

        if (dto.DiscountValue <= 0)
        {
            return Result<CouponDto>.Failure("Giá trị giảm giá phải lớn hơn 0.");
        }

        if (dto.DiscountType == CouponDiscountType.Percentage && dto.DiscountValue > 100)
        {
            return Result<CouponDto>.Failure("Mức giảm theo phần trăm không được vượt quá 100%.");
        }

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate.Value > dto.EndDate.Value)
        {
            return Result<CouponDto>.Failure("Ngày bắt đầu không được lớn hơn ngày hết hạn.");
        }

        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = normalizedCode,
            Description = dto.Description?.Trim(),
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            MaxDiscountAmount = dto.MaxDiscountAmount,
            MinOrderAmount = Math.Max(0m, dto.MinOrderAmount),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            UsageLimit = dto.UsageLimit,
            UsedCount = 0,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync(ct);

        if (_auditLogService != null)
        {
            await _auditLogService.LogAsync(
                action: "COUPON_CREATED",
                entityName: "Coupon",
                entityId: coupon.Code,
                oldValues: null,
                newValues: coupon,
                userId: staffId,
                userEmail: staffEmail,
                userRole: "Staff",
                note: $"Tạo mã giảm giá {coupon.Code}",
                ct: ct);
        }

        return Result<CouponDto>.Success(MapToDto(coupon), "Tạo mã giảm giá thành công.");
    }

    public async Task<Result<CouponDto>> UpdateCouponAsync(
        Guid id,
        UpdateCouponDto dto,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (coupon == null)
        {
            return Result<CouponDto>.Failure("Không tìm thấy mã giảm giá.");
        }

        if (dto.DiscountValue <= 0)
        {
            return Result<CouponDto>.Failure("Giá trị giảm giá phải lớn hơn 0.");
        }

        if (dto.DiscountType == CouponDiscountType.Percentage && dto.DiscountValue > 100)
        {
            return Result<CouponDto>.Failure("Mức giảm theo phần trăm không được vượt quá 100%.");
        }

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate.Value > dto.EndDate.Value)
        {
            return Result<CouponDto>.Failure("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
        }

        coupon.Description = dto.Description?.Trim();
        coupon.DiscountType = dto.DiscountType;
        coupon.DiscountValue = dto.DiscountValue;
        coupon.MaxDiscountAmount = dto.MaxDiscountAmount;
        coupon.MinOrderAmount = Math.Max(0m, dto.MinOrderAmount);
        coupon.StartDate = dto.StartDate;
        coupon.EndDate = dto.EndDate;
        coupon.UsageLimit = dto.UsageLimit;
        coupon.IsActive = dto.IsActive;
        coupon.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        if (_auditLogService != null)
        {
            await _auditLogService.LogAsync(
                action: "COUPON_UPDATED",
                entityName: "Coupon",
                entityId: coupon.Code,
                oldValues: null,
                newValues: coupon,
                userId: staffId,
                userEmail: staffEmail,
                userRole: "Staff",
                note: $"Cập nhật mã giảm giá {coupon.Code}",
                ct: ct);
        }

        return Result<CouponDto>.Success(MapToDto(coupon), "Cập nhật mã giảm giá thành công.");
    }

    public async Task<Result<CouponDto>> ToggleActiveAsync(
        Guid id,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (coupon == null)
        {
            return Result<CouponDto>.Failure("Không tìm thấy mã giảm giá.");
        }

        coupon.IsActive = !coupon.IsActive;
        coupon.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        if (_auditLogService != null)
        {
            await _auditLogService.LogAsync(
                action: coupon.IsActive ? "COUPON_ACTIVATED" : "COUPON_DEACTIVATED",
                entityName: "Coupon",
                entityId: coupon.Code,
                oldValues: null,
                newValues: new { coupon.IsActive },
                userId: staffId,
                userEmail: staffEmail,
                userRole: "Staff",
                note: $"{(coupon.IsActive ? "Kích hoạt" : "Vô hiệu hóa")} mã {coupon.Code}",
                ct: ct);
        }

        return Result<CouponDto>.Success(MapToDto(coupon), $"Đã {(coupon.IsActive ? "kích hoạt" : "vô hiệu hóa")} mã giảm giá.");
    }

    public async Task<Result<bool>> DeleteCouponAsync(
        Guid id,
        Guid? staffId = null,
        string? staffEmail = null,
        CancellationToken ct = default)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (coupon == null)
        {
            return Result<bool>.Failure("Không tìm thấy mã giảm giá.");
        }

        if (coupon.UsedCount > 0)
        {
            // Nếu đã từng có người dùng mã, chuyển sang vô hiệu hóa để bảo toàn tính toàn vẹn dữ liệu
            coupon.IsActive = false;
            coupon.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return Result<bool>.Success(true, "Mã giảm giá đã có lượt sử dụng nên đã được vô hiệu hóa thay vì xóa hoàn toàn.");
        }

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync(ct);

        if (_auditLogService != null)
        {
            await _auditLogService.LogAsync(
                action: "COUPON_DELETED",
                entityName: "Coupon",
                entityId: coupon.Code,
                oldValues: null,
                newValues: null,
                userId: staffId,
                userEmail: staffEmail,
                userRole: "Staff",
                note: $"Xóa mã giảm giá {coupon.Code}",
                ct: ct);
        }

        return Result<bool>.Success(true, "Xóa mã giảm giá thành công.");
    }

    private static string? ValidateCouponRules(Coupon coupon, decimal subtotalAmount, DateTime now)
    {
        if (!coupon.IsActive)
        {
            return "Mã giảm giá hiện đang bị khóa hoặc không khả dụng.";
        }

        if (coupon.StartDate.HasValue && now < coupon.StartDate.Value)
        {
            return $"Mã giảm giá chưa đến đợt áp dụng (Bắt đầu từ {coupon.StartDate.Value:dd/MM/yyyy}).";
        }

        if (coupon.EndDate.HasValue && now > coupon.EndDate.Value)
        {
            return $"Mã giảm giá đã hết hạn sử dụng vào ngày {coupon.EndDate.Value:dd/MM/yyyy}.";
        }

        if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value)
        {
            return "Mã giảm giá đã hết lượt sử dụng.";
        }

        if (coupon.MinOrderAmount > 0 && subtotalAmount < coupon.MinOrderAmount)
        {
            return $"Đơn hàng tối thiểu phải từ {coupon.MinOrderAmount:N0}đ để áp dụng mã này (Tạm tính hiện tại: {subtotalAmount:N0}đ).";
        }

        return null;
    }

    private static decimal CalculateDiscount(Coupon coupon, decimal subtotalAmount)
    {
        decimal discount;

        if (coupon.DiscountType == CouponDiscountType.Percentage)
        {
            discount = subtotalAmount * (coupon.DiscountValue / 100m);
            if (coupon.MaxDiscountAmount.HasValue && coupon.MaxDiscountAmount.Value > 0)
            {
                discount = Math.Min(discount, coupon.MaxDiscountAmount.Value);
            }
        }
        else
        {
            discount = Math.Min(coupon.DiscountValue, subtotalAmount);
        }

        return Math.Max(0m, Math.Round(discount, 0));
    }

    private static CouponDto MapToDto(Coupon c) => new(
        Id: c.Id,
        Code: c.Code,
        Description: c.Description,
        DiscountType: c.DiscountType,
        DiscountValue: c.DiscountValue,
        MaxDiscountAmount: c.MaxDiscountAmount,
        MinOrderAmount: c.MinOrderAmount,
        StartDate: c.StartDate,
        EndDate: c.EndDate,
        UsageLimit: c.UsageLimit,
        UsedCount: c.UsedCount,
        IsActive: c.IsActive,
        CreatedAt: c.CreatedAt
    );
}
