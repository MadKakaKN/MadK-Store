using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class ProvinceConfiguration : IEntityTypeConfiguration<Province>
{
    public void Configure(EntityTypeBuilder<Province> builder)
    {
        builder.ToTable("provinces");

        builder.HasKey(p => p.Code);
        builder.Property(p => p.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
        builder.Property(p => p.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(p => p.FullName).HasColumnName("full_name").HasMaxLength(150).IsRequired();
        builder.Property(p => p.CodeName).HasColumnName("code_name").HasMaxLength(100).IsRequired();
        builder.Property(p => p.DisplayOrder).HasColumnName("display_order").HasDefaultValue(0);

        builder.HasMany(p => p.Districts)
            .WithOne(d => d.Province)
            .HasForeignKey(d => d.ProvinceCode)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
