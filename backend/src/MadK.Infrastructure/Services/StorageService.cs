using Amazon.S3;
using Amazon.S3.Model;
using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace MadK.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly StorageSettings _settings;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<StorageService> _logger;
    private readonly IAmazonS3? _s3Client;

    public StorageService(
        IOptions<StorageSettings> settings,
        IWebHostEnvironment env,
        ILogger<StorageService> logger,
        IAmazonS3? s3Client = null)
    {
        _settings = settings.Value;
        _env = env;
        _logger = logger;
        _s3Client = s3Client;
    }

    public async Task<Result<FileUploadResultDto>> UploadImageAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        long fileLength,
        string subFolder = "products",
        CancellationToken ct = default)
    {
        if (fileStream == null || fileLength <= 0)
        {
            return Result<FileUploadResultDto>.Failure("Tệp tin rỗng hoặc không tồn tại.");
        }

        if (fileLength > _settings.MaxImageSizeBytes)
        {
            var maxMb = _settings.MaxImageSizeBytes / (1024 * 1024);
            return Result<FileUploadResultDto>.Failure($"Dung lượng ảnh vượt quá giới hạn cho phép (tối đa {maxMb}MB).");
        }

        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !_settings.AllowedImageExtensions.Contains(ext))
        {
            var allowedList = string.Join(", ", _settings.AllowedImageExtensions);
            return Result<FileUploadResultDto>.Failure($"Loại tệp không được hỗ trợ. Chỉ chấp nhận các định dạng ảnh: {allowedList}");
        }

        // Validate and process image with ImageSharp
        Image image;
        try
        {
            fileStream.Position = 0;
            image = await Image.LoadAsync(fileStream, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load image stream for file {FileName}", originalFileName);
            return Result<FileUploadResultDto>.Failure("Định dạng ảnh không hợp lệ hoặc tệp tin bị hỏng.");
        }

        using (image)
        {
            int originalWidth = image.Width;
            int originalHeight = image.Height;

            // 1. Resize main image if larger than 1920x1920 (preserve aspect ratio)
            const int maxMainDimension = 1920;
            if (image.Width > maxMainDimension || image.Height > maxMainDimension)
            {
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(maxMainDimension, maxMainDimension)
                }));
            }

            // Encode main image to WebP with high quality compression
            using var mainStream = new MemoryStream();
            var webpEncoder = new WebpEncoder { Quality = 80 };
            await image.SaveAsWebpAsync(mainStream, webpEncoder, ct);
            mainStream.Position = 0;

            // 2. Create thumbnail (max 400x400)
            using var thumbStream = new MemoryStream();
            using (var thumbImage = image.Clone(x => x.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(400, 400)
            })))
            {
                var thumbWebpEncoder = new WebpEncoder { Quality = 75 };
                await thumbImage.SaveAsWebpAsync(thumbStream, thumbWebpEncoder, ct);
                thumbStream.Position = 0;
            }

            var baseId = Guid.NewGuid().ToString("N");
            var mainFileName = $"{baseId}.webp";
            var thumbFileName = $"{baseId}_thumb.webp";

            string mainUrl;
            string thumbUrl;

            var isS3Provider = _settings.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase) ||
                               _settings.Provider.Equals("MinIO", StringComparison.OrdinalIgnoreCase);

            if (isS3Provider && _s3Client != null)
            {
                mainUrl = await SaveToS3Async(mainStream, $"{subFolder}/{mainFileName}", "image/webp", ct);
                thumbUrl = await SaveToS3Async(thumbStream, $"{subFolder}/{thumbFileName}", "image/webp", ct);
            }
            else
            {
                mainUrl = await SaveToLocalAsync(mainStream, subFolder, mainFileName, ct);
                thumbUrl = await SaveToLocalAsync(thumbStream, subFolder, thumbFileName, ct);
            }

            var result = new FileUploadResultDto(
                Url: mainUrl,
                ThumbnailUrl: thumbUrl,
                FileName: mainFileName,
                FileSizeBytes: mainStream.Length,
                Width: image.Width,
                Height: image.Height,
                ContentType: "image/webp"
            );

            return Result<FileUploadResultDto>.Success(result);
        }
    }

    public async Task<Result<FileUploadResultDto>> UploadModel3DAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        long fileLength,
        CancellationToken ct = default)
    {
        if (fileStream == null || fileLength <= 0)
        {
            return Result<FileUploadResultDto>.Failure("Tệp tin rỗng hoặc không tồn tại.");
        }

        if (fileLength > _settings.MaxModel3DSizeBytes)
        {
            var maxMb = _settings.MaxModel3DSizeBytes / (1024 * 1024);
            return Result<FileUploadResultDto>.Failure($"Dung lượng model 3D vượt quá giới hạn cho phép (tối đa {maxMb}MB).");
        }

        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !_settings.AllowedModel3DExtensions.Contains(ext))
        {
            var allowedList = string.Join(", ", _settings.AllowedModel3DExtensions);
            return Result<FileUploadResultDto>.Failure($"Loại tệp 3D không được hỗ trợ. Chỉ chấp nhận các định dạng: {allowedList}");
        }

        fileStream.Position = 0;
        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        const string subFolder = "models3d";

        string modelUrl;
        var isS3Provider = _settings.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase) ||
                           _settings.Provider.Equals("MinIO", StringComparison.OrdinalIgnoreCase);

        if (isS3Provider && _s3Client != null)
        {
            var mimeType = ext == ".glb" ? "model/gltf-binary" : "model/gltf+json";
            modelUrl = await SaveToS3Async(fileStream, $"{subFolder}/{uniqueFileName}", mimeType, ct);
        }
        else
        {
            modelUrl = await SaveToLocalAsync(fileStream, subFolder, uniqueFileName, ct);
        }

        var result = new FileUploadResultDto(
            Url: modelUrl,
            ThumbnailUrl: null,
            FileName: uniqueFileName,
            FileSizeBytes: fileLength,
            Width: null,
            Height: null,
            ContentType: contentType
        );

        return Result<FileUploadResultDto>.Success(result);
    }

    private async Task<string> SaveToLocalAsync(
        Stream stream,
        string subFolder,
        string fileName,
        CancellationToken ct)
    {
        var webRoot = _env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var folderPath = Path.Combine(webRoot, "uploads", subFolder);
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        var fullFilePath = Path.Combine(folderPath, fileName);
        using (var output = new FileStream(fullFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            stream.Position = 0;
            await stream.CopyToAsync(output, ct);
        }

        var baseUrl = _settings.BaseUrl.TrimEnd('/');
        return $"{baseUrl}/{subFolder}/{fileName}";
    }

    private async Task<string> SaveToS3Async(
        Stream stream,
        string key,
        string contentType,
        CancellationToken ct)
    {
        var putRequest = new PutObjectRequest
        {
            BucketName = _settings.S3.BucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType
        };

        await _s3Client!.PutObjectAsync(putRequest, ct);

        if (!string.IsNullOrWhiteSpace(_settings.S3.PublicCustomDomain))
        {
            return $"{_settings.S3.PublicCustomDomain.TrimEnd('/')}/{key}";
        }

        var serviceUrl = _settings.S3.ServiceUrl?.TrimEnd('/') ?? "http://localhost:9000";
        return $"{serviceUrl}/{_settings.S3.BucketName}/{key}";
    }
}
