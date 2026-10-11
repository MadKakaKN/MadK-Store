using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;

namespace MadK.Application.Interfaces;

public interface ICatalogService
{
    Task<Result<IReadOnlyList<CategoryTreeDto>>> GetCategoryTreeAsync(CancellationToken ct = default);
    Task<Result<CategoryDetailDto>> GetCategoryBySlugAsync(string slug, CancellationToken ct = default);
    Task<Result<CategoryFiltersDto>> GetCategoryFiltersAsync(string slug, CancellationToken ct = default);
    Task<Result<IReadOnlyList<BrandDto>>> GetBrandsAsync(bool activeOnly = true, CancellationToken ct = default);
    Task<Result<PagedResult<ProductListDto>>> GetProductsAsync(ProductQueryParams queryParams, CancellationToken ct = default);
    Task<Result<ProductDetailDto>> GetProductBySlugAsync(string slug, CancellationToken ct = default);
}
