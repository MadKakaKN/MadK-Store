using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/brands")]
public class BrandsController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public BrandsController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Lấy danh sách thương hiệu.
    /// </summary>
    /// <param name="isActive">Lọc theo trạng thái hoạt động (mặc định: true)</param>
    /// <param name="ct">CancellationToken</param>
    [HttpGet]
    [ProducesResponseType(typeof(Result<IReadOnlyList<BrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBrands([FromQuery] bool isActive = true, CancellationToken ct = default)
    {
        var result = await _catalogService.GetBrandsAsync(isActive, ct);
        return Ok(result);
    }
}
