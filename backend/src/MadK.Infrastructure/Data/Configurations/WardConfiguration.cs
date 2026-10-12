using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class WardConfiguration : IEntityTypeConfiguration<Ward>
{
    public void Configure(EntityTypeBuilder<Ward> builder)
    {
        builder.ToTable("wards");

        builder.HasKey(w => w.Code);
        builder.Property(w => w.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
        builder.Property(w => w.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(w => w.FullName).HasColumnName("full_name").HasMaxLength(150).IsRequired();
        builder.Property(w => w.CodeName).HasColumnName("code_name").HasMaxLength(100).IsRequired();
        builder.Property(w => w.DistrictCode).HasColumnName("district_code").HasMaxLength(20).IsRequired();

        builder.HasOne(w => w.District)
            .WithMany(d => d.Wards)
            .HasForeignKey(w => w.DistrictCode)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => w.DistrictCode)
            .HasDatabaseName("idx_wards_district_code");
    }
}
