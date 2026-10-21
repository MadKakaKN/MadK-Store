using System.Net;
using System.Net.Mail;
using System.Text;
using MadK.Application.DTOs.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MadK.Infrastructure.Services.Notifications;

public interface ISmtpTransport
{
    Task SendAsync(QueuedEmailMessage message, CancellationToken cancellationToken = default);
}

public class SmtpTransport : ISmtpTransport
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpTransport> _logger;

    public SmtpTransport(
        IOptions<EmailSettings> options,
        IConfiguration configuration,
        ILogger<SmtpTransport> logger)
    {
        _logger = logger;
        _settings = options.Value ?? new EmailSettings();

        // Ưu tiên đọc biến môi trường trực tiếp nếu có
        var envHost = configuration["SMTP_HOST"] ?? Environment.GetEnvironmentVariable("SMTP_HOST");
        if (!string.IsNullOrWhiteSpace(envHost)) _settings.Host = envHost;

        var envPort = configuration["SMTP_PORT"] ?? Environment.GetEnvironmentVariable("SMTP_PORT");
        if (int.TryParse(envPort, out var p)) _settings.Port = p;

        var envUser = configuration["SMTP_USERNAME"] ?? Environment.GetEnvironmentVariable("SMTP_USERNAME");
        if (!string.IsNullOrWhiteSpace(envUser)) _settings.Username = envUser;

        var envPass = configuration["SMTP_PASSWORD"] ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        if (!string.IsNullOrWhiteSpace(envPass)) _settings.Password = envPass;

        var envSsl = configuration["SMTP_ENABLE_SSL"] ?? Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL");
        if (bool.TryParse(envSsl, out var ssl)) _settings.EnableSsl = ssl;

        var envFrom = configuration["SMTP_FROM_EMAIL"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL");
        if (!string.IsNullOrWhiteSpace(envFrom)) _settings.FromEmail = envFrom;

        var envFromName = configuration["SMTP_FROM_NAME"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_NAME");
        if (!string.IsNullOrWhiteSpace(envFromName)) _settings.FromName = envFromName;
    }

    public async Task SendAsync(QueuedEmailMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);

        if (_settings.UseMock)
        {
            _logger.LogInformation("[MOCK SMTP] Simulated email to: {ToEmail}, Subject: '{Subject}'",
                message.ToEmail, message.Subject);
            return;
        }

        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = _settings.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = string.IsNullOrWhiteSpace(_settings.Username),
            Timeout = 10000 // 10s
        };

        if (!string.IsNullOrWhiteSpace(_settings.Username) && !string.IsNullOrWhiteSpace(_settings.Password))
        {
            client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);
        }

        var fromAddress = new MailAddress(_settings.FromEmail, _settings.FromName, Encoding.UTF8);
        var toAddress = new MailAddress(message.ToEmail, message.RecipientName, Encoding.UTF8);

        using var mail = new MailMessage(fromAddress, toAddress)
        {
            Subject = message.Subject,
            SubjectEncoding = Encoding.UTF8,
            Body = message.HtmlBody,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = true
        };

        if (!string.IsNullOrWhiteSpace(message.PlainTextBody))
        {
            var plainView = AlternateView.CreateAlternateViewFromString(message.PlainTextBody, Encoding.UTF8, "text/plain");
            mail.AlternateViews.Add(plainView);
        }

        _logger.LogDebug("Connecting to SMTP server at {Host}:{Port} (SSL: {Ssl}) to send email to {ToEmail}",
            _settings.Host, _settings.Port, _settings.EnableSsl, message.ToEmail);

        await client.SendMailAsync(mail, cancellationToken);
    }
}
