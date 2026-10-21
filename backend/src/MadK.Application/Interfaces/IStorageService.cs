using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;

namespace MadK.Application.Interfaces;

public interface IStorageService
{
    Task<Result<FileUploadResultDto>> UploadImageAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        long fileLength,
        string subFolder = "products",
        CancellationToken ct = default);

    Task<Result<FileUploadResultDto>> UploadModel3DAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        long fileLength,
        CancellationToken ct = default);
}
