namespace MadK.Domain.Entities;

/// <summary>
/// Sổ địa chỉ giao hàng của người dùng.
/// Lưu thông tin người nhận, số điện thoại và phân cấp địa chỉ Việt Nam.
/// </summary>
public class Address : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string RecipientName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public string ProvinceCode { get; set; } = string.Empty;
    public string ProvinceName { get; set; } = string.Empty;

    public string DistrictCode { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;

    public string WardCode { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;

    public string DetailedAddress { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;

    public string FullAddress => $"{DetailedAddress}, {WardName}, {DistrictName}, {ProvinceName}";
}
