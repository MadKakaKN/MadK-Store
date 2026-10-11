using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MadK.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");

        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        builder.Property(u => u.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
        builder.Property(u => u.FullName).HasColumnName("full_name").HasMaxLength(150).IsRequired();
        builder.Property(u => u.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20);
        builder.Property(u => u.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
        builder.Property(u => u.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(u => u.EmailConfirmed).HasColumnName("email_confirmed").HasDefaultValue(false);

        builder.Property(u => u.EmailConfirmationToken).HasColumnName("email_confirmation_token").HasMaxLength(255);
        builder.Property(u => u.EmailConfirmationTokenExpiresAt).HasColumnName("email_confirmation_token_expires_at");

        builder.Property(u => u.PasswordResetToken).HasColumnName("password_reset_token").HasMaxLength(255);
        builder.Property(u => u.PasswordResetTokenExpiresAt).HasColumnName("password_reset_token_expires_at");

        builder.Property(u => u.FailedLoginAttempts).HasColumnName("failed_login_attempts").HasDefaultValue(0);
        builder.Property(u => u.LockoutEnd).HasColumnName("lockout_end");

        builder.Property(u => u.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(u => u.UpdatedAt).HasColumnName("updated_at");

        builder.Ignore(u => u.IsLockedOut);

        // Indexes
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("idx_users_email");

        builder.HasIndex(u => u.PhoneNumber)
            .HasDatabaseName("idx_users_phone");
    }
}
