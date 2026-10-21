using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");

        builder.Property(c => c.ParentId).HasColumnName("parent_id");
        builder.Property(c => c.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
        builder.Property(c => c.Slug).HasColumnName("slug").HasMaxLength(180).IsRequired();
        builder.Property(c => c.Description).HasColumnName("description").HasColumnType("text");
        builder.Property(c => c.IconUrl).HasColumnName("icon_url").HasMaxLength(500);
        builder.Property(c => c.DisplayOrder).HasColumnName("display_order").HasDefaultValue(0);
        builder.Property(c => c.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(c => c.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");
        builder.Property(c => c.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(c => c.DeletedAt).HasColumnName("deleted_at");

        builder.HasQueryFilter(c => !c.IsDeleted);

        // Self-referencing tree relationship
        builder.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(c => c.Slug)
            .IsUnique()
            .HasDatabaseName("idx_categories_slug");

        builder.HasIndex(c => c.ParentId)
            .HasDatabaseName("idx_categories_parent_id");

        builder.HasIndex(c => new { c.IsActive, c.DisplayOrder })
            .HasDatabaseName("idx_categories_is_active_order");
    }
}
