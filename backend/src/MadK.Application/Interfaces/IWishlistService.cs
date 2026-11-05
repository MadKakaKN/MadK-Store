using MadK.Application.Common;
using MadK.Application.DTOs.Wishlist;

namespace MadK.Application.Interfaces;

/// <summary>
/// Dịch vụ xử lý danh sách sản phẩm yêu thích (Wishlist).
/// </summary>
public interface IWishlistService
{
    /// <summary>
    /// Lấy danh sách đầy đủ các sản phẩm yêu thích của người dùng.
    /// </summary>
    Task<Result<IReadOnlyList<WishlistItemDto>>> GetWishlistAsync(
        Guid userId,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách ProductId đã thích để hiển thị trạng thái Trái tim ❤️ trên giao diện.
    /// </summary>
    Task<Result<IReadOnlyList<Guid>>> GetWishlistProductIdsAsync(
        Guid userId,
        CancellationToken ct = default);

    /// <summary>
    /// Thêm một sản phẩm vào danh sách yêu thích.
    /// </summary>
    Task<Result<WishlistItemDto>> AddToWishlistAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default);

    /// <summary>
    /// Xóa sản phẩm khỏi danh sách yêu thích.
    /// </summary>
    Task<Result<bool>> RemoveFromWishlistAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default);

    /// <summary>
    /// Đồng bộ danh sách yêu thích từ bộ nhớ tạm (LocalStorage) vào tài khoản khi khách đăng nhập.
    /// </summary>
    Task<Result<IReadOnlyList<WishlistItemDto>>> SyncWishlistAsync(
        Guid userId,
        SyncWishlistDto dto,
        CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra sản phẩm đã nằm trong danh sách yêu thích của người dùng chưa.
    /// </summary>
    Task<Result<bool>> IsInWishlistAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default);
}
