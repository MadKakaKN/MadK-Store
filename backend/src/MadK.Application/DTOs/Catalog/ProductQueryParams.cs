namespace MadK.Application.DTOs.Catalog;

public class ProductQueryParams
{
    public string? CategorySlug { get; set; }
    public Guid? CategoryId { get; set; }
    public string? BrandSlug { get; set; }
    public Guid? BrandId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Search { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "newest"
    public bool? IsFeatured { get; set; }

    /// <summary>
    /// JSONB specification filter, e.g. specs[ram]=16GB or passed via JSON
    /// </summary>
    public Dictionary<string, string>? Specs { get; set; }

    private int _page = 1;
    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    private int _pageSize = 20;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value < 1 ? 20 : (value > 100 ? 100 : value);
    }
}
