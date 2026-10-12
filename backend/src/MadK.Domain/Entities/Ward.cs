namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Xã/Phường/Thị trấn (Việt Nam).
/// Dữ liệu theo danh mục hành chính của Tổng cục Thống kê (GSO).
/// </summary>
public class Ward
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string CodeName { get; set; } = string.Empty;

    public string DistrictCode { get; set; } = string.Empty;
    public District District { get; set; } = null!;
}
