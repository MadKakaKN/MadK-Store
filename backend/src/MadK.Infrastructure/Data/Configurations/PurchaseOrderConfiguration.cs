using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> builder)
    {
        builder.ToTable("purchase_orders");

        builder.HasKey(po => po.Id);
        builder.Property(po => po.Id).HasColumnName("id");

        builder.Property(po => po.Code)
            .HasColumnName("code")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(po => po.SupplierId)
            .HasColumnName("supplier_id")
            .IsRequired();

        builder.Property(po => po.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(po => po.TotalAmount)
            .HasColumnName("total_amount")
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(po => po.Notes)
            .HasColumnName("notes")
            .HasMaxLength(1000);

        builder.Property(po => po.CreatedBy)
            .HasColumnName("created_by")
            .HasMaxLength(100);

        builder.Property(po => po.ReceivedAt)
            .HasColumnName("received_at");

        builder.Property(po => po.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.Property(po => po.UpdatedAt)
            .HasColumnName("updated_at");

        // Relationships
        builder.HasOne(po => po.Supplier)
            .WithMany(s => s.PurchaseOrders)
            .HasForeignKey(po => po.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(po => po.Code)
            .IsUnique()
            .HasDatabaseName("idx_purchase_orders_code");

        builder.HasIndex(po => po.SupplierId)
            .HasDatabaseName("idx_purchase_orders_supplier_id");

        builder.HasIndex(po => po.Status)
            .HasDatabaseName("idx_purchase_orders_status");
    }
}
