using FluentAssertions;
using MadK.Application.DTOs.Address;
using MadK.Application.Services;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace MadK.Infrastructure.Tests;

public class AddressServiceTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<(AddressService service, AppDbContext context, User userA, User userB)> CreateTestSetupAsync()
    {
        var db = CreateInMemoryDbContext("AddressTest_" + Guid.NewGuid());

        // Seed Users
        var userA = new User
        {
            Id = Guid.NewGuid(),
            Email = "usera@example.com",
            FullName = "User A",
            PasswordHash = "hashA",
            CreatedAt = DateTime.UtcNow
        };

        var userB = new User
        {
            Id = Guid.NewGuid(),
            Email = "userb@example.com",
            FullName = "User B",
            PasswordHash = "hashB",
            CreatedAt = DateTime.UtcNow
        };

        db.Users.AddRange(userA, userB);

        // Seed Provinces, Districts, Wards
        var prov = new Province { Code = "79", Name = "Hồ Chí Minh", FullName = "Thành phố Hồ Chí Minh", CodeName = "ho_chi_minh", DisplayOrder = 1 };
        var dist = new District { Code = "760", Name = "Quận 1", FullName = "Quận 1", CodeName = "quan_1", ProvinceCode = "79" };
        var ward = new Ward { Code = "26734", Name = "Bến Nghé", FullName = "Phường Bến Nghé", CodeName = "phuong_ben_nghe", DistrictCode = "760" };

        db.Provinces.Add(prov);
        db.Districts.Add(dist);
        db.Wards.Add(ward);

        await db.SaveChangesAsync();

        var service = new AddressService(db, NullLogger<AddressService>.Instance);
        return (service, db, userA, userB);
    }

    [Fact]
    public async Task GetProvincesAsync_ShouldReturnProvincesList()
    {
        var (service, _, _, _) = await CreateTestSetupAsync();

        var result = await service.GetProvincesAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeEmpty();
        result.Data!.Any(p => p.Code == "79" && p.Name == "Hồ Chí Minh").Should().BeTrue();
    }

    [Fact]
    public async Task GetDistrictsByProvinceAsync_ShouldReturnDistrictsForProvince()
    {
        var (service, _, _, _) = await CreateTestSetupAsync();

        var result = await service.GetDistrictsByProvinceAsync("79");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().ContainSingle(d => d.Code == "760" && d.ProvinceCode == "79");
    }

    [Fact]
    public async Task GetWardsByDistrictAsync_ShouldReturnWardsForDistrict()
    {
        var (service, _, _, _) = await CreateTestSetupAsync();

        var result = await service.GetWardsByDistrictAsync("760");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().ContainSingle(w => w.Code == "26734" && w.DistrictCode == "760");
    }

    [Fact]
    public async Task CreateAddressAsync_FirstAddress_ShouldAutomaticallyBeDefault()
    {
        var (service, _, userA, _) = await CreateTestSetupAsync();
        var request = new CreateAddressRequestDto("User A", "0901234567", "79", "760", "26734", "123 Lê Duẩn", IsDefault: false);

        var result = await service.CreateAddressAsync(userA.Id, request);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsDefault.Should().BeTrue("địa chỉ đầu tiên của người dùng phải tự động đặt làm mặc định");
        result.Data.RecipientName.Should().Be("User A");
        result.Data.ProvinceName.Should().Be("Thành phố Hồ Chí Minh");
        result.Data.DistrictName.Should().Be("Quận 1");
        result.Data.WardName.Should().Be("Phường Bến Nghé");
    }

    [Fact]
    public async Task CreateAddressAsync_WhenSecondAddressIsDefault_ShouldUnsetDefaultFromFirst()
    {
        var (service, _, userA, _) = await CreateTestSetupAsync();
        var req1 = new CreateAddressRequestDto("User A", "0901234567", "79", "760", "26734", "123 Lê Duẩn", IsDefault: true);
        var addr1 = await service.CreateAddressAsync(userA.Id, req1);

        var req2 = new CreateAddressRequestDto("User A Công Ty", "0901234567", "79", "760", "26734", "456 Nguyễn Du", IsDefault: true);
        var addr2 = await service.CreateAddressAsync(userA.Id, req2);

        addr2.Data!.IsDefault.Should().BeTrue();

        var userAddresses = await service.GetUserAddressesAsync(userA.Id);
        userAddresses.Data!.First(a => a.Id == addr1.Data!.Id).IsDefault.Should().BeFalse();
        userAddresses.Data!.First(a => a.Id == addr2.Data!.Id).IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAddressAsync_ShouldUpdateFieldsSuccessfully()
    {
        var (service, _, userA, _) = await CreateTestSetupAsync();
        var req = new CreateAddressRequestDto("User A", "0901234567", "79", "760", "26734", "123 Lê Duẩn", IsDefault: true);
        var created = await service.CreateAddressAsync(userA.Id, req);

        var updateReq = new UpdateAddressRequestDto("User A (Updated)", "0909999888", "79", "760", "26734", "789 Hai Bà Trưng", IsDefault: true);
        var updateResult = await service.UpdateAddressAsync(userA.Id, created.Data!.Id, updateReq);

        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Data!.RecipientName.Should().Be("User A (Updated)");
        updateResult.Data.PhoneNumber.Should().Be("0909999888");
        updateResult.Data.DetailedAddress.Should().Be("789 Hai Bà Trưng");
    }

    [Fact]
    public async Task DeleteAddressAsync_WhenDeletingDefaultAddress_ShouldAutoPromoteNextAddress()
    {
        var (service, _, userA, _) = await CreateTestSetupAsync();
        var addr1 = await service.CreateAddressAsync(userA.Id, new CreateAddressRequestDto("A1", "0901111111", "79", "760", "26734", "Đường 1", IsDefault: false));
        var addr2 = await service.CreateAddressAsync(userA.Id, new CreateAddressRequestDto("A2", "0902222222", "79", "760", "26734", "Đường 2", IsDefault: true));

        // Xóa addr2 (đang là default)
        var deleteResult = await service.DeleteAddressAsync(userA.Id, addr2.Data!.Id);
        deleteResult.IsSuccess.Should().BeTrue();

        // Kiểm tra addr1 còn lại phải được thăng hạng thành default
        var remaining = await service.GetUserAddressesAsync(userA.Id);
        remaining.Data.Should().HaveCount(1);
        remaining.Data!.Single().Id.Should().Be(addr1.Data!.Id);
        remaining.Data!.Single().IsDefault.Should().BeTrue();
    }

    // =========================================================================
    // KIỂM TRA QUYỀN SỞ HỮU - CHỐNG IDOR (INSECURE DIRECT OBJECT REFERENCES)
    // Người dùng A không đọc, sửa, xóa, hoặc đặt mặc định địa chỉ của người dùng B!
    // =========================================================================

    [Fact]
    public async Task IDOR_GetAddressById_WhenUserATriesToReadUserBAddress_ShouldReturnForbidden()
    {
        var (service, _, userA, userB) = await CreateTestSetupAsync();

        // Tạo địa chỉ cho User B
        var addressB = await service.CreateAddressAsync(userB.Id, new CreateAddressRequestDto(
            "User B Secret", "0909888777", "79", "760", "26734", "Nhà riêng User B", IsDefault: true
        ));

        // User A cố tình đọc địa chỉ của User B
        var result = await service.GetAddressByIdAsync(userA.Id, addressB.Data!.Id);

        // Assert: Chặn IDOR và trả về FORBIDDEN
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().StartWith("FORBIDDEN");
    }

    [Fact]
    public async Task IDOR_UpdateAddress_WhenUserATriesToUpdateUserBAddress_ShouldReturnForbidden()
    {
        var (service, _, userA, userB) = await CreateTestSetupAsync();

        var addressB = await service.CreateAddressAsync(userB.Id, new CreateAddressRequestDto(
            "User B Secret", "0909888777", "79", "760", "26734", "Nhà riêng User B", IsDefault: true
        ));

        var maliciousPayload = new UpdateAddressRequestDto(
            "Hacker A", "0999999999", "79", "760", "26734", "Nhà Hacker", IsDefault: false
        );

        // User A cố tình sửa địa chỉ của User B
        var result = await service.UpdateAddressAsync(userA.Id, addressB.Data!.Id, maliciousPayload);

        // Assert: Chặn IDOR và trả về FORBIDDEN
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().StartWith("FORBIDDEN");
    }

    [Fact]
    public async Task IDOR_DeleteAddress_WhenUserATriesToDeleteUserBAddress_ShouldReturnForbidden()
    {
        var (service, _, userA, userB) = await CreateTestSetupAsync();

        var addressB = await service.CreateAddressAsync(userB.Id, new CreateAddressRequestDto(
            "User B Secret", "0909888777", "79", "760", "26734", "Nhà riêng User B", IsDefault: true
        ));

        // User A cố tình xóa địa chỉ của User B
        var result = await service.DeleteAddressAsync(userA.Id, addressB.Data!.Id);

        // Assert: Chặn IDOR và trả về FORBIDDEN
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().StartWith("FORBIDDEN");
    }

    [Fact]
    public async Task IDOR_SetDefaultAddress_WhenUserATriesToSetDefaultOnUserBAddress_ShouldReturnForbidden()
    {
        var (service, _, userA, userB) = await CreateTestSetupAsync();

        var addressB = await service.CreateAddressAsync(userB.Id, new CreateAddressRequestDto(
            "User B Secret", "0909888777", "79", "760", "26734", "Nhà riêng User B", IsDefault: false
        ));

        // User A cố tình đặt mặc định trên địa chỉ của User B
        var result = await service.SetDefaultAddressAsync(userA.Id, addressB.Data!.Id);

        // Assert: Chặn IDOR và trả về FORBIDDEN
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().StartWith("FORBIDDEN");
    }
}
