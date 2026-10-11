using NpgsqlTypes;

namespace MadK.Domain.Entities;

public class Product : BaseEntity
{
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }

    /// <summary>
    /// Dynamic technical specifications stored in JSONB.
    /// </summary>
    public string Specifications { get; set; } = "{}";

    /// <summary>
    /// Optional URL to a 3D model (.glb/.gltf file).
    /// Nullable: only featured products have 3D models.
    /// </summary>
    public string? Model3DUrl { get; set; }

    public string? ThumbnailUrl { get; set; }
    public decimal BasePrice { get; set; }
    public bool IsFeatured { get; set; } = false;
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Stored Full-Text Search tsvector (auto-computed in PostgreSQL).
    /// </summary>
    public NpgsqlTsVector? SearchVector { get; set; }

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
