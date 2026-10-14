using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        builder.ToTable("order_status_histories");

        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasColumnName("id");

        builder.Property(h => h.OrderId)
            .HasColumnName("order_id")
            .IsRequired();

        builder.Property(h => h.FromStatus)
            .HasColumnName("from_status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired(false);

        builder.Property(h => h.ToStatus)
            .HasColumnName("to_status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(h => h.ChangedByUserId)
            .HasColumnName("changed_by_user_id")
            .IsRequired(false);

        builder.Property(h => h.ChangedByName)
            .HasColumnName("changed_by_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(h => h.Reason)
            .HasColumnName("reason")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(h => h.Note)
            .HasColumnName("note")
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(h => h.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()")
            .IsRequired();

        builder.Property(h => h.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired(false);

        builder.HasOne(h => h.Order)
            .WithMany(o => o.StatusHistories)
            .HasForeignKey(h => h.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(h => h.OrderId)
            .HasDatabaseName("idx_order_status_histories_order_id");

        builder.HasIndex(h => h.CreatedAt)
            .HasDatabaseName("idx_order_status_histories_created_at");
    }
}
