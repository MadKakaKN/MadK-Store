using MadK.Application.DTOs.Notifications;
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

    public Task SendOrderConfirmationAsync(OrderConfirmationEmailDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "════════════════════════════════════════════════════════════════════════════════\n" +
            " [MOCK EMAIL SERVICE] ORDER CONFIRMATION SENT\n" +
            " To: {Email} ({Name})\n" +
            " Order: #{OrderNumber}, Total: {Total:N0}đ\n" +
            "════════════════════════════════════════════════════════════════════════════════",
            dto.RecipientEmail, dto.RecipientName, dto.OrderNumber, dto.TotalAmount);

        return Task.CompletedTask;
    }

    public Task SendOrderStatusChangedAsync(OrderStatusChangedEmailDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "════════════════════════════════════════════════════════════════════════════════\n" +
            " [MOCK EMAIL SERVICE] ORDER STATUS CHANGED SENT\n" +
            " To: {Email} ({Name})\n" +
            " Order: #{OrderNumber}, Status: {OldStatus} -> {NewStatus}\n" +
            "════════════════════════════════════════════════════════════════════════════════",
            dto.RecipientEmail, dto.RecipientName, dto.OrderNumber, dto.OldStatus, dto.NewStatus);

        return Task.CompletedTask;
    }

    public Task SendRawEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "════════════════════════════════════════════════════════════════════════════════\n" +
            " [MOCK EMAIL SERVICE] RAW EMAIL SENT\n" +
            " To: {Email}, Subject: {Subject}\n" +
            "════════════════════════════════════════════════════════════════════════════════",
            toEmail, subject);

        return Task.CompletedTask;
    }
}
