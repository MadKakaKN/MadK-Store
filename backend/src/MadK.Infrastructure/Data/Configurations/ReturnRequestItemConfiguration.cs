using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class ReturnRequestItemConfiguration : IEntityTypeConfiguration<ReturnRequestItem>
{
    public void Configure(EntityTypeBuilder<ReturnRequestItem> builder)
    {
        builder.ToTable("return_request_items");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.ReturnRequestId).HasColumnName("return_request_id").IsRequired();
        builder.Property(i => i.OrderItemId).HasColumnName("order_item_id");
        builder.Property(i => i.VariantId).HasColumnName("variant_id");

        builder.Property(i => i.ProductName).HasColumnName("product_name").HasMaxLength(255).IsRequired();
        builder.Property(i => i.VariantName).HasColumnName("variant_name").HasMaxLength(255).IsRequired();
        builder.Property(i => i.Sku).HasColumnName("sku").HasMaxLength(100).IsRequired();

        builder.Property(i => i.Quantity).HasColumnName("quantity").IsRequired();
        builder.Property(i => i.UnitPrice).HasColumnName("unit_price").HasPrecision(15, 2).IsRequired();
        builder.Property(i => i.TotalPrice).HasColumnName("total_price").HasPrecision(15, 2).IsRequired();

        builder.Property(i => i.Reason).HasColumnName("reason").HasMaxLength(255);
        builder.Property(i => i.Condition).HasColumnName("condition").HasMaxLength(100);

        builder.Property(i => i.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(i => i.ReturnRequestId).HasDatabaseName("idx_return_request_items_request_id");
        builder.HasIndex(i => i.VariantId).HasDatabaseName("idx_return_request_items_variant_id");
    }
}
