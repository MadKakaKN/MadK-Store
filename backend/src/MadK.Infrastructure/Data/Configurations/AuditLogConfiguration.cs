using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");

        builder.Property(a => a.UserId).HasColumnName("user_id");
        builder.Property(a => a.UserEmail).HasColumnName("user_email").HasMaxLength(255);
        builder.Property(a => a.UserRole).HasColumnName("user_role").HasMaxLength(50);
        builder.Property(a => a.Action).HasColumnName("action").HasMaxLength(100).IsRequired();
        builder.Property(a => a.EntityName).HasColumnName("entity_name").HasMaxLength(100).IsRequired();
        builder.Property(a => a.EntityId).HasColumnName("entity_id").HasMaxLength(100);
        builder.Property(a => a.OldValues).HasColumnName("old_values").HasColumnType("text");
        builder.Property(a => a.NewValues).HasColumnName("new_values").HasColumnType("text");
        builder.Property(a => a.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
        builder.Property(a => a.UserAgent).HasColumnName("user_agent").HasMaxLength(500);
        builder.Property(a => a.Note).HasColumnName("note").HasMaxLength(1000);

        builder.Property(a => a.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        // Indexes for fast searching and filtering
        builder.HasIndex(a => a.UserId).HasDatabaseName("ix_audit_logs_user_id");
        builder.HasIndex(a => a.EntityName).HasDatabaseName("ix_audit_logs_entity_name");
        builder.HasIndex(a => a.Action).HasDatabaseName("ix_audit_logs_action");
        builder.HasIndex(a => a.CreatedAt).HasDatabaseName("ix_audit_logs_created_at");
    }
}
