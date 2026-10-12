namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Tỉnh/Thành phố trực thuộc Trung ương (Việt Nam).
/// Dữ liệu theo Quyết định số 124/2004/QĐ-TTg của Tổng cục Thống kê (GSO).
/// </summary>
public class Province
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string CodeName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;

    public ICollection<District> Districts { get; set; } = new List<District>();
}
