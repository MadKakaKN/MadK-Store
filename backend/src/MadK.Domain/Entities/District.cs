namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Quận/Huyện/Thị xã/Thành phố thuộc tỉnh (Việt Nam).
/// Dữ liệu theo danh mục hành chính của Tổng cục Thống kê (GSO).
/// </summary>
public class District
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string CodeName { get; set; } = string.Empty;

    public string ProvinceCode { get; set; } = string.Empty;
    public Province Province { get; set; } = null!;

    public ICollection<Ward> Wards { get; set; } = new List<Ward>();
}
