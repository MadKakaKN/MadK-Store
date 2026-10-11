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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
