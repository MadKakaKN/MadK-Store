namespace MadK.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Variant attributes stored in JSONB (e.g. {"color": "Space Gray", "storage": "512GB", "color_hex": "#505155"}).
    /// </summary>
    public string Attributes { get; set; } = "{}";

    public decimal OriginalPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal CostPrice { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
