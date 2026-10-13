using MadK.Application.Common;
using MadK.Application.DTOs.Cart;

namespace MadK.Application.Interfaces;

public interface ICartService
{
    /// <summary>
    /// Lấy chi tiết giỏ hàng hiện tại (theo UserId nếu đã đăng nhập, hoặc AnonymousId nếu là khách).
    /// </summary>
    Task<Result<CartDto>> GetCartAsync(Guid? userId, string? anonymousId, CancellationToken ct = default);

    /// <summary>
    /// Thêm sản phẩm biến thể vào giỏ hàng. Server luôn tính giá từ DB, bỏ qua hoàn toàn giá client gửi.
    /// Kiểm tra tồn kho khả dụng khi thêm.
    /// </summary>
    Task<Result<CartDto>> AddItemAsync(Guid? userId, string? anonymousId, AddToCartRequestDto request, CancellationToken ct = default);

    /// <summary>
    /// Cập nhật số lượng của một dòng sản phẩm trong giỏ. Kiểm tra tồn kho khả dụng.
    /// </summary>
    Task<Result<CartDto>> UpdateItemQuantityAsync(Guid? userId, string? anonymousId, Guid itemId, int quantity, CancellationToken ct = default);

    /// <summary>
    /// Xóa một món hàng khỏi giỏ.
    /// </summary>
    Task<Result<CartDto>> RemoveItemAsync(Guid? userId, string? anonymousId, Guid itemId, CancellationToken ct = default);

    /// <summary>
    /// Xóa toàn bộ giỏ hàng.
    /// </summary>
    Task<Result<CartDto>> ClearCartAsync(Guid? userId, string? anonymousId, CancellationToken ct = default);

    /// <summary>
    /// Gộp giỏ hàng của khách (từ AnonymousId hoặc danh sách items) vào giỏ hàng DB của tài khoản sau khi đăng nhập.
    /// </summary>
    Task<Result<CartDto>> MergeCartAsync(Guid userId, MergeCartRequestDto request, CancellationToken ct = default);
}
