namespace MadK.Application.DTOs.Catalog;

public class ProductDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string Specifications { get; set; } = "{}";
    public string? Model3DUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public decimal BasePrice { get; set; }
    public bool IsFeatured { get; set; }

    public CategoryBriefDto Category { get; set; } = null!;
    public BrandBriefDto Brand { get; set; } = null!;

    public List<ProductVariantDto> Variants { get; set; } = new();
    public List<ProductImageDto> Images { get; set; } = new();
}

public class CategoryBriefDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class BrandBriefDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
}

public class ProductVariantDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Attributes { get; set; } = "{}";
    public decimal OriginalPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal CostPrice { get; set; }
    public bool IsActive { get; set; }
    public bool IsOnSale { get; set; }
    public string? PromotionName { get; set; }
    public DateTimeOffset? PromotionEndDate { get; set; }
    public decimal? DiscountPercent { get; set; }
    public List<ProductImageDto> Images { get; set; } = new();
}

public class ProductImageDto
{
    public Guid Id { get; set; }
    public Guid? VariantId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
}
