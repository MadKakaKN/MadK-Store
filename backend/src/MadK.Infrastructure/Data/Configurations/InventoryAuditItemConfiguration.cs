using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class InventoryAuditItemConfiguration : IEntityTypeConfiguration<InventoryAuditItem>
{
    public void Configure(EntityTypeBuilder<InventoryAuditItem> builder)
    {
        builder.ToTable("inventory_audit_items");

        builder.HasKey(iai => iai.Id);
        builder.Property(iai => iai.Id).HasColumnName("id");

        builder.Property(iai => iai.InventoryAuditId).HasColumnName("inventory_audit_id").IsRequired();
        builder.Property(iai => iai.VariantId).HasColumnName("variant_id").IsRequired();

        builder.Property(iai => iai.SystemQuantity).HasColumnName("system_quantity").IsRequired();
        builder.Property(iai => iai.ActualQuantity).HasColumnName("actual_quantity").IsRequired();

        builder.Ignore(iai => iai.Discrepancy);

        builder.Property(iai => iai.Reason)
            .HasColumnName("reason")
            .HasMaxLength(500);

        builder.Property(iai => iai.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.Property(iai => iai.UpdatedAt)
            .HasColumnName("updated_at");

        // Relationships
        builder.HasOne(iai => iai.InventoryAudit)
            .WithMany(ia => ia.Items)
            .HasForeignKey(iai => iai.InventoryAuditId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(iai => iai.Variant)
            .WithMany(v => v.InventoryAuditItems)
            .HasForeignKey(iai => iai.VariantId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(iai => iai.InventoryAuditId)
            .HasDatabaseName("idx_inventory_audit_items_audit_id");

        builder.HasIndex(iai => iai.VariantId)
            .HasDatabaseName("idx_inventory_audit_items_variant_id");
    }
}
