using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Auth;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;

    public AuthController(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    /// <summary>
    /// Đăng ký tài khoản người dùng mới (Mặc định gán vai trò Customer, gửi email xác thực).
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request, CancellationToken ct)
    {
        var result = await _identityService.RegisterAsync(request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Đăng nhập tài khoản, xác thực mật khẩu BCrypt, kiểm tra khóa tạm và cấp JWT + Refresh token xoay vòng.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("auth-login")]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var result = await _identityService.LoginAsync(request, ct);
        if (!result.IsSuccess)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Đăng nhập / đăng ký tự động qua tài khoản mạng xã hội (Google, GitHub, Facebook...).
    /// </summary>
    [HttpPost("social-login")]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequestDto request, CancellationToken ct)
    {
        var result = await _identityService.SocialLoginAsync(request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Làm mới access token bằng refresh token xoay vòng kèm cơ chế phát hiện tái sử dụng trái phép (Token Reuse Detection).
    /// </summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request, CancellationToken ct)
    {
        var result = await _identityService.RefreshTokenAsync(request, ct);
        if (!result.IsSuccess)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Đăng xuất tài khoản và thu hồi refresh token của phiên hiện tại.
    /// </summary>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RevokeTokenRequestDto? request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _identityService.LogoutAsync(userId, request?.RefreshToken, ct);
        return Ok(result);
    }

    /// <summary>
    /// Xác thực email qua Token (POST).
    /// </summary>
    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmailPost([FromBody] VerifyEmailRequestDto request, CancellationToken ct)
    {
        var result = await _identityService.VerifyEmailAsync(request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Xác thực email qua link trực tiếp (GET).
    /// </summary>
    [HttpGet("verify-email")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmailGet([FromQuery] string email, [FromQuery] string token, CancellationToken ct)
    {
        var request = new VerifyEmailRequestDto(email, token);
        var result = await _identityService.VerifyEmailAsync(request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Yêu cầu đặt lại mật khẩu khi quên (Chống dò quét tài khoản, gửi token có hạn qua email).
    /// </summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth-reset-password")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request, CancellationToken ct)
    {
        var result = await _identityService.ForgotPasswordAsync(request, ct);
        return Ok(result);
    }

    /// <summary>
    /// Đặt lại mật khẩu bằng token một lần có hạn (Reset Password).
    /// </summary>
    [HttpPost("reset-password")]
    [EnableRateLimiting("auth-reset-password")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request, CancellationToken ct)
    {
        var result = await _identityService.ResetPasswordAsync(request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Đổi mật khẩu cho người dùng đã đăng nhập (Yêu cầu JWT Bearer).
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _identityService.ChangePasswordAsync(userId, request, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin tài khoản, danh sách vai trò và quyền hạn hiện tại (Yêu cầu JWT Bearer).
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<UserDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(Result<UserDto>.Failure("Không xác định được phiên người dùng."));
        }

        var result = await _identityService.GetCurrentUserAsync(userId, ct);
        if (!result.IsSuccess)
        {
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
