using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> builder)
    {
        builder.ToTable("addresses");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");

        builder.Property(a => a.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(a => a.RecipientName).HasColumnName("recipient_name").HasMaxLength(150).IsRequired();
        builder.Property(a => a.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20).IsRequired();

        builder.Property(a => a.ProvinceCode).HasColumnName("province_code").HasMaxLength(20).IsRequired();
        builder.Property(a => a.ProvinceName).HasColumnName("province_name").HasMaxLength(100).IsRequired();

        builder.Property(a => a.DistrictCode).HasColumnName("district_code").HasMaxLength(20).IsRequired();
        builder.Property(a => a.DistrictName).HasColumnName("district_name").HasMaxLength(100).IsRequired();

        builder.Property(a => a.WardCode).HasColumnName("ward_code").HasMaxLength(20).IsRequired();
        builder.Property(a => a.WardName).HasColumnName("ward_name").HasMaxLength(100).IsRequired();

        builder.Property(a => a.DetailedAddress).HasColumnName("detailed_address").HasMaxLength(255).IsRequired();
        builder.Property(a => a.IsDefault).HasColumnName("is_default").HasDefaultValue(false);

        builder.Property(a => a.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        builder.Ignore(a => a.FullAddress);

        builder.HasOne(a => a.User)
            .WithMany(u => u.Addresses)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.UserId)
            .HasDatabaseName("idx_addresses_user_id");
    }
}
