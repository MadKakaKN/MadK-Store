using System.Security.Claims;
using System.Text.RegularExpressions;
using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Application.DTOs.Reviews;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController : ControllerBase
{
    private static readonly Regex SpecQueryRegex = new(@"^specs\[([^\]]+)\]$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private readonly ICatalogService _catalogService;
    private readonly IProductReviewService _reviewService;

    public ProductsController(
        ICatalogService catalogService,
        IProductReviewService reviewService)
    {
        _catalogService = catalogService;
        _reviewService = reviewService;
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

    /// <summary>
    /// Lấy danh sách đánh giá đã duyệt của sản phẩm kèm tóm tắt phân bổ sao.
    /// </summary>
    [HttpGet("{id:guid}/reviews")]
    [ProducesResponseType(typeof(Result<ProductReviewsPagedResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductReviews(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? rating = null,
        CancellationToken ct = default)
    {
        var result = await _reviewService.GetProductReviewsAsync(id, page, pageSize, rating, ct);
        return Ok(result);
    }

    /// <summary>
    /// Kiểm tra xem người dùng hiện tại có đủ điều kiện đánh giá sản phẩm không.
    /// </summary>
    [HttpGet("{id:guid}/reviews/can-review")]
    [Authorize]
    [ProducesResponseType(typeof(Result<CanReviewProductResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CanReviewProduct(Guid id, CancellationToken ct = default)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để kiểm tra điều kiện đánh giá."));
        }

        var result = await _reviewService.CanUserReviewProductAsync(userId, id, ct);
        return Ok(result);
    }

    /// <summary>
    /// Khách hàng gửi đánh giá và xếp hạng sao cho sản phẩm.
    /// </summary>
    [HttpPost("{id:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(Result<ProductReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<ProductReviewDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProductReview(
        Guid id,
        [FromBody] CreateProductReviewDto dto,
        CancellationToken ct = default)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId))
        {
            return Unauthorized(Result.Failure("Vui lòng đăng nhập để gửi đánh giá."));
        }

        var result = await _reviewService.CreateReviewAsync(userId, id, dto, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Người dùng bình chọn đánh giá là hữu ích.
    /// </summary>
    [HttpPost("reviews/{reviewId:guid}/helpful")]
    [ProducesResponseType(typeof(Result<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<int>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VoteHelpful(Guid reviewId, CancellationToken ct = default)
    {
        var result = await _reviewService.VoteHelpfulAsync(reviewId, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
