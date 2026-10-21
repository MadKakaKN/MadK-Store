using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class ReturnRequestConfiguration : IEntityTypeConfiguration<ReturnRequest>
{
    public void Configure(EntityTypeBuilder<ReturnRequest> builder)
    {
        builder.ToTable("return_requests");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");

        builder.Property(r => r.OrderId).HasColumnName("order_id").IsRequired();
        builder.Property(r => r.OrderNumber).HasColumnName("order_number").HasMaxLength(50).IsRequired();
        builder.Property(r => r.UserId).HasColumnName("user_id");

        builder.Property(r => r.CustomerName).HasColumnName("customer_name").HasMaxLength(150);
        builder.Property(r => r.CustomerEmail).HasColumnName("customer_email").HasMaxLength(150);
        builder.Property(r => r.CustomerPhone).HasColumnName("customer_phone").HasMaxLength(30);

        builder.Property(r => r.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(r => r.Reason).HasColumnName("reason").HasMaxLength(255).IsRequired();
        builder.Property(r => r.CustomerNote).HasColumnName("customer_note");

        builder.Property(r => r.RefundAmount).HasColumnName("refund_amount").HasPrecision(15, 2).IsRequired();

        builder.Property(r => r.RefundStatus)
            .HasColumnName("refund_status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(r => r.RefundTransactionNo).HasColumnName("refund_transaction_no").HasMaxLength(100);
        builder.Property(r => r.RefundedAt).HasColumnName("refunded_at");

        builder.Property(r => r.SalesNote).HasColumnName("sales_note");
        builder.Property(r => r.RejectionReason).HasColumnName("rejection_reason");

        builder.Property(r => r.ProcessedByUserId).HasColumnName("processed_by_user_id");
        builder.Property(r => r.ProcessedByName).HasColumnName("processed_by_name").HasMaxLength(150);
        builder.Property(r => r.ProcessedAt).HasColumnName("processed_at");

        builder.Property(r => r.IsRestocked).HasColumnName("is_restocked").HasDefaultValue(false);
        builder.Property(r => r.RestockedAt).HasColumnName("restocked_at");

        builder.Property(r => r.IdempotencyKey).HasColumnName("idempotency_key").HasMaxLength(150);

        builder.Property(r => r.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at");

        // Relationships
        builder.HasOne(r => r.Order)
            .WithMany(o => o.ReturnRequests)
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(r => r.Items)
            .WithOne(i => i.ReturnRequest)
            .HasForeignKey(i => i.ReturnRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(r => r.OrderId).HasDatabaseName("idx_return_requests_order_id");
        builder.HasIndex(r => r.OrderNumber).HasDatabaseName("idx_return_requests_order_number");
        builder.HasIndex(r => r.UserId).HasDatabaseName("idx_return_requests_user_id");
        builder.HasIndex(r => r.Status).HasDatabaseName("idx_return_requests_status");
        builder.HasIndex(r => r.RefundStatus).HasDatabaseName("idx_return_requests_refund_status");
        builder.HasIndex(r => r.IdempotencyKey).HasDatabaseName("idx_return_requests_idempotency_key");
        builder.HasIndex(r => r.CreatedAt).HasDatabaseName("idx_return_requests_created_at");
    }
}
