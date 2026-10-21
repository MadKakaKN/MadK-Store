using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");

        builder.Property(p => p.CategoryId).HasColumnName("category_id").IsRequired();
        builder.Property(p => p.BrandId).HasColumnName("brand_id").IsRequired();

        builder.Property(p => p.Name).HasColumnName("name").HasMaxLength(250).IsRequired();
        builder.Property(p => p.Slug).HasColumnName("slug").HasMaxLength(280).IsRequired();
        builder.Property(p => p.ShortDescription).HasColumnName("short_description").HasMaxLength(500);
        builder.Property(p => p.Description).HasColumnName("description").HasColumnType("text");

        // Dynamic specifications in JSONB
        builder.Property(p => p.Specifications)
            .HasColumnName("specifications")
            .HasColumnType("jsonb")
            .HasDefaultValue("{}")
            .IsRequired();

        // 3D model URL (nullable)
        builder.Property(p => p.Model3DUrl)
            .HasColumnName("model_3d_url")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(p => p.ThumbnailUrl).HasColumnName("thumbnail_url").HasMaxLength(500);
        builder.Property(p => p.BasePrice).HasColumnName("base_price").HasColumnType("numeric(15,2)").IsRequired();
        builder.Property(p => p.IsFeatured).HasColumnName("is_featured").HasDefaultValue(false);
        builder.Property(p => p.IsActive).HasColumnName("is_active").HasDefaultValue(true);

        // Stored generated tsvector for full-text search
        builder.Property(p => p.SearchVector)
            .HasColumnName("search_vector")
            .HasColumnType("tsvector")
            .HasComputedColumnSql("to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))", stored: true);

        builder.Property(p => p.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");
        builder.Property(p => p.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(p => p.DeletedAt).HasColumnName("deleted_at");

        builder.HasQueryFilter(p => !p.IsDeleted);

        // Relationships
        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Brand)
            .WithMany(b => b.Products)
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Variants)
            .WithOne(v => v.Product)
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Images)
            .WithOne(i => i.Product)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(p => p.Slug)
            .IsUnique()
            .HasDatabaseName("idx_products_slug");

        builder.HasIndex(p => p.CategoryId)
            .HasDatabaseName("idx_products_category_id");

        builder.HasIndex(p => p.BrandId)
            .HasDatabaseName("idx_products_brand_id");

        builder.HasIndex(p => p.BasePrice)
            .HasDatabaseName("idx_products_base_price");

        builder.HasIndex(p => p.Specifications)
            .HasMethod("gin")
            .HasDatabaseName("idx_products_specifications_gin");

        builder.HasIndex(p => p.SearchVector)
            .HasMethod("gin")
            .HasDatabaseName("idx_products_search_vector_gin");
    }
}
