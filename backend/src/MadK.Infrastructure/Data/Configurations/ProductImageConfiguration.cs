using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("product_images");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.ProductId).HasColumnName("product_id").IsRequired();
        builder.Property(i => i.VariantId).HasColumnName("variant_id");

        builder.Property(i => i.ImageUrl).HasColumnName("image_url").HasMaxLength(500).IsRequired();
        builder.Property(i => i.AltText).HasColumnName("alt_text").HasMaxLength(200);
        builder.Property(i => i.DisplayOrder).HasColumnName("display_order").HasDefaultValue(0);
        builder.Property(i => i.IsPrimary).HasColumnName("is_primary").HasDefaultValue(false);
        builder.Property(i => i.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at");

        // Relationships
        builder.HasOne(i => i.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Variant)
            .WithMany(v => v.Images)
            .HasForeignKey(i => i.VariantId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(i => i.ProductId)
            .HasDatabaseName("idx_product_images_product_id");

        builder.HasIndex(i => i.VariantId)
            .HasDatabaseName("idx_product_images_variant_id");
    }
}
