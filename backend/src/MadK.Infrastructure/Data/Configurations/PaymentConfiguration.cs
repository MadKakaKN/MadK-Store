using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");

        builder.Property(p => p.OrderId).HasColumnName("order_id").IsRequired();
        builder.Property(p => p.OrderNumber).HasColumnName("order_number").HasMaxLength(50).IsRequired();
        builder.Property(p => p.TxnRef).HasColumnName("txn_ref").HasMaxLength(100).IsRequired();
        builder.Property(p => p.TransactionNo).HasColumnName("transaction_no").HasMaxLength(100);

        builder.Property(p => p.Amount).HasColumnName("amount").HasPrecision(15, 2).IsRequired();
        builder.Property(p => p.Currency).HasColumnName("currency").HasMaxLength(10).HasDefaultValue("VND").IsRequired();

        builder.Property(p => p.PaymentMethod)
            .HasColumnName("payment_method")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(p => p.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(p => p.BankCode).HasColumnName("bank_code").HasMaxLength(50);
        builder.Property(p => p.BankTranNo).HasColumnName("bank_tran_no").HasMaxLength(100);
        builder.Property(p => p.CardType).HasColumnName("card_type").HasMaxLength(50);
        builder.Property(p => p.OrderInfo).HasColumnName("order_info").HasMaxLength(255);
        builder.Property(p => p.ResponseCode).HasColumnName("response_code").HasMaxLength(10);
        builder.Property(p => p.TransactionStatus).HasColumnName("transaction_status").HasMaxLength(10);
        builder.Property(p => p.SecureHash).HasColumnName("secure_hash").HasMaxLength(256);
        builder.Property(p => p.RawPayload).HasColumnName("raw_payload").HasColumnType("text").IsRequired();
        builder.Property(p => p.IpAddress).HasColumnName("ip_address").HasMaxLength(50);
        builder.Property(p => p.PaymentTime).HasColumnName("payment_time");

        builder.Property(p => p.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");
        builder.Property(p => p.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(p => p.DeletedAt).HasColumnName("deleted_at");

        // Relationships
        builder.HasOne(p => p.Order)
            .WithMany(o => o.Payments)
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(p => p.OrderId)
            .HasDatabaseName("idx_payments_order_id");

        builder.HasIndex(p => p.OrderNumber)
            .HasDatabaseName("idx_payments_order_number");

        builder.HasIndex(p => p.TxnRef)
            .IsUnique()
            .HasDatabaseName("idx_payments_txn_ref");

        builder.HasIndex(p => p.TransactionNo)
            .HasDatabaseName("idx_payments_transaction_no");

        builder.HasIndex(p => p.Status)
            .HasDatabaseName("idx_payments_status");

        builder.HasIndex(p => p.CreatedAt)
            .HasDatabaseName("idx_payments_created_at");
    }
}
