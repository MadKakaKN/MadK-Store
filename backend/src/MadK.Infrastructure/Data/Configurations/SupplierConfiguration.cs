using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("suppliers");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");

        builder.Property(s => s.Code)
            .HasColumnName("code")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.ContactPerson)
            .HasColumnName("contact_person")
            .HasMaxLength(100);

        builder.Property(s => s.Phone)
            .HasColumnName("phone")
            .HasMaxLength(30);

        builder.Property(s => s.Email)
            .HasColumnName("email")
            .HasMaxLength(100);

        builder.Property(s => s.Address)
            .HasColumnName("address")
            .HasMaxLength(500);

        builder.Property(s => s.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(s => s.Notes)
            .HasColumnName("notes")
            .HasMaxLength(1000);

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at");

        // Indexes
        builder.HasIndex(s => s.Code)
            .IsUnique()
            .HasDatabaseName("idx_suppliers_code");

        builder.HasIndex(s => s.IsActive)
            .HasDatabaseName("idx_suppliers_is_active");
    }
}
