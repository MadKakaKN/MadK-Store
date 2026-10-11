namespace MadK.Application.DTOs.Catalog;

public class CategoryTreeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public int DisplayOrder { get; set; }
    public List<CategoryTreeDto> Children { get; set; } = new();
}
