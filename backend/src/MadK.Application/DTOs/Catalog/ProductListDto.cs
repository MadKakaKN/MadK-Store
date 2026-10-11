namespace MadK.Application.DTOs.Catalog;

public class ProductListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? ThumbnailUrl { get; set; }
    public decimal BasePrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public string? Model3DUrl { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public Guid BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string BrandSlug { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; }
}
