namespace MadK.Application.DTOs.Catalog;

public record ProductSuggestionDto(
    Guid Id,
    string Name,
    string Slug,
    string? ThumbnailUrl,
    decimal BasePrice,
    string? BrandName,
    string? CategoryName
);

public record CategorySuggestionDto(
    Guid Id,
    string Name,
    string Slug
);

public record BrandSuggestionDto(
    Guid Id,
    string Name,
    string Slug,
    string? LogoUrl
);

public record SearchSuggestionsDto(
    IReadOnlyList<ProductSuggestionDto> Products,
    IReadOnlyList<CategorySuggestionDto> Categories,
    IReadOnlyList<BrandSuggestionDto> Brands,
    string Query
);
