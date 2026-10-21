namespace MadK.Application.DTOs.Admin;

#region Category DTOs
public record AdminCategoryListDto(
    Guid Id,
    Guid? ParentId,
    string? ParentName,
    string Name,
    string Slug,
    string? Description,
    string? IconUrl,
    int DisplayOrder,
    bool IsActive,
    bool IsDeleted,
    int ProductsCount,
    bool HasSchema,
    DateTime CreatedAt
);

public record AdminCategoryDetailDto(
    Guid Id,
    Guid? ParentId,
    string Name,
    string Slug,
    string? Description,
    string? IconUrl,
    int DisplayOrder,
    bool IsActive,
    bool IsDeleted,
    string? SchemaDefinition
);

public record CreateCategoryRequestDto(
    string Name,
    string? Slug,
    Guid? ParentId,
    string? Description,
    string? IconUrl,
    int DisplayOrder = 0,
    bool IsActive = true,
    string? SchemaDefinition = null
);

public record UpdateCategoryRequestDto(
    string Name,
    string? Slug,
    Guid? ParentId,
    string? Description,
    string? IconUrl,
    int DisplayOrder,
    bool IsActive
);

public record UpdateCategorySchemaRequestDto(
    string SchemaDefinition
);
#endregion

#region Brand DTOs
public record AdminBrandListDto(
    Guid Id,
    string Name,
    string Slug,
    string? LogoUrl,
    string? Description,
    bool IsActive,
    bool IsDeleted,
    int ProductsCount,
    DateTime CreatedAt
);

public record AdminBrandDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string? LogoUrl,
    string? Description,
    bool IsActive,
    bool IsDeleted
);

public record CreateBrandRequestDto(
    string Name,
    string? Slug,
    string? LogoUrl,
    string? Description,
    bool IsActive = true
);

public record UpdateBrandRequestDto(
    string Name,
    string? Slug,
    string? LogoUrl,
    string? Description,
    bool IsActive
);
#endregion

#region Product & Variant DTOs
public record AdminProductListDto(
    Guid Id,
    string Name,
    string Slug,
    Guid CategoryId,
    string CategoryName,
    Guid BrandId,
    string BrandName,
    decimal BasePrice,
    decimal MinPrice,
    decimal MaxPrice,
    string? ThumbnailUrl,
    string? Model3DUrl,
    bool IsFeatured,
    bool IsActive,
    bool IsDeleted,
    int VariantsCount,
    int TotalStock,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record AdminProductDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string? ShortDescription,
    string? Description,
    Guid CategoryId,
    string CategoryName,
    Guid BrandId,
    string BrandName,
    decimal BasePrice,
    string Specifications,
    string? Model3DUrl,
    string? ThumbnailUrl,
    bool IsFeatured,
    bool IsActive,
    bool IsDeleted,
    List<AdminProductVariantDto> Variants,
    List<AdminProductImageDto> Images,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record AdminProductVariantDto(
    Guid Id,
    Guid ProductId,
    string Sku,
    string Name,
    string Attributes,
    decimal OriginalPrice,
    decimal SalePrice,
    decimal CostPrice,
    bool IsActive,
    bool IsDeleted,
    int StockQuantity,
    int ReservedQuantity,
    int AvailableQuantity
);

public record AdminProductImageDto(
    Guid Id,
    Guid ProductId,
    Guid? VariantId,
    string ImageUrl,
    string? AltText,
    int DisplayOrder,
    bool IsPrimary
);

public record CreateProductRequestDto(
    string Name,
    string? Slug,
    Guid CategoryId,
    Guid BrandId,
    string? ShortDescription,
    string? Description,
    decimal BasePrice,
    string? Specifications,
    string? Model3DUrl,
    string? ThumbnailUrl,
    bool IsFeatured = false,
    bool IsActive = true,
    List<CreateProductVariantRequestDto>? Variants = null,
    List<CreateProductImageRequestDto>? Images = null
);

public record UpdateProductRequestDto(
    string Name,
    string? Slug,
    Guid CategoryId,
    Guid BrandId,
    string? ShortDescription,
    string? Description,
    decimal BasePrice,
    string? Specifications,
    string? Model3DUrl,
    string? ThumbnailUrl,
    bool IsFeatured,
    bool IsActive
);

public record CreateProductVariantRequestDto(
    string Sku,
    string Name,
    string? Attributes,
    decimal OriginalPrice,
    decimal SalePrice,
    decimal CostPrice = 0,
    int StockQuantity = 10,
    bool IsActive = true
);

public record UpdateProductVariantRequestDto(
    string Sku,
    string Name,
    string? Attributes,
    decimal OriginalPrice,
    decimal SalePrice,
    decimal CostPrice,
    int StockQuantity,
    bool IsActive
);

public record CreateProductImageRequestDto(
    Guid? VariantId,
    string ImageUrl,
    string? AltText,
    int DisplayOrder = 0,
    bool IsPrimary = false
);

public class AdminProductQueryFilter
{
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? BrandId { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsDeleted { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "newest";
}
#endregion
