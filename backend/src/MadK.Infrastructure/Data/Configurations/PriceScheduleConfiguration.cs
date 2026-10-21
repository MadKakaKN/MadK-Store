using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class PriceScheduleConfiguration : IEntityTypeConfiguration<PriceSchedule>
{
    public void Configure(EntityTypeBuilder<PriceSchedule> builder)
    {
        builder.ToTable("price_schedules");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");

        builder.Property(s => s.VariantId).HasColumnName("variant_id").IsRequired();
        builder.Property(s => s.PriceType).HasColumnName("price_type").HasConversion<int>().IsRequired();
        builder.Property(s => s.Price).HasColumnName("price").HasColumnType("numeric(15,2)").IsRequired();
        builder.Property(s => s.OriginalPrice).HasColumnName("original_price").HasColumnType("numeric(15,2)").IsRequired();
        builder.Property(s => s.StartDate).HasColumnName("start_date").IsRequired();
        builder.Property(s => s.EndDate).HasColumnName("end_date");
        builder.Property(s => s.Reason).HasColumnName("reason").HasMaxLength(250).IsRequired();
        builder.Property(s => s.Note).HasColumnName("note");
        builder.Property(s => s.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(s => s.CreatedBy).HasColumnName("created_by").HasMaxLength(150);
        builder.Property(s => s.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at");
        builder.Property(s => s.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(s => s.DeletedAt).HasColumnName("deleted_at");

        builder.HasQueryFilter(s => !s.IsDeleted);

        builder.HasOne(s => s.Variant)
            .WithMany(v => v.PriceSchedules)
            .HasForeignKey(s => s.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.VariantId)
            .HasDatabaseName("idx_price_schedules_variant_id");

        builder.HasIndex(s => new { s.VariantId, s.StartDate, s.EndDate, s.IsActive })
            .HasDatabaseName("idx_price_schedules_dates");
    }
}
