using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Admin;
using MadK.Application.DTOs.Catalog;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/catalog")]
[Authorize(Policy = Permissions.CatalogManage)]
public class AdminCatalogController : ControllerBase
{
    private readonly IAdminCatalogService _catalogService;
    private readonly IStorageService _storageService;

    public AdminCatalogController(
        IAdminCatalogService catalogService,
        IStorageService storageService)
    {
        _catalogService = catalogService;
        _storageService = storageService;
    }

    #region Categories
    [HttpGet("categories")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<AdminCategoryListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories([FromQuery] bool includeDeleted = false, CancellationToken ct = default)
    {
        var result = await _catalogService.GetCategoriesAsync(includeDeleted, ct);
        return Ok(result);
    }

    [HttpGet("categories/{id:guid}")]
    [ProducesResponseType(typeof(Result<AdminCategoryDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCategoryById(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.GetCategoryByIdAsync(id, ct);
        if (!result.IsSuccess) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("categories")]
    [ProducesResponseType(typeof(Result<AdminCategoryDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.CreateCategoryAsync(
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess) return BadRequest(result);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("categories/{id:guid}")]
    [ProducesResponseType(typeof(Result<AdminCategoryDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.UpdateCategoryAsync(
            id,
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpDelete("categories/{id:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.DeleteCategoryAsync(
            id,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPut("categories/{id:guid}/schema")]
    [ProducesResponseType(typeof(Result<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCategorySchema(Guid id, [FromBody] UpdateCategorySchemaRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.UpdateCategorySchemaAsync(
            id,
            request.SchemaDefinition,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }
    #endregion

    #region Brands
    [HttpGet("brands")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<AdminBrandListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBrands([FromQuery] bool includeDeleted = false, CancellationToken ct = default)
    {
        var result = await _catalogService.GetBrandsAsync(includeDeleted, ct);
        return Ok(result);
    }

    [HttpGet("brands/{id:guid}")]
    [ProducesResponseType(typeof(Result<AdminBrandDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBrandById(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.GetBrandByIdAsync(id, ct);
        if (!result.IsSuccess) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("brands")]
    [ProducesResponseType(typeof(Result<AdminBrandDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBrand([FromBody] CreateBrandRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.CreateBrandAsync(
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess) return BadRequest(result);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("brands/{id:guid}")]
    [ProducesResponseType(typeof(Result<AdminBrandDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBrand(Guid id, [FromBody] UpdateBrandRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.UpdateBrandAsync(
            id,
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpDelete("brands/{id:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBrand(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.DeleteBrandAsync(
            id,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }
    #endregion

    #region Products
    [HttpGet("products")]
    [ProducesResponseType(typeof(Result<PagedResult<AdminProductListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts([FromQuery] AdminProductQueryFilter filter, CancellationToken ct = default)
    {
        var result = await _catalogService.GetProductsAsync(filter, ct);
        return Ok(result);
    }

    [HttpGet("products/{id:guid}")]
    [ProducesResponseType(typeof(Result<AdminProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductById(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.GetProductByIdAsync(id, ct);
        if (!result.IsSuccess) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("products")]
    [ProducesResponseType(typeof(Result<AdminProductDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.CreateProductAsync(
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess) return BadRequest(result);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("products/{id:guid}")]
    [ProducesResponseType(typeof(Result<AdminProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.UpdateProductAsync(
            id,
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPut("products/{id:guid}/visibility")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleProductVisibility(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.ToggleProductVisibilityAsync(
            id,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess) return NotFound(result);
        return Ok(result);
    }

    [HttpDelete("products/{id:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.DeleteProductAsync(
            id,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("products/{id:guid}/restore")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreProduct(Guid id, CancellationToken ct = default)
    {
        var result = await _catalogService.RestoreProductAsync(
            id,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess) return NotFound(result);
        return Ok(result);
    }
    #endregion

    #region Product Variants
    [HttpPost("products/{productId:guid}/variants")]
    [ProducesResponseType(typeof(Result<AdminProductVariantDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateVariant(Guid productId, [FromBody] CreateProductVariantRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.CreateVariantAsync(
            productId,
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("variants/{variantId:guid}")]
    [ProducesResponseType(typeof(Result<AdminProductVariantDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateVariant(Guid variantId, [FromBody] UpdateProductVariantRequestDto request, CancellationToken ct = default)
    {
        var result = await _catalogService.UpdateVariantAsync(
            variantId,
            request,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPut("variants/{variantId:guid}/price")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateVariantPrice(
        Guid variantId,
        [FromBody] UpdatePriceRequestDto request,
        CancellationToken ct = default)
    {
        var result = await _catalogService.UpdateVariantAsync(
            variantId,
            new UpdateProductVariantRequestDto(
                Sku: string.Empty,
                Name: string.Empty,
                Attributes: "{}",
                OriginalPrice: request.OriginalPrice ?? request.SalePrice,
                SalePrice: request.SalePrice,
                CostPrice: 0,
                StockQuantity: 10,
                IsActive: true),
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(Result.Success("Cập nhật giá sản phẩm thành công."));
    }

    [HttpDelete("variants/{variantId:guid}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVariant(Guid variantId, CancellationToken ct = default)
    {
        var result = await _catalogService.DeleteVariantAsync(
            variantId,
            GetCurrentUserId(),
            GetCurrentUserEmail(),
            GetCurrentUserRole(),
            GetClientIp(),
            GetUserAgent(),
            ct);

        if (!result.IsSuccess)
        {
            if (result.Error?.Contains("Không tìm thấy") == true) return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }
    #endregion

    #region Uploads
    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Result<FileUploadResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string subFolder = "products", CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(Result<FileUploadResultDto>.Failure("Vui lòng chọn tệp tin ảnh để tải lên."));
        }

        using var stream = file.OpenReadStream();
        var result = await _storageService.UploadImageAsync(
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            subFolder,
            ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("upload-model3d")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Result<FileUploadResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadModel3D(IFormFile file, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(Result<FileUploadResultDto>.Failure("Vui lòng chọn tệp tin model 3D (.glb/.gltf) để tải lên."));
        }

        using var stream = file.OpenReadStream();
        var result = await _storageService.UploadModel3DAsync(
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            ct);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
    #endregion

    #region Helper Claims
    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var userId) ? userId : Guid.Empty;
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "unknown";
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role) ?? "Admin";
    }

    private string? GetClientIp()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }

    private string? GetUserAgent()
    {
        return HttpContext.Request.Headers["User-Agent"].ToString();
    }
    #endregion
}

public record UpdatePriceRequestDto(decimal SalePrice, decimal? OriginalPrice = null);
