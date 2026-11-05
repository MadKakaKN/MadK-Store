using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class LoyaltyTransactionConfiguration : IEntityTypeConfiguration<LoyaltyTransaction>
{
    public void Configure(EntityTypeBuilder<LoyaltyTransaction> builder)
    {
        builder.ToTable("loyalty_transactions");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");

        builder.Property(x => x.LoyaltyAccountId).HasColumnName("loyalty_account_id").IsRequired();
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.OrderId).HasColumnName("order_id");
        builder.Property(x => x.OrderNumber).HasColumnName("order_number").HasMaxLength(100);

        builder.Property(x => x.Points).HasColumnName("points").IsRequired();
        builder.Property(x => x.BalanceAfter).HasColumnName("balance_after").IsRequired();

        builder.Property(x => x.Type)
            .HasColumnName("type")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Description).HasColumnName("description").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(x => x.LoyaltyAccount)
            .WithMany(a => a.Transactions)
            .HasForeignKey(x => x.LoyaltyAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(x => x.UserId).HasDatabaseName("idx_loyalty_transactions_user_id");
        builder.HasIndex(x => x.LoyaltyAccountId).HasDatabaseName("idx_loyalty_transactions_account_id");
        builder.HasIndex(x => x.CreatedAt).HasDatabaseName("idx_loyalty_transactions_created_at");
    }
}
