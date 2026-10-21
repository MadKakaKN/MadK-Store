using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class InventoryAuditConfiguration : IEntityTypeConfiguration<InventoryAudit>
{
    public void Configure(EntityTypeBuilder<InventoryAudit> builder)
    {
        builder.ToTable("inventory_audits");

        builder.HasKey(ia => ia.Id);
        builder.Property(ia => ia.Id).HasColumnName("id");

        builder.Property(ia => ia.Code)
            .HasColumnName("code")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(ia => ia.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(ia => ia.Notes)
            .HasColumnName("notes")
            .HasMaxLength(1000);

        builder.Property(ia => ia.CreatedBy)
            .HasColumnName("created_by")
            .HasMaxLength(100);

        builder.Property(ia => ia.CompletedAt)
            .HasColumnName("completed_at");

        builder.Property(ia => ia.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.Property(ia => ia.UpdatedAt)
            .HasColumnName("updated_at");

        // Indexes
        builder.HasIndex(ia => ia.Code)
            .IsUnique()
            .HasDatabaseName("idx_inventory_audits_code");

        builder.HasIndex(ia => ia.Status)
            .HasDatabaseName("idx_inventory_audits_status");
    }
}
