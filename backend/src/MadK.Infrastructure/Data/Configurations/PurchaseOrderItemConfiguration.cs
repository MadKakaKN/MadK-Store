using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class PurchaseOrderItemConfiguration : IEntityTypeConfiguration<PurchaseOrderItem>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderItem> builder)
    {
        builder.ToTable("purchase_order_items");

        builder.HasKey(poi => poi.Id);
        builder.Property(poi => poi.Id).HasColumnName("id");

        builder.Property(poi => poi.PurchaseOrderId).HasColumnName("purchase_order_id").IsRequired();
        builder.Property(poi => poi.VariantId).HasColumnName("variant_id").IsRequired();

        builder.Property(poi => poi.Quantity).HasColumnName("quantity").IsRequired();

        builder.Property(poi => poi.UnitCost)
            .HasColumnName("unit_cost")
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(poi => poi.TotalCost)
            .HasColumnName("total_cost")
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(poi => poi.Notes)
            .HasColumnName("notes")
            .HasMaxLength(500);

        builder.Property(poi => poi.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.Property(poi => poi.UpdatedAt)
            .HasColumnName("updated_at");

        // Relationships
        builder.HasOne(poi => poi.PurchaseOrder)
            .WithMany(po => po.Items)
            .HasForeignKey(poi => poi.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(poi => poi.Variant)
            .WithMany(v => v.PurchaseOrderItems)
            .HasForeignKey(poi => poi.VariantId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(poi => poi.PurchaseOrderId)
            .HasDatabaseName("idx_purchase_order_items_po_id");

        builder.HasIndex(poi => poi.VariantId)
            .HasDatabaseName("idx_purchase_order_items_variant_id");
    }
}
