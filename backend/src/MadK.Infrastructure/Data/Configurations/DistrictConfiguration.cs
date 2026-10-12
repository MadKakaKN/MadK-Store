using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class DistrictConfiguration : IEntityTypeConfiguration<District>
{
    public void Configure(EntityTypeBuilder<District> builder)
    {
        builder.ToTable("districts");

        builder.HasKey(d => d.Code);
        builder.Property(d => d.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
        builder.Property(d => d.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(d => d.FullName).HasColumnName("full_name").HasMaxLength(150).IsRequired();
        builder.Property(d => d.CodeName).HasColumnName("code_name").HasMaxLength(100).IsRequired();
        builder.Property(d => d.ProvinceCode).HasColumnName("province_code").HasMaxLength(20).IsRequired();

        builder.HasOne(d => d.Province)
            .WithMany(p => p.Districts)
            .HasForeignKey(d => d.ProvinceCode)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(d => d.Wards)
            .WithOne(w => w.District)
            .HasForeignKey(w => w.DistrictCode)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.ProvinceCode)
            .HasDatabaseName("idx_districts_province_code");
    }
}
