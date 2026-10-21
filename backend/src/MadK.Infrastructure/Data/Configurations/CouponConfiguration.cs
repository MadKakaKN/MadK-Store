using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.ToTable("coupons");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");

        builder.Property(c => c.Code)
            .HasColumnName("code")
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(c => c.Code).IsUnique();

        builder.Property(c => c.Description)
            .HasColumnName("description")
            .HasMaxLength(255);

        builder.Property(c => c.DiscountType)
            .HasColumnName("discount_type")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(c => c.DiscountValue)
            .HasColumnName("discount_value")
            .HasPrecision(15, 2)
            .IsRequired();

        builder.Property(c => c.MaxDiscountAmount)
            .HasColumnName("max_discount_amount")
            .HasPrecision(15, 2);

        builder.Property(c => c.MinOrderAmount)
            .HasColumnName("min_order_amount")
            .HasPrecision(15, 2)
            .HasDefaultValue(0);

        builder.Property(c => c.StartDate).HasColumnName("start_date");
        builder.Property(c => c.EndDate).HasColumnName("end_date");
        builder.Property(c => c.UsageLimit).HasColumnName("usage_limit");

        builder.Property(c => c.UsedCount)
            .HasColumnName("used_count")
            .IsConcurrencyToken()
            .HasDefaultValue(0);

        builder.Property(c => c.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(c => c.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(c => c.IsActive);
    }
}
