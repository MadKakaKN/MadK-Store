using System.ComponentModel.DataAnnotations;

namespace MadK.Application.DTOs.Auth;

public record RegisterRequestDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")] string Password,
    [Required, MinLength(2, ErrorMessage = "Họ tên phải có ít nhất 2 ký tự.")] string FullName,
    string? PhoneNumber
);

public record LoginRequestDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RefreshTokenRequestDto(
    [Required] string RefreshToken
);

public record VerifyEmailRequestDto(
    [Required, EmailAddress] string Email,
    [Required] string Token
);

public record ForgotPasswordRequestDto(
    [Required, EmailAddress] string Email
);

public record ResetPasswordRequestDto(
    [Required, EmailAddress] string Email,
    [Required] string Token,
    [Required, MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")] string NewPassword
);

public record ChangePasswordRequestDto(
    [Required] string CurrentPassword,
    [Required, MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")] string NewPassword
);

public record RevokeTokenRequestDto(
    string? RefreshToken
);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    string? AvatarUrl,
    bool IsActive,
    bool EmailConfirmed,
    List<string> Roles,
    List<string> Permissions
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserDto User
);
