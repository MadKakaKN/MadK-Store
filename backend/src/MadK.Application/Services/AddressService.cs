using MadK.Application.Common;
using MadK.Application.DTOs.Address;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Application.Services;

public class AddressService : IAddressService
{
    private readonly IAppDbContext _context;
    private readonly ILogger<AddressService> _logger;

    public AddressService(IAppDbContext context, ILogger<AddressService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<IReadOnlyList<ProvinceDto>>> GetProvincesAsync(CancellationToken ct = default)
    {
        var provinces = await _context.Provinces
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.Name)
            .AsNoTracking()
            .Select(p => new ProvinceDto(p.Code, p.Name, p.FullName, p.DisplayOrder))
            .ToListAsync(ct);

        return Result<IReadOnlyList<ProvinceDto>>.Success(provinces);
    }

    public async Task<Result<IReadOnlyList<DistrictDto>>> GetDistrictsByProvinceAsync(string provinceCode, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(provinceCode))
        {
            return Result<IReadOnlyList<DistrictDto>>.Failure("Mã tỉnh/thành phố không được để trống.");
        }

        var districts = await _context.Districts
            .Where(d => d.ProvinceCode == provinceCode.Trim())
            .OrderBy(d => d.Name)
            .AsNoTracking()
            .Select(d => new DistrictDto(d.Code, d.Name, d.FullName, d.ProvinceCode))
            .ToListAsync(ct);

