using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MadK.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Brand> Brands { get; }
    DbSet<CategorySpecTemplate> CategorySpecTemplates { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductImage> ProductImages { get; }

    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Province> Provinces { get; }
    DbSet<District> Districts { get; }
    DbSet<Ward> Wards { get; }
    DbSet<Address> Addresses { get; }
    DbSet<Cart> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Inventory> Inventories { get; }
    DbSet<StockMovement> StockMovements { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<OrderStatusHistory> OrderStatusHistories { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
