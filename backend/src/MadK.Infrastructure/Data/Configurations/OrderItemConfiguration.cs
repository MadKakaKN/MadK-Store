using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.OrderId).HasColumnName("order_id").IsRequired();
        builder.Property(i => i.VariantId).HasColumnName("variant_id");
        builder.Property(i => i.ProductId).HasColumnName("product_id");

        builder.Property(i => i.ProductNameSnapshot).HasColumnName("product_name_snapshot").HasMaxLength(250).IsRequired();
        builder.Property(i => i.VariantNameSnapshot).HasColumnName("variant_name_snapshot").HasMaxLength(200).IsRequired();
        builder.Property(i => i.SkuSnapshot).HasColumnName("sku_snapshot").HasMaxLength(100).IsRequired();

        builder.Property(i => i.UnitPriceSnapshot).HasColumnName("unit_price_snapshot").HasPrecision(15, 2).IsRequired();
        builder.Property(i => i.OriginalPriceSnapshot).HasColumnName("original_price_snapshot").HasPrecision(15, 2).IsRequired();
        builder.Property(i => i.Quantity).HasColumnName("quantity").IsRequired();
        builder.Property(i => i.TotalPrice).HasColumnName("total_price").HasPrecision(15, 2).IsRequired();

        builder.Property(i => i.AttributesSnapshot).HasColumnName("attributes_snapshot").HasColumnType("jsonb").IsRequired();
        builder.Property(i => i.SpecificationsSnapshot).HasColumnName("specifications_snapshot").HasColumnType("jsonb");
        builder.Property(i => i.ThumbnailUrlSnapshot).HasColumnName("thumbnail_url_snapshot").HasMaxLength(500);

        builder.Property(i => i.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at");

        // Relationships
        builder.HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Variant)
            .WithMany()
            .HasForeignKey(i => i.VariantId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(i => i.OrderId)
            .HasDatabaseName("idx_order_items_order_id");

        builder.HasIndex(i => i.VariantId)
            .HasDatabaseName("idx_order_items_variant_id");
    }
}
