namespace MadK.Domain.Entities;

public class CategorySpecTemplate : BaseEntity
{
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    /// <summary>
    /// JSON Schema definition for category specifications.
    /// </summary>
    public string SchemaDefinition { get; set; } = "{}";
}
