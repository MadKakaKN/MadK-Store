using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.ToTable("cart_items");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.CartId).HasColumnName("cart_id").IsRequired();
        builder.Property(i => i.VariantId).HasColumnName("variant_id").IsRequired();
        builder.Property(i => i.Quantity).HasColumnName("quantity").IsRequired();

        builder.Property(i => i.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at");

        // Relationships
        builder.HasOne(i => i.Cart)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Variant)
            .WithMany()
            .HasForeignKey(i => i.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        // Constraints & Indexes
        builder.HasIndex(i => new { i.CartId, i.VariantId })
            .IsUnique()
            .HasDatabaseName("idx_cart_items_cart_variant_unique");

        builder.HasIndex(i => i.VariantId)
            .HasDatabaseName("idx_cart_items_variant_id");
    }
}
