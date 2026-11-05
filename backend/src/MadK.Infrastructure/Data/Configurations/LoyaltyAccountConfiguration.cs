using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class LoyaltyAccountConfiguration : IEntityTypeConfiguration<LoyaltyAccount>
{
    public void Configure(EntityTypeBuilder<LoyaltyAccount> builder)
    {
        builder.ToTable("loyalty_accounts");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");

        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();

        builder.Property(x => x.CurrentBalance)
            .HasColumnName("current_balance")
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.LifetimePoints)
            .HasColumnName("lifetime_points")
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.Tier)
            .HasColumnName("tier")
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(Domain.Enums.LoyaltyTier.Bronze)
            .IsRequired();

        builder.Property(x => x.TotalSpent)
            .HasColumnName("total_spent")
            .HasPrecision(18, 2)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");

        // Relationships
        builder.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<LoyaltyAccount>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Transactions)
            .WithOne(t => t.LoyaltyAccount)
            .HasForeignKey(t => t.LoyaltyAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(x => x.UserId)
            .IsUnique()
            .HasDatabaseName("idx_loyalty_accounts_user_id");
    }
}
