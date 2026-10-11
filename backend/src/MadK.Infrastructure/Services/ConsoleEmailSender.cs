using MadK.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "════════════════════════════════════════════════════════════════════════════════\n" +
            " [MOCK EMAIL SERVICE] EMAIL VERIFICATION SENT\n" +
            " To: {Email} ({FullName})\n" +
            " Token: {Token}\n" +
            " Verification Action: POST /api/v1/auth/verify-email with {{ \"email\": \"{Email}\", \"token\": \"{Token}\" }}\n" +
            "════════════════════════════════════════════════════════════════════════════════",
            toEmail, fullName, token, toEmail, token);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "════════════════════════════════════════════════════════════════════════════════\n" +
            " [MOCK EMAIL SERVICE] PASSWORD RESET REQUESTED\n" +
            " To: {Email} ({FullName})\n" +
            " Reset Token: {Token}\n" +
            " Reset Action: POST /api/v1/auth/reset-password with {{ \"email\": \"{Email}\", \"token\": \"{Token}\", \"newPassword\": \"...\" }}\n" +
            "════════════════════════════════════════════════════════════════════════════════",
            toEmail, fullName, token, toEmail, token);

        return Task.CompletedTask;
    }
}
