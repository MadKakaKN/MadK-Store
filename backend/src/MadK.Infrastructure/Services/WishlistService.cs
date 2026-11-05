using MadK.Application.Common;
using MadK.Application.DTOs.Wishlist;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class WishlistService : IWishlistService
{
    private readonly IAppDbContext _db;
    private readonly ILogger<WishlistService> _logger;

    public WishlistService(IAppDbContext db, ILogger<WishlistService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Result<IReadOnlyList<WishlistItemDto>>> GetWishlistAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var items = await _db.WishlistItems
            .AsNoTracking()
            .Include(w => w.Product)
                .ThenInclude(p => p.Category)
            .Include(w => w.Product)
                .ThenInclude(p => p.Brand)
            .Where(w => w.UserId == userId && !w.Product.IsDeleted)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WishlistItemDto(
                w.Id,
                w.ProductId,
                w.Product.Name,
                w.Product.Slug,
                w.Product.ThumbnailUrl,
                w.Product.BasePrice,
                w.Product.Category.Name,
                w.Product.Brand.Name,
                w.Product.IsActive,
                w.CreatedAt
            ))
            .ToListAsync(ct);

        return Result<IReadOnlyList<WishlistItemDto>>.Success(items);
    }

    public async Task<Result<IReadOnlyList<Guid>>> GetWishlistProductIdsAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var productIds = await _db.WishlistItems
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .Select(w => w.ProductId)
            .ToListAsync(ct);

        return Result<IReadOnlyList<Guid>>.Success(productIds);
    }

    public async Task<Result<WishlistItemDto>> AddToWishlistAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default)
    {
        var product = await _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted, ct);

        if (product == null)
        {
            return Result<WishlistItemDto>.Failure("Không tìm thấy sản phẩm cần thêm vào danh sách yêu thích.");
        }

        var existing = await _db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId, ct);

        if (existing != null)
        {
            var dto = new WishlistItemDto(
                existing.Id,
                product.Id,
                product.Name,
                product.Slug,
                product.ThumbnailUrl,
                product.BasePrice,
                product.Category.Name,
                product.Brand.Name,
                product.IsActive,
                existing.CreatedAt
            );
            return Result<WishlistItemDto>.Success(dto, "Sản phẩm đã có trong danh sách yêu thích.");
        }

        var item = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProductId = productId,
            CreatedAt = DateTime.UtcNow
        };

        _db.WishlistItems.Add(item);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Người dùng {UserId} đã thêm sản phẩm {ProductId} vào danh sách yêu thích", userId, productId);

        var resultDto = new WishlistItemDto(
            item.Id,
            product.Id,
            product.Name,
            product.Slug,
            product.ThumbnailUrl,
            product.BasePrice,
            product.Category.Name,
            product.Brand.Name,
            product.IsActive,
            item.CreatedAt
        );

        return Result<WishlistItemDto>.Success(resultDto, "Đã thêm vào danh sách yêu thích.");
    }

    public async Task<Result<bool>> RemoveFromWishlistAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default)
    {
        var item = await _db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId, ct);

        if (item != null)
        {
            _db.WishlistItems.Remove(item);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Người dùng {UserId} đã xóa sản phẩm {ProductId} khỏi danh sách yêu thích", userId, productId);
        }

        return Result<bool>.Success(true, "Đã xóa khỏi danh sách yêu thích.");
    }

    public async Task<Result<IReadOnlyList<WishlistItemDto>>> SyncWishlistAsync(
        Guid userId,
        SyncWishlistDto dto,
        CancellationToken ct = default)
    {
        if (dto.ProductIds != null && dto.ProductIds.Count > 0)
        {
            var validProductIds = await _db.Products
                .AsNoTracking()
                .Where(p => dto.ProductIds.Contains(p.Id) && !p.IsDeleted)
                .Select(p => p.Id)
                .ToListAsync(ct);

            var existingIds = await _db.WishlistItems
                .AsNoTracking()
                .Where(w => w.UserId == userId)
                .Select(w => w.ProductId)
                .ToListAsync(ct);

            var newProductIds = validProductIds.Except(existingIds).Distinct().ToList();

            foreach (var pid in newProductIds)
            {
                _db.WishlistItems.Add(new WishlistItem
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    ProductId = pid,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (newProductIds.Count > 0)
            {
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Đã đồng bộ {Count} sản phẩm vào danh sách yêu thích của người dùng {UserId}", newProductIds.Count, userId);
            }
        }

        return await GetWishlistAsync(userId, ct);
    }

    public async Task<Result<bool>> IsInWishlistAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default)
    {
        var exists = await _db.WishlistItems
            .AsNoTracking()
            .AnyAsync(w => w.UserId == userId && w.ProductId == productId, ct);

        return Result<bool>.Success(exists);
    }
}
