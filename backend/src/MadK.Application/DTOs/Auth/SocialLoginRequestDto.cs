namespace MadK.Application.DTOs.Auth;

public class SocialLoginRequestDto
{
    /// <summary>
    /// Tên nhà cung cấp xác thực xã hội: "Google", "GitHub", "Facebook"
    /// </summary>
    public string Provider { get; set; } = "Google";

    /// <summary>
    /// ID Token hoặc Access Token nhận từ nhà cung cấp OAuth
    /// </summary>
    public string? IdToken { get; set; }

    public string? AccessToken { get; set; }

    /// <summary>
    /// Địa chỉ email được xác thực bởi nhà cung cấp
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Họ và tên người dùng từ tài khoản mạng xã hội
    /// </summary>
    public string? FullName { get; set; }

    /// <summary>
    /// Link ảnh đại diện từ mạng xã hội
    /// </summary>
    public string? AvatarUrl { get; set; }
}
