using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("product_variants");

        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).HasColumnName("id");

        builder.Property(v => v.ProductId).HasColumnName("product_id").IsRequired();
        builder.Property(v => v.Sku).HasColumnName("sku").HasMaxLength(100).IsRequired();
        builder.Property(v => v.Name).HasColumnName("name").HasMaxLength(200).IsRequired();

        // Variant attributes in JSONB (color, storage, color_hex, etc.)
        builder.Property(v => v.Attributes)
            .HasColumnName("attributes")
            .HasColumnType("jsonb")
            .HasDefaultValue("{}")
            .IsRequired();

        builder.Property(v => v.OriginalPrice).HasColumnName("original_price").HasColumnType("numeric(15,2)").IsRequired();
        builder.Property(v => v.SalePrice).HasColumnName("sale_price").HasColumnType("numeric(15,2)").IsRequired();
        builder.Property(v => v.CostPrice).HasColumnName("cost_price").HasColumnType("numeric(15,2)").HasDefaultValue(0m);
        builder.Property(v => v.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(v => v.StockQuantity).HasColumnName("stock_quantity").HasDefaultValue(50);
        builder.Property(v => v.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(v => v.UpdatedAt).HasColumnName("updated_at");
        builder.Property(v => v.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(v => v.DeletedAt).HasColumnName("deleted_at");

        builder.HasQueryFilter(v => !v.IsDeleted);

        // Relationships
        builder.HasOne(v => v.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(v => v.Images)
            .WithOne(i => i.Variant)
            .HasForeignKey(i => i.VariantId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(v => v.Sku)
            .IsUnique()
            .HasDatabaseName("idx_product_variants_sku");

        builder.HasIndex(v => v.ProductId)
            .HasDatabaseName("idx_product_variants_product_id");

        builder.HasIndex(v => v.SalePrice)
            .HasDatabaseName("idx_product_variants_sale_price");

        builder.HasIndex(v => v.Attributes)
            .HasMethod("gin")
            .HasDatabaseName("idx_product_variants_attributes_gin");
    }
}
