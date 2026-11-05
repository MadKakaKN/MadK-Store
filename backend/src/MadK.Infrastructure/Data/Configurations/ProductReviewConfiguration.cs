using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class ProductReviewConfiguration : IEntityTypeConfiguration<ProductReview>
{
    public void Configure(EntityTypeBuilder<ProductReview> builder)
    {
        builder.ToTable("product_reviews");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");

        builder.Property(r => r.ProductId).HasColumnName("product_id").IsRequired();
        builder.Property(r => r.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(r => r.OrderId).HasColumnName("order_id");

        builder.Property(r => r.Rating).HasColumnName("rating").IsRequired();
        builder.Property(r => r.Title).HasColumnName("title").HasMaxLength(150);
        builder.Property(r => r.Comment).HasColumnName("comment").HasColumnType("text").IsRequired();
        builder.Property(r => r.ImagesJson).HasColumnName("images_json").HasColumnType("jsonb").HasDefaultValue("[]").IsRequired();
        builder.Property(r => r.IsVerifiedPurchase).HasColumnName("is_verified_purchase").HasDefaultValue(false);

        builder.Property(r => r.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(r => r.AdminReply).HasColumnName("admin_reply").HasColumnType("text");
        builder.Property(r => r.AdminRepliedAt).HasColumnName("admin_replied_at");
        builder.Property(r => r.HelpfulCount).HasColumnName("helpful_count").HasDefaultValue(0);

        builder.Property(r => r.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at");
        builder.Property(r => r.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(r => r.DeletedAt).HasColumnName("deleted_at");

        // Relationships
        builder.HasOne(r => r.Product)
            .WithMany()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(r => new { r.ProductId, r.Status });
        builder.HasIndex(r => r.UserId);
    }
}
