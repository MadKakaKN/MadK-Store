namespace MadK.Application.DTOs.Catalog;

public record FileUploadResultDto(
    string Url,
    string? ThumbnailUrl,
    string FileName,
    long FileSizeBytes,
    int? Width,
    int? Height,
    string ContentType
);

public class StorageSettings
{
    public const string SectionName = "Storage";

    public string Provider { get; set; } = "Local"; // "Local", "S3", "MinIO"
    public string UploadPath { get; set; } = "wwwroot/uploads";
    public string BaseUrl { get; set; } = "/uploads";
    public long MaxImageSizeBytes { get; set; } = 5 * 1024 * 1024; // 5MB
    public long MaxModel3DSizeBytes { get; set; } = 50 * 1024 * 1024; // 50MB
    public List<string> AllowedImageExtensions { get; set; } = new() { ".jpg", ".jpeg", ".png", ".webp" };
    public List<string> AllowedModel3DExtensions { get; set; } = new() { ".glb", ".gltf" };
    public S3StorageSettings S3 { get; set; } = new();
}

public class S3StorageSettings
{
    public string? ServiceUrl { get; set; }
    public string BucketName { get; set; } = "madk-catalog";
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
    public string Region { get; set; } = "us-east-1";
    public bool ForcePathStyle { get; set; } = true;
    public string? PublicCustomDomain { get; set; }
}
