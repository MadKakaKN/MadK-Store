namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho một sản phẩm trong danh sách yêu thích của người dùng.
/// </summary>
public class WishlistItem : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
}
