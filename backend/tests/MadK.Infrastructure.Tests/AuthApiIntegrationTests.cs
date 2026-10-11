using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Auth;
using MadK.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadK.Infrastructure.Tests;

public class AuthApiTestFixture : WebApplicationFactory<Program>
{
    public string DbName { get; } = "AuthApiTestDb_" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(AppDbContext) ||
                d.ServiceType == typeof(Application.Interfaces.IAppDbContext)).ToList();

            foreach (var d in descriptors)
            {
                services.Remove(d);
            }

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(DbName);
            });
            services.AddScoped<Application.Interfaces.IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        });
    }
}

public class AuthApiIntegrationTests : IClassFixture<AuthApiTestFixture>
{
    private readonly HttpClient _client;
    private readonly AuthApiTestFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AuthApiIntegrationTests(AuthApiTestFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task FullAuthFlow_Register_VerifyEmail_Login_RefreshToken_GetMe_Logout_ShouldSucceed()
    {
        var testEmail = $"user_{Guid.NewGuid():N}@madkstore.vn";
        var testPassword = "Password123!";

        // 1. REGISTER
        var registerPayload = new RegisterRequestDto(testEmail, testPassword, "Nguyễn Văn Test", "0912345678");
        var regResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerPayload);
        regResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var regContent = await regResponse.Content.ReadFromJsonAsync<Result<AuthResponseDto>>(_jsonOptions);
        regContent.Should().NotBeNull();
        regContent!.IsSuccess.Should().BeTrue();
        regContent.Data!.User.Email.Should().Be(testEmail);
        regContent.Data.User.Roles.Should().Contain("Customer");
        regContent.Data.User.EmailConfirmed.Should().BeFalse();

        // Retrieve confirmation token from in-memory DB
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == testEmail);

            // 2. VERIFY EMAIL
            var verifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/verify-email", new VerifyEmailRequestDto(testEmail, user.EmailConfirmationToken!));
            verifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            var verifyResult = await verifyResponse.Content.ReadFromJsonAsync<Result>(_jsonOptions);
            verifyResult!.IsSuccess.Should().BeTrue();
        }

        // 3. LOGIN
        var loginPayload = new LoginRequestDto(testEmail, testPassword);
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", loginPayload);
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginContent = await loginResponse.Content.ReadFromJsonAsync<Result<AuthResponseDto>>(_jsonOptions);
        loginContent!.IsSuccess.Should().BeTrue();
        var accessToken = loginContent.Data!.AccessToken;
        var refreshToken = loginContent.Data.RefreshToken;
        accessToken.Should().NotBeNullOrWhiteSpace();
        refreshToken.Should().NotBeNullOrWhiteSpace();
        loginContent.Data.User.EmailConfirmed.Should().BeTrue();

        // 4. REFRESH TOKEN (Rotation)
        var refreshResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh-token", new RefreshTokenRequestDto(refreshToken));
        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var refreshContent = await refreshResponse.Content.ReadFromJsonAsync<Result<AuthResponseDto>>(_jsonOptions);
        refreshContent!.IsSuccess.Should().BeTrue();
        var newAccessToken = refreshContent.Data!.AccessToken;
        var newRefreshToken = refreshContent.Data.RefreshToken;
        newRefreshToken.Should().NotBe(refreshToken);

        // 5. GET /api/v1/auth/me (Protected endpoint with Bearer Token)
        using var authedRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        authedRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", newAccessToken);
        var meResponse = await _client.SendAsync(authedRequest);
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var meContent = await meResponse.Content.ReadFromJsonAsync<Result<UserDto>>(_jsonOptions);
        meContent!.IsSuccess.Should().BeTrue();
        meContent.Data!.Email.Should().Be(testEmail);
        meContent.Data.Roles.Should().Contain("Customer");

        // 6. LOGOUT
        var logoutResponse = await _client.PostAsJsonAsync("/api/v1/auth/logout", new RevokeTokenRequestDto(newRefreshToken));
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 7. Verify refresh token is revoked
        var postLogoutRefresh = await _client.PostAsJsonAsync("/api/v1/auth/refresh-token", new RefreshTokenRequestDto(newRefreshToken));
        postLogoutRefresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_WithoutToken_ShouldReturn401Unauthorized()
    {
        var response = await _client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
