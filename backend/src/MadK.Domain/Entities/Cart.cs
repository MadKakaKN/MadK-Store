namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Giỏ hàng của người dùng hoặc khách vãng lai.
/// Thiết kế theo docs/erd.md: liên kết User (nếu đã đăng nhập) hoặc AnonymousId (nếu là khách).
/// </summary>
public class Cart : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string? AnonymousId { get; set; }

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
