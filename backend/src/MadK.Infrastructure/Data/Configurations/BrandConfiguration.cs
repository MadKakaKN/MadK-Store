using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("brands");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id");

        builder.Property(b => b.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(b => b.Slug).HasColumnName("slug").HasMaxLength(120).IsRequired();
        builder.Property(b => b.LogoUrl).HasColumnName("logo_url").HasMaxLength(500);
        builder.Property(b => b.Description).HasColumnName("description").HasColumnType("text");
        builder.Property(b => b.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(b => b.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(b => b.UpdatedAt).HasColumnName("updated_at");

        // Indexes
        builder.HasIndex(b => b.Slug)
            .IsUnique()
            .HasDatabaseName("idx_brands_slug");
    }
}
