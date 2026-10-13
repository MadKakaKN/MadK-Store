using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("stock_movements");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");

        builder.Property(m => m.InventoryId).HasColumnName("inventory_id").IsRequired();
        builder.Property(m => m.VariantId).HasColumnName("variant_id").IsRequired();

        builder.Property(m => m.Type)
            .HasColumnName("type")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(m => m.Quantity).HasColumnName("quantity").IsRequired();

        builder.Property(m => m.OnHandBefore).HasColumnName("on_hand_before").IsRequired();
        builder.Property(m => m.OnHandAfter).HasColumnName("on_hand_after").IsRequired();

        builder.Property(m => m.ReservedBefore).HasColumnName("reserved_before").IsRequired();
        builder.Property(m => m.ReservedAfter).HasColumnName("reserved_after").IsRequired();

        builder.Property(m => m.ReferenceType).HasColumnName("reference_type").HasMaxLength(50);
        builder.Property(m => m.ReferenceId).HasColumnName("reference_id").HasMaxLength(100);
        builder.Property(m => m.Reason).HasColumnName("reason").HasMaxLength(500);

        builder.Property(m => m.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(m => m.UpdatedAt).HasColumnName("updated_at");

        // Relationships
        builder.HasOne(m => m.Inventory)
            .WithMany(i => i.Movements)
            .HasForeignKey(m => m.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(m => m.VariantId)
            .HasDatabaseName("idx_stock_movements_variant_id");

        builder.HasIndex(m => new { m.ReferenceType, m.ReferenceId })
            .HasDatabaseName("idx_stock_movements_reference");
    }
}
