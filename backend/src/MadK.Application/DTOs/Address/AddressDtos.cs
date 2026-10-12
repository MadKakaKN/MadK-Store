namespace MadK.Application.DTOs.Address;

public record ProvinceDto(
    string Code,
    string Name,
    string FullName,
    int DisplayOrder
);

public record DistrictDto(
    string Code,
    string Name,
    string FullName,
    string ProvinceCode
);

public record WardDto(
    string Code,
    string Name,
    string FullName,
    string DistrictCode
);

public record AddressDto(
    Guid Id,
    Guid UserId,
    string RecipientName,
    string PhoneNumber,
    string ProvinceCode,
    string ProvinceName,
    string DistrictCode,
    string DistrictName,
    string WardCode,
    string WardName,
    string DetailedAddress,
    string FullAddress,
    bool IsDefault,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateAddressRequestDto(
    string RecipientName,
    string PhoneNumber,
    string ProvinceCode,
    string DistrictCode,
    string WardCode,
    string DetailedAddress,
    bool IsDefault = false
);

public record UpdateAddressRequestDto(
    string RecipientName,
    string PhoneNumber,
    string ProvinceCode,
    string DistrictCode,
    string WardCode,
    string DetailedAddress,
    bool IsDefault = false
);
