using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Address;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
public class AddressesController : ControllerBase
{
    private readonly IAddressService _addressService;

    public AddressesController(IAddressService addressService)
    {
        _addressService = addressService;
    }

    // =========================================================================
    // 1. ĐƠN VỊ HÀNH CHÍNH VIỆT NAM (PUBLIC)
    // Nguồn dữ liệu mở: Tổng cục Thống kê (GSO - gso.gov.vn)
    // =========================================================================

    /// <summary>
    /// Lấy danh sách 63 Tỉnh/Thành phố trực thuộc Trung ương (Việt Nam).
    /// </summary>
    [HttpGet("api/v1/addresses/provinces")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<ProvinceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProvinces(CancellationToken ct)
    {
        var result = await _addressService.GetProvincesAsync(ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách Quận/Huyện theo mã Tỉnh/Thành phố.
    /// </summary>
    [HttpGet("api/v1/addresses/provinces/{provinceCode}/districts")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<DistrictDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<DistrictDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDistricts(string provinceCode, CancellationToken ct)
    {
        var result = await _addressService.GetDistrictsByProvinceAsync(provinceCode, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách Phường/Xã theo mã Quận/Huyện.
    /// </summary>
    [HttpGet("api/v1/addresses/districts/{districtCode}/wards")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<WardDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<IReadOnlyList<WardDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetWards(string districtCode, CancellationToken ct)
    {
        var result = await _addressService.GetWardsByDistrictAsync(districtCode, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    // =========================================================================
    // 2. SỔ ĐỊA CHỈ NGƯỜI DÙNG (AUTHENTICATED - CHỐNG IDOR)
    // Hỗ trợ cả 2 định dạng route:
    // /api/v1/users/me/addresses và /api/v1/addresses
    // =========================================================================

    /// <summary>
    /// Lấy danh sách sổ địa chỉ nhận hàng của người dùng hiện tại.
    /// </summary>
    [Authorize]
    [HttpGet("api/v1/addresses")]
    [HttpGet("api/v1/users/me/addresses")]
    [ProducesResponseType(typeof(Result<IReadOnlyList<AddressDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyAddresses(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result<IReadOnlyList<AddressDto>>.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _addressService.GetUserAddressesAsync(userId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết một địa chỉ theo ID (Kiểm tra quyền sở hữu chống IDOR).
    /// </summary>
    [Authorize]
    [HttpGet("api/v1/addresses/{id:guid}")]
    [HttpGet("api/v1/users/me/addresses/{id:guid}")]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAddressById(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result<AddressDto>.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _addressService.GetAddressByIdAsync(userId, id, ct);
        if (!result.IsSuccess)
        {
            if (result.Error?.StartsWith("FORBIDDEN:", StringComparison.OrdinalIgnoreCase) == true)
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Thêm địa chỉ nhận hàng mới vào sổ địa chỉ.
    /// </summary>
    [Authorize]
    [HttpPost("api/v1/addresses")]
    [HttpPost("api/v1/users/me/addresses")]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateAddress([FromBody] CreateAddressRequestDto request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result<AddressDto>.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _addressService.CreateAddressAsync(userId, request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Cập nhật thông tin địa chỉ nhận hàng (Kiểm tra quyền sở hữu chống IDOR).
    /// </summary>
    [Authorize]
    [HttpPut("api/v1/addresses/{id:guid}")]
    [HttpPut("api/v1/users/me/addresses/{id:guid}")]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(Result<AddressDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpdateAddressRequestDto request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result<AddressDto>.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _addressService.UpdateAddressAsync(userId, id, request, ct);
        if (!result.IsSuccess)
        {
            if (result.Error?.StartsWith("FORBIDDEN:", StringComparison.OrdinalIgnoreCase) == true)
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }
            if (result.Error?.Contains("Không tìm thấy", StringComparison.OrdinalIgnoreCase) == true)
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Xóa địa chỉ khỏi sổ địa chỉ (Kiểm tra quyền sở hữu chống IDOR).
    /// </summary>
    [Authorize]
    [HttpDelete("api/v1/addresses/{id:guid}")]
    [HttpDelete("api/v1/users/me/addresses/{id:guid}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _addressService.DeleteAddressAsync(userId, id, ct);
        if (!result.IsSuccess)
        {
            if (result.Error?.StartsWith("FORBIDDEN:", StringComparison.OrdinalIgnoreCase) == true)
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Đặt một địa chỉ làm địa chỉ giao hàng mặc định (Kiểm tra quyền sở hữu chống IDOR).
    /// </summary>
    [Authorize]
    [HttpPut("api/v1/addresses/{id:guid}/default")]
    [HttpPut("api/v1/users/me/addresses/{id:guid}/default")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SetDefaultAddress(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _addressService.SetDefaultAddressAsync(userId, id, ct);
        if (!result.IsSuccess)
        {
            if (result.Error?.StartsWith("FORBIDDEN:", StringComparison.OrdinalIgnoreCase) == true)
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }
            return NotFound(result);
        }

        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var userId) ? userId : Guid.Empty;
    }
}
