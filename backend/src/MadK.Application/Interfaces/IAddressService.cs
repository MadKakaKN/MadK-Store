using MadK.Application.Common;
using MadK.Application.DTOs.Address;

namespace MadK.Application.Interfaces;

public interface IAddressService
{
    // Đơn vị hành chính Việt Nam (Public)
    Task<Result<IReadOnlyList<ProvinceDto>>> GetProvincesAsync(CancellationToken ct = default);
    Task<Result<IReadOnlyList<DistrictDto>>> GetDistrictsByProvinceAsync(string provinceCode, CancellationToken ct = default);
    Task<Result<IReadOnlyList<WardDto>>> GetWardsByDistrictAsync(string districtCode, CancellationToken ct = default);

    // Sổ địa chỉ cá nhân (Authenticated, Chống IDOR)
    Task<Result<IReadOnlyList<AddressDto>>> GetUserAddressesAsync(Guid currentUserId, CancellationToken ct = default);
    Task<Result<AddressDto>> GetAddressByIdAsync(Guid currentUserId, Guid addressId, CancellationToken ct = default);
    Task<Result<AddressDto>> CreateAddressAsync(Guid currentUserId, CreateAddressRequestDto request, CancellationToken ct = default);
    Task<Result<AddressDto>> UpdateAddressAsync(Guid currentUserId, Guid addressId, UpdateAddressRequestDto request, CancellationToken ct = default);
    Task<Result> DeleteAddressAsync(Guid currentUserId, Guid addressId, CancellationToken ct = default);
    Task<Result> SetDefaultAddressAsync(Guid currentUserId, Guid addressId, CancellationToken ct = default);
}
