namespace MadK.Application.Interfaces;

public interface IEmailSender
{
    Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default);
    Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default);
}
