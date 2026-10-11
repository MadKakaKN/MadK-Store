using FluentAssertions;
using MadK.Application.DTOs.Auth;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace MadK.Infrastructure.Tests;

public class IdentityServiceTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    private static (IdentityService service, AppDbContext context) CreateTestService(string? dbName = null)
    {
        var db = CreateInMemoryDbContext(dbName ?? "IdentityTest_" + Guid.NewGuid());
        var passwordHasher = new PasswordHasher();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:Key", "SuperSecretKeyForTestingPurposesOnly1234567890!@#$" },
                { "Jwt:Issuer", "MadKTest" },
                { "Jwt:Audience", "MadKTestClient" },
                { "Jwt:ExpiryMinutes", "15" },
                { "Jwt:RefreshTokenExpiryDays", "7" }
            })
            .Build();

        var jwtGenerator = new JwtTokenGenerator(configuration);
        var emailSender = new ConsoleEmailSender(NullLogger<ConsoleEmailSender>.Instance);
        var service = new IdentityService(db, passwordHasher, jwtGenerator, emailSender, NullLogger<IdentityService>.Instance);

        return (service, db);
    }

    [Fact]
    public async Task RegisterAsync_ShouldCreateUser_WithHashedPassword_AndCustomerRole()
    {
        // Arrange
        var (service, context) = CreateTestService();
        var request = new RegisterRequestDto("john@example.com", "Secret123!", "John Doe", "0901112233");

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.Data.User.Email.Should().Be("john@example.com");
        result.Data.User.FullName.Should().Be("John Doe");
        result.Data.User.Roles.Should().Contain("Customer");
        result.Data.User.EmailConfirmed.Should().BeFalse();

        // Verify in DB
        var userInDb = await context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == "john@example.com");

        userInDb.Should().NotBeNull();
        userInDb!.PasswordHash.Should().NotBe("Secret123!");
        BCrypt.Net.BCrypt.Verify("Secret123!", userInDb.PasswordHash).Should().BeTrue();
        userInDb.EmailConfirmationToken.Should().NotBeNullOrWhiteSpace();
        userInDb.EmailConfirmationTokenExpiresAt.Should().BeAfter(DateTime.UtcNow);
        userInDb.UserRoles.Should().ContainSingle(ur => ur.Role.Name == "Customer");
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ShouldFail()
    {
        // Arrange
        var (service, _) = CreateTestService();
        var request = new RegisterRequestDto("duplicate@example.com", "Secret123!", "First User", null);
        await service.RegisterAsync(request);

        // Act
        var duplicateResult = await service.RegisterAsync(request);

        // Assert
        duplicateResult.IsSuccess.Should().BeFalse();
        duplicateResult.Error.Should().Contain("Email đã được sử dụng");
    }

    [Fact]
    public async Task VerifyEmailAsync_WithValidToken_ShouldConfirmEmail()
    {
        // Arrange
        var (service, context) = CreateTestService();
        await service.RegisterAsync(new RegisterRequestDto("verify@example.com", "Secret123!", "Verify User", null));

        var user = await context.Users.FirstAsync(u => u.Email == "verify@example.com");
        var token = user.EmailConfirmationToken!;

        // Act
        var result = await service.VerifyEmailAsync(new VerifyEmailRequestDto("verify@example.com", token));

        // Assert
        result.IsSuccess.Should().BeTrue();
        var updatedUser = await context.Users.FirstAsync(u => u.Email == "verify@example.com");
        updatedUser.EmailConfirmed.Should().BeTrue();
        updatedUser.EmailConfirmationToken.Should().BeNull();
    }

    [Fact]
    public async Task VerifyEmailAsync_WithExpiredOrInvalidToken_ShouldFail()
    {
        // Arrange
        var (service, context) = CreateTestService();
        await service.RegisterAsync(new RegisterRequestDto("expired@example.com", "Secret123!", "Expired User", null));

        // Invalid token
        var invalidResult = await service.VerifyEmailAsync(new VerifyEmailRequestDto("expired@example.com", "invalid-token"));
        invalidResult.IsSuccess.Should().BeFalse();

        // Expired token
        var user = await context.Users.FirstAsync(u => u.Email == "expired@example.com");
        user.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddMinutes(-5);
        await context.SaveChangesAsync();

        var expiredResult = await service.VerifyEmailAsync(new VerifyEmailRequestDto("expired@example.com", user.EmailConfirmationToken!));
        expiredResult.IsSuccess.Should().BeFalse();
        expiredResult.Error.Should().Contain("hết hạn");
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldSucceed_AndResetFailedAttempts()
    {
        // Arrange
        var (service, context) = CreateTestService();
        await service.RegisterAsync(new RegisterRequestDto("login@example.com", "Secret123!", "Login User", null));

        // Simulate 2 failed attempts first
        var user = await context.Users.FirstAsync(u => u.Email == "login@example.com");
        user.FailedLoginAttempts = 2;
        await context.SaveChangesAsync();

        // Act
        var result = await service.LoginAsync(new LoginRequestDto("login@example.com", "Secret123!"));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();

        var userAfterLogin = await context.Users.FirstAsync(u => u.Email == "login@example.com");
        userAfterLogin.FailedLoginAttempts.Should().Be(0);
        userAfterLogin.LockoutEnd.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_BruteForceDefense_ShouldLockAccountAfter5FailedAttempts()
    {
        // Arrange
        var (service, context) = CreateTestService();
        await service.RegisterAsync(new RegisterRequestDto("brute@example.com", "RealPassword123!", "Brute User", null));

        // Act - Attempt 5 wrong logins
        for (var i = 1; i <= 5; i++)
        {
            var failResult = await service.LoginAsync(new LoginRequestDto("brute@example.com", "WrongPassword!"));
            failResult.IsSuccess.Should().BeFalse();
        }

        // Verify account is now locked out
        var lockedUser = await context.Users.FirstAsync(u => u.Email == "brute@example.com");
        lockedUser.FailedLoginAttempts.Should().Be(5);
        lockedUser.LockoutEnd.Should().NotBeNull();
        lockedUser.LockoutEnd.Should().BeAfter(DateTime.UtcNow);
        lockedUser.IsLockedOut.Should().BeTrue();

        // 6th attempt with REAL password must also be blocked due to lockout!
        var blockedResult = await service.LoginAsync(new LoginRequestDto("brute@example.com", "RealPassword123!"));
        blockedResult.IsSuccess.Should().BeFalse();
        blockedResult.Error.Should().Contain("khóa");
    }

    [Fact]
    public async Task RefreshTokenAsync_Rotation_ShouldIssueNewToken_AndRevokeOldToken()
    {
        // Arrange
        var (service, context) = CreateTestService();
        var reg = await service.RegisterAsync(new RegisterRequestDto("refresh@example.com", "Secret123!", "Refresh User", null));
        var initialRefreshToken = reg.Data!.RefreshToken;

        // Act
        var refreshResult = await service.RefreshTokenAsync(new RefreshTokenRequestDto(initialRefreshToken));

        // Assert
        refreshResult.IsSuccess.Should().BeTrue();
        var newRefreshToken = refreshResult.Data!.RefreshToken;
        newRefreshToken.Should().NotBe(initialRefreshToken);

        // Verify in DB that old token is marked revoked and replaced
        var oldTokenInDb = await context.RefreshTokens.FirstAsync(rt => rt.Token == initialRefreshToken);
        oldTokenInDb.IsRevoked.Should().BeTrue();
        oldTokenInDb.RevokedAt.Should().NotBeNull();
        oldTokenInDb.ReplacedByToken.Should().Be(newRefreshToken);

        // New token is active
        var newTokenInDb = await context.RefreshTokens.FirstAsync(rt => rt.Token == newRefreshToken);
        newTokenInDb.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task RefreshTokenAsync_ReuseDetection_ShouldRevokeAllUserTokens_OnReuse()
    {
        // Arrange
        var (service, context) = CreateTestService();
        var reg = await service.RegisterAsync(new RegisterRequestDto("reuse@example.com", "Secret123!", "Reuse User", null));
        var firstRefreshToken = reg.Data!.RefreshToken;

        // Step 1: Normal legitimate refresh (token rotated)
        var firstRefresh = await service.RefreshTokenAsync(new RefreshTokenRequestDto(firstRefreshToken));
        firstRefresh.IsSuccess.Should().BeTrue();
        var legitimateActiveToken = firstRefresh.Data!.RefreshToken;

        // Step 2: Malicious attacker tries to REUSE the firstRefreshToken that was already revoked!
        var reuseAttackResult = await service.RefreshTokenAsync(new RefreshTokenRequestDto(firstRefreshToken));

        // Assert
        reuseAttackResult.IsSuccess.Should().BeFalse();
        reuseAttackResult.Error.Should().Contain("Cảnh báo bảo mật");

        // CRITICAL: ALL active tokens for this user must now be revoked due to reuse compromise!
        var activeTokens = await context.RefreshTokens
            .Where(rt => rt.UserId == reg.Data.User.Id && rt.RevokedAt == null)
            .ToListAsync();

        activeTokens.Should().BeEmpty();

        // The previously legitimate active token should also now be revoked
        var victimTokenInDb = await context.RefreshTokens.FirstAsync(rt => rt.Token == legitimateActiveToken);
        victimTokenInDb.IsRevoked.Should().BeTrue();
        victimTokenInDb.ReplacedByToken.Should().Be("REVOKED_DUE_TO_REUSE_DETECTION");
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenExpired_ShouldFail()
    {
        // Arrange
        var (service, context) = CreateTestService();
        var reg = await service.RegisterAsync(new RegisterRequestDto("expired-rt@example.com", "Secret123!", "Expired RT User", null));
        var tokenString = reg.Data!.RefreshToken;

        // Expire the token manually
        var tokenInDb = await context.RefreshTokens.FirstAsync(rt => rt.Token == tokenString);
        tokenInDb.ExpiresAt = DateTime.UtcNow.AddMinutes(-10);
        await context.SaveChangesAsync();

        // Act
        var result = await service.RefreshTokenAsync(new RefreshTokenRequestDto(tokenString));

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("hết hạn");
    }

    [Fact]
    public async Task LogoutAsync_ShouldRevokeUserRefreshTokens()
    {
        // Arrange
        var (service, context) = CreateTestService();
        var reg = await service.RegisterAsync(new RegisterRequestDto("logout@example.com", "Secret123!", "Logout User", null));
        var token = reg.Data!.RefreshToken;

        // Act
        var logoutResult = await service.LogoutAsync(reg.Data.User.Id, token);

        // Assert
        logoutResult.IsSuccess.Should().BeTrue();
        var tokenInDb = await context.RefreshTokens.FirstAsync(rt => rt.Token == token);
        tokenInDb.IsRevoked.Should().BeTrue();
        tokenInDb.ReplacedByToken.Should().Be("LOGGED_OUT");
    }

    [Fact]
    public async Task ForgotAndResetPassword_ShouldWork_AndBeSingleUse()
    {
        // Arrange
        var (service, context) = CreateTestService();
        await service.RegisterAsync(new RegisterRequestDto("forgot@example.com", "OldPassword123!", "Forgot User", null));

        // Act 1: Forgot Password
        var forgotResult = await service.ForgotPasswordAsync(new ForgotPasswordRequestDto("forgot@example.com"));
        forgotResult.IsSuccess.Should().BeTrue();

        var user = await context.Users.FirstAsync(u => u.Email == "forgot@example.com");
        var resetToken = user.PasswordResetToken;
        resetToken.Should().NotBeNullOrWhiteSpace();
        user.PasswordResetTokenExpiresAt.Should().BeAfter(DateTime.UtcNow);

        // Act 2: Reset Password with valid token
        var resetResult = await service.ResetPasswordAsync(new ResetPasswordRequestDto("forgot@example.com", resetToken!, "NewPassword123!"));
        resetResult.IsSuccess.Should().BeTrue();

        // Verify password updated in DB
        var updatedUser = await context.Users.FirstAsync(u => u.Email == "forgot@example.com");
        BCrypt.Net.BCrypt.Verify("NewPassword123!", updatedUser.PasswordHash).Should().BeTrue();
        updatedUser.PasswordResetToken.Should().BeNull(); // Single use: cleared!

        // Act 3: Try to reuse reset token again -> MUST FAIL!
        var reuseTokenResult = await service.ResetPasswordAsync(new ResetPasswordRequestDto("forgot@example.com", resetToken!, "AnotherPassword!"));
        reuseTokenResult.IsSuccess.Should().BeFalse();
        reuseTokenResult.Error.Should().Contain("không hợp lệ hoặc đã hết hạn");
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldValidateCurrentPassword_AndUpdate()
    {
        // Arrange
        var (service, context) = CreateTestService();
        var reg = await service.RegisterAsync(new RegisterRequestDto("change@example.com", "CurrentPass123!", "Change User", null));
        var userId = reg.Data!.User.Id;

        // Wrong current password -> fail
        var failResult = await service.ChangePasswordAsync(userId, new ChangePasswordRequestDto("WrongPass!", "NewPass123!"));
        failResult.IsSuccess.Should().BeFalse();
        failResult.Error.Should().Contain("hiện tại không chính xác");

        // Correct current password -> success
        var successResult = await service.ChangePasswordAsync(userId, new ChangePasswordRequestDto("CurrentPass123!", "NewPass123!"));
        successResult.IsSuccess.Should().BeTrue();

        // Verify in DB
        var userInDb = await context.Users.FirstAsync(u => u.Id == userId);
        BCrypt.Net.BCrypt.Verify("NewPass123!", userInDb.PasswordHash).Should().BeTrue();
    }
}
