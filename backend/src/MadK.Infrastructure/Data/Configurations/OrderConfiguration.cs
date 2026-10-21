using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasColumnName("id");

        builder.Property(o => o.OrderNumber).HasColumnName("order_number").HasMaxLength(50).IsRequired();
        builder.Property(o => o.UserId).HasColumnName("user_id");

        builder.Property(o => o.CustomerEmail).HasColumnName("customer_email").HasMaxLength(150);
        builder.Property(o => o.CustomerPhone).HasColumnName("customer_phone").HasMaxLength(30);

        builder.Property(o => o.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(o => o.PaymentStatus)
            .HasColumnName("payment_status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(o => o.PaymentMethod)
            .HasColumnName("payment_method")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(o => o.SubtotalAmount).HasColumnName("subtotal_amount").HasPrecision(15, 2).IsRequired();
        builder.Property(o => o.DiscountAmount).HasColumnName("discount_amount").HasPrecision(15, 2).HasDefaultValue(0);
        builder.Property(o => o.ShippingFee).HasColumnName("shipping_fee").HasPrecision(15, 2).HasDefaultValue(0);
        builder.Property(o => o.TotalAmount).HasColumnName("total_amount").HasPrecision(15, 2).IsRequired();

        builder.Property(o => o.ShippingAddressSnapshot).HasColumnName("shipping_address_snapshot").HasColumnType("jsonb").IsRequired();
        builder.Property(o => o.CouponSnapshot).HasColumnName("coupon_snapshot").HasColumnType("jsonb");

        builder.Property(o => o.CustomerNote).HasColumnName("customer_note");
        builder.Property(o => o.AdminNote).HasColumnName("admin_note");
        builder.Property(o => o.CancelReason).HasColumnName("cancel_reason").HasMaxLength(255);
        builder.Property(o => o.CancelledAt).HasColumnName("cancelled_at");
        builder.Property(o => o.ExpiresAt).HasColumnName("expires_at");

        builder.Property(o => o.IdempotencyKey).HasColumnName("idempotency_key").HasMaxLength(150);

        builder.Property(o => o.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(o => o.UpdatedAt).HasColumnName("updated_at");

        // Relationships
        builder.HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.StatusHistories)
            .WithOne(h => h.Order)
            .HasForeignKey(h => h.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(o => o.OrderNumber)
            .IsUnique()
            .HasDatabaseName("idx_orders_order_number");

        builder.HasIndex(o => o.UserId)
            .HasDatabaseName("idx_orders_user_id");

        builder.HasIndex(o => o.IdempotencyKey)
            .HasDatabaseName("idx_orders_idempotency_key");

        builder.HasIndex(o => new { o.Status, o.PaymentStatus })
            .HasDatabaseName("idx_orders_status_payment");

        builder.HasIndex(o => new { o.Status, o.ExpiresAt })
            .HasDatabaseName("idx_orders_status_expires");

        builder.HasIndex(o => o.CreatedAt)
            .HasDatabaseName("idx_orders_created_at");
    }
}