        return Result<IReadOnlyList<DistrictDto>>.Success(districts);
    }

    public async Task<Result<IReadOnlyList<WardDto>>> GetWardsByDistrictAsync(string districtCode, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(districtCode))
        {
            return Result<IReadOnlyList<WardDto>>.Failure("Mã quận/huyện không được để trống.");
        }

        var wards = await _context.Wards
            .Where(w => w.DistrictCode == districtCode.Trim())
            .OrderBy(w => w.Name)
            .AsNoTracking()
            .Select(w => new WardDto(w.Code, w.Name, w.FullName, w.DistrictCode))
            .ToListAsync(ct);

        return Result<IReadOnlyList<WardDto>>.Success(wards);
    }

    public async Task<Result<IReadOnlyList<AddressDto>>> GetUserAddressesAsync(Guid currentUserId, CancellationToken ct = default)
    {
        if (currentUserId == Guid.Empty)
        {
            return Result<IReadOnlyList<AddressDto>>.Failure("Không xác định được phiên người dùng.");
        }

        var addresses = await _context.Addresses
            .Where(a => a.UserId == currentUserId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .AsNoTracking()
            .Select(a => MapToDto(a))
            .ToListAsync(ct);

        return Result<IReadOnlyList<AddressDto>>.Success(addresses);
    }

    public async Task<Result<AddressDto>> GetAddressByIdAsync(Guid currentUserId, Guid addressId, CancellationToken ct = default)
    {
        if (currentUserId == Guid.Empty)
        {
            return Result<AddressDto>.Failure("Không xác định được phiên người dùng.");
        }

        var address = await _context.Addresses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == addressId, ct);

        if (address == null)
        {
            return Result<AddressDto>.Failure("Không tìm thấy địa chỉ.");
        }

        // Chống IDOR: Chỉ chủ sở hữu mới được đọc chi tiết địa chỉ
        if (address.UserId != currentUserId)
        {
            _logger.LogWarning("IDOR Attempt: User {UserId} tried to read address {AddressId} owned by {OwnerId}",
                currentUserId, addressId, address.UserId);
            return Result<AddressDto>.Failure("FORBIDDEN: Bạn không có quyền truy cập địa chỉ này.");
        }

        return Result<AddressDto>.Success(MapToDto(address));
    }

    public async Task<Result<AddressDto>> CreateAddressAsync(Guid currentUserId, CreateAddressRequestDto request, CancellationToken ct = default)
    {
        if (currentUserId == Guid.Empty)
        {
            return Result<AddressDto>.Failure("Không xác định được phiên người dùng.");
        }

        var validationError = ValidateAddressRequest(request.RecipientName, request.PhoneNumber, request.ProvinceCode, request.DistrictCode, request.WardCode, request.DetailedAddress);
        if (validationError != null)
        {
            return Result<AddressDto>.Failure(validationError);
        }

        // Tìm thông tin Tỉnh, Huyện, Xã
        var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Code == request.ProvinceCode.Trim(), ct);
        var district = await _context.Districts.FirstOrDefaultAsync(d => d.Code == request.DistrictCode.Trim() && d.ProvinceCode == request.ProvinceCode.Trim(), ct);
        var ward = await _context.Wards.FirstOrDefaultAsync(w => w.Code == request.WardCode.Trim() && w.DistrictCode == request.DistrictCode.Trim(), ct);

        if (province == null)
        {
            return Result<AddressDto>.Failure($"Mã tỉnh/thành phố '{request.ProvinceCode}' không hợp lệ.");
        }
        if (district == null)
        {
            return Result<AddressDto>.Failure($"Mã quận/huyện '{request.DistrictCode}' không thuộc tỉnh/thành phố '{province.FullName}'.");
        }
        if (ward == null)
        {
            return Result<AddressDto>.Failure($"Mã phường/xã '{request.WardCode}' không thuộc quận/huyện '{district.FullName}'.");
        }

        var existingAddresses = await _context.Addresses
            .Where(a => a.UserId == currentUserId)
            .ToListAsync(ct);

        bool isDefault = request.IsDefault || existingAddresses.Count == 0;

        if (isDefault)
        {
            foreach (var addr in existingAddresses.Where(a => a.IsDefault))
            {
                addr.IsDefault = false;
            }
        }

        var newAddress = new Address
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            RecipientName = request.RecipientName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            ProvinceCode = province.Code,
            ProvinceName = province.FullName,
            DistrictCode = district.Code,
            DistrictName = district.FullName,
            WardCode = ward.Code,
            WardName = ward.FullName,
            DetailedAddress = request.DetailedAddress.Trim(),
            IsDefault = isDefault,
            CreatedAt = DateTime.UtcNow
        };

        _context.Addresses.Add(newAddress);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created new address {AddressId} for user {UserId} (Default: {IsDefault})",
            newAddress.Id, currentUserId, newAddress.IsDefault);

        return Result<AddressDto>.Success(MapToDto(newAddress), "Thêm địa chỉ mới thành công.");
    }

    public async Task<Result<AddressDto>> UpdateAddressAsync(Guid currentUserId, Guid addressId, UpdateAddressRequestDto request, CancellationToken ct = default)
    {
        if (currentUserId == Guid.Empty)
        {
            return Result<AddressDto>.Failure("Không xác định được phiên người dùng.");
        }

        var validationError = ValidateAddressRequest(request.RecipientName, request.PhoneNumber, request.ProvinceCode, request.DistrictCode, request.WardCode, request.DetailedAddress);
        if (validationError != null)
        {
            return Result<AddressDto>.Failure(validationError);
        }

        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == addressId, ct);
        if (address == null)
        {
            return Result<AddressDto>.Failure("Không tìm thấy địa chỉ.");
        }

        // Chống IDOR: Không được sửa địa chỉ của người khác
        if (address.UserId != currentUserId)
        {
            _logger.LogWarning("IDOR Attempt: User {UserId} tried to update address {AddressId} owned by {OwnerId}",
                currentUserId, addressId, address.UserId);
            return Result<AddressDto>.Failure("FORBIDDEN: Bạn không có quyền thao tác trên địa chỉ của người dùng khác.");
        }

        // Tìm thông tin Tỉnh, Huyện, Xã
        var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Code == request.ProvinceCode.Trim(), ct);
        var district = await _context.Districts.FirstOrDefaultAsync(d => d.Code == request.DistrictCode.Trim() && d.ProvinceCode == request.ProvinceCode.Trim(), ct);
        var ward = await _context.Wards.FirstOrDefaultAsync(w => w.Code == request.WardCode.Trim() && w.DistrictCode == request.DistrictCode.Trim(), ct);

        if (province == null)
        {
            return Result<AddressDto>.Failure($"Mã tỉnh/thành phố '{request.ProvinceCode}' không hợp lệ.");
        }
        if (district == null)
        {
            return Result<AddressDto>.Failure($"Mã quận/huyện '{request.DistrictCode}' không thuộc tỉnh/thành phố '{province.FullName}'.");
        }
        if (ward == null)
        {
            return Result<AddressDto>.Failure($"Mã phường/xã '{request.WardCode}' không thuộc quận/huyện '{district.FullName}'.");
        }

        var otherAddresses = await _context.Addresses
            .Where(a => a.UserId == currentUserId && a.Id != addressId)
            .ToListAsync(ct);

        bool isDefault = request.IsDefault;
        if (!isDefault && address.IsDefault && otherAddresses.Count == 0)
        {
            // Nếu là địa chỉ duy nhất, bắt buộc duy trì mặc định
            isDefault = true;
        }

        if (isDefault)
        {
            foreach (var other in otherAddresses.Where(a => a.IsDefault))
            {
                other.IsDefault = false;
            }
        }

        address.RecipientName = request.RecipientName.Trim();
        address.PhoneNumber = request.PhoneNumber.Trim();
        address.ProvinceCode = province.Code;
        address.ProvinceName = province.FullName;
        address.DistrictCode = district.Code;
        address.DistrictName = district.FullName;
        address.WardCode = ward.Code;
        address.WardName = ward.FullName;
        address.DetailedAddress = request.DetailedAddress.Trim();
        address.IsDefault = isDefault;
        address.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Updated address {AddressId} for user {UserId}", addressId, currentUserId);
        return Result<AddressDto>.Success(MapToDto(address), "Cập nhật địa chỉ thành công.");
    }

    public async Task<Result> DeleteAddressAsync(Guid currentUserId, Guid addressId, CancellationToken ct = default)
    {
        if (currentUserId == Guid.Empty)
        {
            return Result.Failure("Không xác định được phiên người dùng.");
        }

        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == addressId, ct);
        if (address == null)
        {
            return Result.Failure("Không tìm thấy địa chỉ.");
        }

        // Chống IDOR: Không được xóa địa chỉ của người khác
        if (address.UserId != currentUserId)
        {
            _logger.LogWarning("IDOR Attempt: User {UserId} tried to delete address {AddressId} owned by {OwnerId}",
                currentUserId, addressId, address.UserId);
            return Result.Failure("FORBIDDEN: Bạn không có quyền thao tác trên địa chỉ của người dùng khác.");
        }

        bool wasDefault = address.IsDefault;
        _context.Addresses.Remove(address);

        // Nếu xóa địa chỉ mặc định và còn địa chỉ khác, tự động đặt địa chỉ gần nhất làm mặc định
        if (wasDefault)
        {
            var nextDefault = await _context.Addresses
                .Where(a => a.UserId == currentUserId && a.Id != addressId)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (nextDefault != null)
            {
                nextDefault.IsDefault = true;
            }
        }

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation("Deleted address {AddressId} for user {UserId}", addressId, currentUserId);
        return Result.Success("Xóa địa chỉ thành công.");
    }

    public async Task<Result> SetDefaultAddressAsync(Guid currentUserId, Guid addressId, CancellationToken ct = default)
    {
        if (currentUserId == Guid.Empty)
        {
            return Result.Failure("Không xác định được phiên người dùng.");
        }

        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == addressId, ct);
        if (address == null)
        {
            return Result.Failure("Không tìm thấy địa chỉ.");
        }

        // Chống IDOR: Không được đặt mặc định địa chỉ của người khác
        if (address.UserId != currentUserId)
        {
            _logger.LogWarning("IDOR Attempt: User {UserId} tried to set default on address {AddressId} owned by {OwnerId}",
                currentUserId, addressId, address.UserId);
            return Result.Failure("FORBIDDEN: Bạn không có quyền thao tác trên địa chỉ của người dùng khác.");
        }

        if (address.IsDefault)
        {
            return Result.Success("Địa chỉ đã là mặc định.");
        }

        var allUserAddresses = await _context.Addresses
            .Where(a => a.UserId == currentUserId)
            .ToListAsync(ct);

        foreach (var addr in allUserAddresses)
        {
            addr.IsDefault = (addr.Id == addressId);
            if (addr.Id == addressId)
            {
                addr.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation("Set address {AddressId} as default for user {UserId}", addressId, currentUserId);
        return Result.Success("Đã đặt làm địa chỉ giao hàng mặc định.");
    }

    private static string? ValidateAddressRequest(string recipientName, string phoneNumber, string provinceCode, string districtCode, string wardCode, string detailedAddress)
    {
        if (string.IsNullOrWhiteSpace(recipientName) || recipientName.Trim().Length < 2)
        {
            return "Tên người nhận phải có ít nhất 2 ký tự.";
        }

        if (string.IsNullOrWhiteSpace(phoneNumber) || phoneNumber.Trim().Length < 9 || phoneNumber.Trim().Length > 15)
        {
            return "Số điện thoại không hợp lệ (9 - 15 chữ số).";
        }

        if (string.IsNullOrWhiteSpace(provinceCode))
        {
            return "Vui lòng chọn Tỉnh/Thành phố.";
        }

        if (string.IsNullOrWhiteSpace(districtCode))
        {
            return "Vui lòng chọn Quận/Huyện.";
        }

        if (string.IsNullOrWhiteSpace(wardCode))
        {
            return "Vui lòng chọn Phường/Xã.";
        }

        if (string.IsNullOrWhiteSpace(detailedAddress) || detailedAddress.Trim().Length < 3)
        {
            return "Địa chỉ chi tiết phải có ít nhất 3 ký tự.";
        }

        return null;
    }

    private static AddressDto MapToDto(Address a) => new(
        a.Id,
        a.UserId,
        a.RecipientName,
        a.PhoneNumber,
        a.ProvinceCode,
        a.ProvinceName,
        a.DistrictCode,
        a.DistrictName,
        a.WardCode,
        a.WardName,
        a.DetailedAddress,
        a.FullAddress,
        a.IsDefault,
        a.CreatedAt,
        a.UpdatedAt
    );
}
