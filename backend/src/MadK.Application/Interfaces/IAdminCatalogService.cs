using MadK.Application.Common;
using MadK.Application.DTOs.Admin;

namespace MadK.Application.Interfaces;

public interface IAdminCatalogService
{
    #region Category Management
    Task<Result<IReadOnlyList<AdminCategoryListDto>>> GetCategoriesAsync(bool includeDeleted = false, CancellationToken ct = default);
    Task<Result<AdminCategoryDetailDto>> GetCategoryByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<AdminCategoryDetailDto>> CreateCategoryAsync(CreateCategoryRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<AdminCategoryDetailDto>> UpdateCategoryAsync(Guid id, UpdateCategoryRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<bool>> DeleteCategoryAsync(Guid id, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<string>> UpdateCategorySchemaAsync(Guid id, string schemaDefinition, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    #endregion

    #region Brand Management
    Task<Result<IReadOnlyList<AdminBrandListDto>>> GetBrandsAsync(bool includeDeleted = false, CancellationToken ct = default);
    Task<Result<AdminBrandDetailDto>> GetBrandByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<AdminBrandDetailDto>> CreateBrandAsync(CreateBrandRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<AdminBrandDetailDto>> UpdateBrandAsync(Guid id, UpdateBrandRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<bool>> DeleteBrandAsync(Guid id, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    #endregion

    #region Product Management
    Task<Result<PagedResult<AdminProductListDto>>> GetProductsAsync(AdminProductQueryFilter filter, CancellationToken ct = default);
    Task<Result<AdminProductDetailDto>> GetProductByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<AdminProductDetailDto>> CreateProductAsync(CreateProductRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<AdminProductDetailDto>> UpdateProductAsync(Guid id, UpdateProductRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<bool>> ToggleProductVisibilityAsync(Guid id, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<bool>> DeleteProductAsync(Guid id, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<bool>> RestoreProductAsync(Guid id, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    #endregion

    #region Product Variant Management
    Task<Result<AdminProductVariantDto>> CreateVariantAsync(Guid productId, CreateProductVariantRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<AdminProductVariantDto>> UpdateVariantAsync(Guid variantId, UpdateProductVariantRequestDto request, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    Task<Result<bool>> DeleteVariantAsync(Guid variantId, Guid staffId, string staffEmail, string staffRole, string? ip = null, string? ua = null, CancellationToken ct = default);
    #endregion
}
