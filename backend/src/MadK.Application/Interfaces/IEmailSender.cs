using MadK.Application.DTOs.Notifications;

namespace MadK.Application.Interfaces;

public interface IEmailSender
{
    Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default);
    Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default);
    Task SendOrderConfirmationAsync(OrderConfirmationEmailDto dto, CancellationToken cancellationToken = default);
    Task SendOrderStatusChangedAsync(OrderStatusChangedEmailDto dto, CancellationToken cancellationToken = default);
    Task SendRawEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null, CancellationToken cancellationToken = default);
}
