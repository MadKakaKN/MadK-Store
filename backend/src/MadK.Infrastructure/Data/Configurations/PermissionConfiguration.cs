using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("permissions");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");

        builder.Property(p => p.Code).HasColumnName("code").HasMaxLength(100).IsRequired();
        builder.Property(p => p.Module).HasColumnName("module").HasMaxLength(50).IsRequired();
        builder.Property(p => p.Description).HasColumnName("description").HasMaxLength(250);
        builder.Property(p => p.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");

        // Indexes
        builder.HasIndex(p => p.Code)
            .IsUnique()
            .HasDatabaseName("idx_permissions_code");
    }
}
