using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.ToTable("inventories", t =>
        {
            t.HasCheckConstraint("chk_inventory_on_hand", "on_hand_quantity >= 0");
            t.HasCheckConstraint("chk_inventory_reserved", "reserved_quantity >= 0");
            t.HasCheckConstraint("chk_inventory_available", "on_hand_quantity - reserved_quantity >= 0");
        });

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.VariantId).HasColumnName("variant_id").IsRequired();
        builder.Property(i => i.OnHandQuantity).HasColumnName("on_hand_quantity").HasDefaultValue(0).IsRequired();
        builder.Property(i => i.ReservedQuantity).HasColumnName("reserved_quantity").HasDefaultValue(0).IsRequired();

        builder.Ignore(i => i.AvailableQuantity);

        builder.Property(i => i.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at");

        // Relationships
        builder.HasOne(i => i.Variant)
            .WithOne(v => v.Inventory)
            .HasForeignKey<Inventory>(i => i.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(i => i.Movements)
            .WithOne(m => m.Inventory)
            .HasForeignKey(m => m.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(i => i.VariantId)
            .IsUnique()
            .HasDatabaseName("idx_inventories_variant_id");
    }
}
