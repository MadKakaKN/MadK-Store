using System.Text.RegularExpressions;
using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController : ControllerBase
{
    private static readonly Regex SpecQueryRegex = new(@"^specs\[([^\]]+)\]$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private readonly ICatalogService _catalogService;

    public ProductsController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Danh sách sản phẩm có phân trang, sắp xếp, tìm kiếm full-text và lọc kết hợp đa điều kiện.
    /// </summary>
    /// <param name="queryParams">Tham số lọc, tìm kiếm, phân trang và sắp xếp</param>
    /// <param name="ct">CancellationToken</param>
    [HttpGet]
    [OutputCache(PolicyName = "ProductList")]
    [ProducesResponseType(typeof(Result<PagedResult<ProductListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts([FromQuery] ProductQueryParams queryParams, CancellationToken ct)
    {
        // Parse specs from query string e.g. ?specs[ram]=16GB&specs[color]=black
        if (queryParams.Specs == null || queryParams.Specs.Count == 0)
        {
            var specs = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var query in Request.Query)
            {
                var match = SpecQueryRegex.Match(query.Key);
                if (match.Success)
                {
                    specs[match.Groups[1].Value] = query.Value.ToString();
                }
            }

            if (specs.Count > 0)
            {
                queryParams.Specs = specs;
            }
        }

        var result = await _catalogService.GetProductsAsync(queryParams, ct);
        return Ok(result);
    }

    /// <summary>
    /// Gợi ý tìm kiếm nhanh (Autocomplete & Typo-tolerance suggestions) cho sản phẩm, danh mục, thương hiệu.
    /// </summary>
    /// <param name="q">Từ khóa tìm kiếm</param>
    /// <param name="limit">Số lượng gợi ý sản phẩm tối đa (mặc định: 6)</param>
    /// <param name="ct">CancellationToken</param>
    [HttpGet("suggestions")]
    [OutputCache(Duration = 180, VaryByQueryKeys = new[] { "q", "limit" })]
    [ProducesResponseType(typeof(Result<SearchSuggestionsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSuggestions([FromQuery] string? q, [FromQuery] int limit = 6, CancellationToken ct = default)
    {
        var result = await _catalogService.GetSearchSuggestionsAsync(q ?? string.Empty, limit, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết sản phẩm theo slug kèm các biến thể SKU, ảnh, đường dẫn model 3D.
    /// </summary>
    /// <param name="slug">Slug của sản phẩm</param>
    /// <param name="ct">CancellationToken</param>
    [HttpGet("{slug}")]
    [OutputCache(PolicyName = "ProductDetail")]
    [ProducesResponseType(typeof(Result<ProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ProductDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductBySlug(string slug, CancellationToken ct)
    {
        var result = await _catalogService.GetProductBySlugAsync(slug, ct);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }
}
