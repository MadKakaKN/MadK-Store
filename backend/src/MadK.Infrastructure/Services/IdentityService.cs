using MadK.Application.Common;
using MadK.Application.DTOs.Auth;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly IAppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<IdentityService> _logger;

    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;

    public IdentityService(
        IAppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailSender emailSender,
        ILogger<IdentityService> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<Result<AuthResponseDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _dbContext.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            return Result<AuthResponseDto>.Failure("Email đã được sử dụng bởi một tài khoản khác.");
        }

        // Ensure default 'Customer' role exists
        var customerRole = await _dbContext.Roles
            .FirstOrDefaultAsync(r => r.Name == "Customer", cancellationToken);

        if (customerRole == null)
        {
            customerRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = "Customer",
                Description = "Khách hàng mua sắm mặc định",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Roles.Add(customerRole);
        }

        var confirmationToken = Guid.NewGuid().ToString("N");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            IsActive = true,
            EmailConfirmed = false,
            EmailConfirmationToken = confirmationToken,
            EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
            FailedLoginAttempts = 0,
            CreatedAt = DateTime.UtcNow
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = customerRole.Id,
            User = user,
            Role = customerRole
        });

        _dbContext.Users.Add(user);

        // Generate tokens
        var roles = new List<string> { customerRole.Name };
        var permissions = new List<string>();

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles, permissions);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken(user.Id);

        _dbContext.RefreshTokens.Add(refreshToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Send mock email asynchronously
        try
        {
            await _emailSender.SendEmailConfirmationAsync(user.Email, user.FullName, confirmationToken, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gửi email xác thực tài khoản {Email}", user.Email);
        }

        var userDto = MapToUserDto(user, roles, permissions);
        var response = new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken.Token,
            ExpiresIn: _jwtTokenGenerator.GetAccessTokenExpirySeconds(),
            User: userDto
        );

        return Result<AuthResponseDto>.Success(response, "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực tài khoản.");
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null)
        {
            return Result<AuthResponseDto>.Failure("Email hoặc mật khẩu không chính xác.");
        }

        if (user.IsLockedOut)
        {
            var remainingMinutes = (int)Math.Ceiling((user.LockoutEnd!.Value - DateTime.UtcNow).TotalMinutes);
            return Result<AuthResponseDto>.Failure($"Tài khoản bị tạm khóa do nhập sai mật khẩu nhiều lần. Vui lòng thử lại sau {remainingMinutes} phút.");
        }

        if (!user.IsActive)
        {
            return Result<AuthResponseDto>.Failure("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ bộ phận hỗ trợ.");
        }

        var isValidPassword = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isValidPassword)
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                _logger.LogWarning("Tài khoản {Email} bị khóa tạm {Minutes} phút sau {Attempts} lần nhập sai.", user.Email, LockoutMinutes, user.FailedLoginAttempts);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Result<AuthResponseDto>.Failure("Email hoặc mật khẩu không chính xác.");
        }

        // Reset failed login attempts on successful login
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles, permissions);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken(user.Id);

        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var userDto = MapToUserDto(user, roles, permissions);
        var response = new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken.Token,
            ExpiresIn: _jwtTokenGenerator.GetAccessTokenExpirySeconds(),
            User: userDto
        );

        return Result<AuthResponseDto>.Success(response, "Đăng nhập thành công.");
    }

    public async Task<Result<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default)
    {
        var existingToken = await _dbContext.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken);

        if (existingToken == null)
        {
            return Result<AuthResponseDto>.Failure("Refresh token không hợp lệ.");
        }

        // Reuse detection: If token was already revoked, someone is reusing an old/stolen token!
        if (existingToken.IsRevoked)
        {
            _logger.LogWarning("Phát hiện tái sử dụng Refresh Token bị thu hồi cho UserId: {UserId}! Tiến hành thu hồi toàn bộ phiên.", existingToken.UserId);

            var activeTokens = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == existingToken.UserId && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var t in activeTokens)
            {
                t.RevokedAt = DateTime.UtcNow;
                t.ReplacedByToken = "REVOKED_DUE_TO_REUSE_DETECTION";
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return Result<AuthResponseDto>.Failure("Cảnh báo bảo mật: Refresh token đã bị thu hồi trước đó. Toàn bộ phiên đăng nhập đã bị vô hiệu hóa vì lý do an toàn.");
        }

        if (existingToken.IsExpired)
        {
            return Result<AuthResponseDto>.Failure("Refresh token đã hết hạn. Vui lòng đăng nhập lại.");
        }

        var user = existingToken.User;
        if (!user.IsActive || user.IsLockedOut)
        {
            return Result<AuthResponseDto>.Failure("Tài khoản không hợp lệ hoặc đã bị khóa.");
        }

        // Rotate token
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken(user.Id);
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.ReplacedByToken = newRefreshToken.Token;

        _dbContext.RefreshTokens.Add(newRefreshToken);

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();

        var newAccessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles, permissions);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var userDto = MapToUserDto(user, roles, permissions);
        var response = new AuthResponseDto(
            AccessToken: newAccessToken,
            RefreshToken: newRefreshToken.Token,
            ExpiresIn: _jwtTokenGenerator.GetAccessTokenExpirySeconds(),
            User: userDto
        );

        return Result<AuthResponseDto>.Success(response, "Làm mới phiên đăng nhập thành công.");
    }

    public async Task<Result> LogoutAsync(Guid userId, string? refreshToken = null, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var token = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

            if (token != null && token.RevokedAt == null)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.ReplacedByToken = "LOGGED_OUT";
            }
        }
        else if (userId != Guid.Empty)
        {
            var activeTokens = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var t in activeTokens)
            {
                t.RevokedAt = DateTime.UtcNow;
                t.ReplacedByToken = "LOGGED_OUT";
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success("Đăng xuất thành công.");
    }

    public async Task<Result> VerifyEmailAsync(VerifyEmailRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null)
        {
            return Result.Failure("Thông tin xác thực không hợp lệ.");
        }

        if (user.EmailConfirmed)
        {
            return Result.Success("Email của bạn đã được xác thực trước đó.");
        }

        if (string.IsNullOrWhiteSpace(user.EmailConfirmationToken) || user.EmailConfirmationToken != request.Token.Trim())
        {
            return Result.Failure("Mã xác thực email không chính xác.");
        }

        if (!user.EmailConfirmationTokenExpiresAt.HasValue || DateTime.UtcNow > user.EmailConfirmationTokenExpiresAt.Value)
        {
            return Result.Failure("Mã xác thực email đã hết hạn. Vui lòng yêu cầu mã xác thực mới.");
        }

        user.EmailConfirmed = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpiresAt = null;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success("Xác thực email thành công! Bạn có thể tiếp tục sử dụng đầy đủ tính năng hệ thống.");
    }

    public async Task<Result> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user != null && user.IsActive)
        {
            var resetToken = Guid.NewGuid().ToString("N");
            user.PasswordResetToken = resetToken;
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);

            await _dbContext.SaveChangesAsync(cancellationToken);

            try
            {
                await _emailSender.SendPasswordResetAsync(user.Email, user.FullName, resetToken, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi email đặt lại mật khẩu cho {Email}", user.Email);
            }
        }

        // Anti-enumeration: always return success message regardless of email existence
        return Result.Success("Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hòm thư của bạn.");
    }

    public async Task<Result> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null)
        {
            return Result.Failure("Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }

        if (string.IsNullOrWhiteSpace(user.PasswordResetToken) || user.PasswordResetToken != request.Token.Trim())
        {
            return Result.Failure("Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }

        if (!user.PasswordResetTokenExpiresAt.HasValue || DateTime.UtcNow > user.PasswordResetTokenExpiresAt.Value)
        {
            return Result.Failure("Mã đặt lại mật khẩu đã hết hạn.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        // Revoke all existing refresh tokens for security
        var activeTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var t in activeTokens)
        {
            t.RevokedAt = DateTime.UtcNow;
            t.ReplacedByToken = "PASSWORD_RESET";
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.");
    }

    public async Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return Result.Failure("Tài khoản người dùng không tồn tại.");
        }

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return Result.Failure("Mật khẩu hiện tại không chính xác.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);

        // Revoke other active sessions
        var activeTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var t in activeTokens)
        {
            t.RevokedAt = DateTime.UtcNow;
            t.ReplacedByToken = "PASSWORD_CHANGED";
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success("Đổi mật khẩu thành công.");
    }

    public async Task<Result<UserDto>> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return Result<UserDto>.Failure("Không tìm thấy thông tin tài khoản người dùng.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();

        var userDto = MapToUserDto(user, roles, permissions);
        return Result<UserDto>.Success(userDto);
    }

    private static UserDto MapToUserDto(User user, List<string> roles, List<string> permissions)
    {
        return new UserDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            AvatarUrl: user.AvatarUrl,
            IsActive: user.IsActive,
            EmailConfirmed: user.EmailConfirmed,
            Roles: roles,
            Permissions: permissions
        );
    }
}
