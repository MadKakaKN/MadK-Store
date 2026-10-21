using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using MadK.Infrastructure.Services.Notifications;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MadK.Infrastructure.Workers;

/// <summary>
/// Worker chạy nền (BackgroundService) tiêu thụ hàng đợi email (RabbitMQ hoặc Channel),
/// thực hiện gửi qua SMTP với cơ chế retry lũy tiến có giới hạn và ghi log lỗi đầy đủ.
/// </summary>
public class EmailNotificationWorker : BackgroundService
{
    private readonly IEmailQueue _emailQueue;
    private readonly ISmtpTransport _smtpTransport;
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailNotificationWorker> _logger;

    public EmailNotificationWorker(
        IEmailQueue emailQueue,
        ISmtpTransport smtpTransport,
        IOptions<EmailSettings> options,
        ILogger<EmailNotificationWorker> logger)
    {
        _emailQueue = emailQueue;
        _smtpTransport = smtpTransport;
        _settings = options.Value ?? new EmailSettings();
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailNotificationWorker started. MaxRetries={MaxRetries}, BaseDelayMs={BaseDelayMs}",
            _settings.MaxRetries, _settings.RetryBaseDelayMs);

        try
        {
            await foreach (var message in _emailQueue.DequeueAllAsync(stoppingToken))
            {
                if (stoppingToken.IsCancellationRequested)
                    break;

                await ProcessEmailWithRetryAsync(message, stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("EmailNotificationWorker is stopping due to host shutdown.");
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "Fatal error in EmailNotificationWorker loop: {Message}", ex.Message);
        }
    }

    public async Task<bool> ProcessEmailWithRetryAsync(QueuedEmailMessage message, CancellationToken cancellationToken)
    {
        int maxRetries = Math.Max(1, _settings.MaxRetries);
        int baseDelay = Math.Max(100, _settings.RetryBaseDelayMs);

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                _logger.LogInformation("[EmailWorker] Sending '{Subject}' to <{ToEmail}> (Attempt {Attempt}/{MaxRetries}) [MsgId={Id}]",
                    message.Subject, message.ToEmail, attempt, maxRetries, message.Id);

                await _smtpTransport.SendAsync(message, cancellationToken);

                _logger.LogInformation("[EmailWorker] Successfully sent '{Subject}' to <{ToEmail}> [MsgId={Id}]",
                    message.Subject, message.ToEmail, message.Id);

                return true;
            }
            catch (Exception ex)
            {
                message.RetryCount = attempt;

                if (attempt < maxRetries)
                {
                    int delayMs = (int)(baseDelay * Math.Pow(2, attempt - 1));
                    _logger.LogWarning(ex,
                        "[EmailWorker] Failed attempt {Attempt}/{MaxRetries} sending to <{ToEmail}>. Retrying in {DelayMs}ms... Error: {Error}",
                        attempt, maxRetries, message.ToEmail, delayMs, ex.Message);

                    try
                    {
                        await Task.Delay(delayMs, cancellationToken);
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogWarning("[EmailWorker] Retry cancelled for <{ToEmail}> due to shutdown.", message.ToEmail);
                        return false;
                    }
                }
                else
                {
                    _logger.LogError(ex,
                        "[EmailWorker] EXCEEDED MAX RETRIES ({MaxRetries}) for email '{Subject}' to <{ToEmail}> [MsgId={Id}]. Message dead-lettered / discarded. Error: {Error}",
                        maxRetries, message.Subject, message.ToEmail, message.Id, ex.Message);
                    return false;
                }
            }
        }

        return false;
    }
}
