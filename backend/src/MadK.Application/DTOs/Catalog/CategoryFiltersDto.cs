namespace MadK.Application.DTOs.Catalog;

public class CategoryFiltersDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public List<BrandFilterDto> Brands { get; set; } = new();
    public PriceRangeDto PriceRange { get; set; } = new();
    public List<SpecFilterDto> SpecFilters { get; set; } = new();
}

public class BrandFilterDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public int ProductCount { get; set; }
}

public class PriceRangeDto
{
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
}

public class SpecFilterDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
}
