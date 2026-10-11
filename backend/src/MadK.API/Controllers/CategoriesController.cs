using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public CategoriesController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Lấy cây danh mục sản phẩm (phân cấp cha-con).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(Result<IReadOnlyList<CategoryTreeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategoryTree(CancellationToken ct)
    {
        var result = await _catalogService.GetCategoryTreeAsync(ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết danh mục theo slug kèm JSON Schema thông số kỹ thuật.
    /// </summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(Result<CategoryDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CategoryDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCategoryBySlug(string slug, CancellationToken ct)
    {
        var result = await _catalogService.GetCategoryBySlugAsync(slug, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy bộ lọc khả dụng sinh động theo danh mục (thương hiệu, khoảng giá, thông số kỹ thuật).
    /// </summary>
    [HttpGet("{slug}/filters")]
    [ProducesResponseType(typeof(Result<CategoryFiltersDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<CategoryFiltersDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCategoryFilters(string slug, CancellationToken ct)
    {
        var result = await _catalogService.GetCategoryFiltersAsync(slug, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }
}
