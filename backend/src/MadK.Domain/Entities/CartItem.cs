namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho một món hàng trong giỏ.
/// Giá và tổng tiền luôn được tính động từ ProductVariant trong DB, không lưu giá cứng từ client.
/// </summary>
public class CartItem : BaseEntity
{
    public Guid CartId { get; set; }
    public Cart Cart { get; set; } = null!;

    public Guid VariantId { get; set; }
    public ProductVariant Variant { get; set; } = null!;

    public int Quantity { get; set; } = 1;
}
