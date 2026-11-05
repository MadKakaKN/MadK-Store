namespace MadK.Application.DTOs.Wishlist;

public record WishlistItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string? ThumbnailUrl,
    decimal BasePrice,
    string CategoryName,
    string BrandName,
    bool IsActive,
    DateTime CreatedAt
);

public class SyncWishlistDto
{
    public List<Guid> ProductIds { get; set; } = new();
}
