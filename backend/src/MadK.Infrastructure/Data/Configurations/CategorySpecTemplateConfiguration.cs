using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class CategorySpecTemplateConfiguration : IEntityTypeConfiguration<CategorySpecTemplate>
{
    public void Configure(EntityTypeBuilder<CategorySpecTemplate> builder)
    {
        builder.ToTable("category_spec_templates");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");

        builder.Property(t => t.CategoryId).HasColumnName("category_id").IsRequired();
        builder.Property(t => t.SchemaDefinition).HasColumnName("schema_definition").HasColumnType("jsonb").IsRequired();
        builder.Property(t => t.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");

        // 1-to-1 relationship with Category
        builder.HasOne(t => t.Category)
            .WithOne(c => c.SpecTemplate)
            .HasForeignKey<CategorySpecTemplate>(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(t => t.CategoryId)
            .IsUnique()
            .HasDatabaseName("idx_category_spec_templates_category_id");

        builder.HasIndex(t => t.SchemaDefinition)
            .HasMethod("gin")
            .HasDatabaseName("idx_category_spec_templates_schema_gin");
    }
}
