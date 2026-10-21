using MadK.Domain.Entities;

namespace MadK.Application.DTOs.Pricing;

public class CurrentPriceResult
{
    public Guid VariantId { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal CurrentPrice { get; set; }
    public bool IsOnSale { get; set; }
    public decimal DiscountAmount => OriginalPrice > CurrentPrice ? OriginalPrice - CurrentPrice : 0m;
    public decimal DiscountPercent => OriginalPrice > 0 && OriginalPrice > CurrentPrice
        ? Math.Round((OriginalPrice - CurrentPrice) / OriginalPrice * 100m, 1)
        : 0m;
    public string? PromotionName { get; set; }
    public DateTimeOffset? PromotionStartDate { get; set; }
    public DateTimeOffset? PromotionEndDate { get; set; }
    public Guid? ActiveScheduleId { get; set; }
}

public class PriceScheduleDto
{
    public Guid Id { get; set; }
    public Guid VariantId { get; set; }
    public PriceType PriceType { get; set; }
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Note { get; set; }
    public bool IsActive { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsUpcoming { get; set; }
    public bool IsExpired { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePriceScheduleDto
{
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Note { get; set; }
    public PriceType PriceType { get; set; } = PriceType.Promotion;
}

public class UpdateBasePriceDto
{
    public decimal NewOriginalPrice { get; set; }
    public decimal NewSalePrice { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class VariantPricingDto
{
    public Guid VariantId { get; set; }
    public Guid ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public decimal BaseOriginalPrice { get; set; }
    public decimal BaseSalePrice { get; set; }
    public CurrentPriceResult CurrentPrice { get; set; } = null!;
    public List<PriceScheduleDto> Schedules { get; set; } = new();
}

public class AdminVariantPriceItemDto
{
    public Guid VariantId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public decimal BaseOriginalPrice { get; set; }
    public decimal BaseSalePrice { get; set; }
    public decimal EffectivePrice { get; set; }
    public bool IsOnSale { get; set; }
    public decimal DiscountPercent { get; set; }
    public string? ActivePromotionName { get; set; }
    public DateTimeOffset? PromotionStartDate { get; set; }
    public DateTimeOffset? PromotionEndDate { get; set; }
    public int TotalSchedulesCount { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; }
}

public class AdminPricingQueryParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? BrandId { get; set; }
    public bool? OnlyOnSale { get; set; }
    public bool? HasUpcomingSale { get; set; }
}
