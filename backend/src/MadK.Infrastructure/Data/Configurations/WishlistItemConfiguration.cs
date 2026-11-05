using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.ToTable("wishlist_items");

        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasColumnName("id");

        builder.Property(w => w.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(w => w.ProductId).HasColumnName("product_id").IsRequired();
        builder.Property(w => w.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        // Ignore BaseEntity columns not present in the table
        builder.Ignore(w => w.UpdatedAt);
        builder.Ignore(w => w.IsDeleted);
        builder.Ignore(w => w.DeletedAt);

        // Relationships
        builder.HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.Product)
            .WithMany()
            .HasForeignKey(w => w.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint: A user can only favorite a product once
        builder.HasIndex(w => new { w.UserId, w.ProductId }).IsUnique();
        builder.HasIndex(w => w.UserId);
        builder.HasIndex(w => w.ProductId);
    }
}
