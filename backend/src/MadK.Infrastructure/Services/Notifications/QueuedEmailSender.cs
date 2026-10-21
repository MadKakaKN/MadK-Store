using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services.Notifications;

public class QueuedEmailSender : IEmailSender
{
    private readonly IEmailQueue _emailQueue;
    private readonly IEmailTemplateService _templateService;
    private readonly ILogger<QueuedEmailSender> _logger;

    public QueuedEmailSender(
        IEmailQueue emailQueue,
        IEmailTemplateService templateService,
        ILogger<QueuedEmailSender> logger)
    {
        _emailQueue = emailQueue;
        _templateService = templateService;
        _logger = logger;
    }

    public async Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
    {
        try
        {
            var html = _templateService.RenderEmailConfirmation(fullName, token);
            var message = new QueuedEmailMessage
            {
                ToEmail = toEmail.Trim(),
                RecipientName = fullName,
                Subject = "Xác thực tài khoản MadK Store",
                HtmlBody = html,
                PlainTextBody = $"Xin chào {fullName}, mã xác thực tài khoản của bạn là: {token}",
                MessageType = "EmailConfirmation"
            };

            await _emailQueue.EnqueueAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đưa email xác thực vào hàng đợi cho {ToEmail}", toEmail);
        }
    }

    public async Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
    {
        try
        {
            var html = _templateService.RenderPasswordReset(fullName, token);
            var message = new QueuedEmailMessage
            {
                ToEmail = toEmail.Trim(),
                RecipientName = fullName,
                Subject = "Yêu cầu đặt lại mật khẩu - MadK Store",
                HtmlBody = html,
                PlainTextBody = $"Xin chào {fullName}, mã đặt lại mật khẩu của bạn là: {token} (có hiệu lực trong 30 phút).",
                MessageType = "PasswordReset"
            };

            await _emailQueue.EnqueueAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đưa email đặt lại mật khẩu vào hàng đợi cho {ToEmail}", toEmail);
        }
    }

    public async Task SendOrderConfirmationAsync(OrderConfirmationEmailDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var html = _templateService.RenderOrderConfirmation(dto);
            var message = new QueuedEmailMessage
            {
                ToEmail = dto.RecipientEmail.Trim(),
                RecipientName = dto.RecipientName,
                Subject = $"Xác nhận đơn hàng #{dto.OrderNumber} - MadK Store",
                HtmlBody = html,
                PlainTextBody = $"Cảm ơn bạn đã đặt hàng tại MadK Store! Mã đơn hàng: #{dto.OrderNumber}, Tổng tiền: {dto.TotalAmount:N0} đ.",
                MessageType = "OrderConfirmation"
            };
            message.Metadata["OrderNumber"] = dto.OrderNumber;

            await _emailQueue.EnqueueAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đưa email xác nhận đơn hàng #{OrderNumber} vào hàng đợi cho {ToEmail}",
                dto.OrderNumber, dto.RecipientEmail);
        }
    }

    public async Task SendOrderStatusChangedAsync(OrderStatusChangedEmailDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var html = _templateService.RenderOrderStatusChanged(dto);
            var message = new QueuedEmailMessage
            {
                ToEmail = dto.RecipientEmail.Trim(),
                RecipientName = dto.RecipientName,
                Subject = $"Cập nhật trạng thái đơn hàng #{dto.OrderNumber} - MadK Store",
                HtmlBody = html,
                PlainTextBody = $"Đơn hàng #{dto.OrderNumber} của bạn đã chuyển sang trạng thái: {dto.NewStatus}.",
                MessageType = "OrderStatusChanged"
            };
            message.Metadata["OrderNumber"] = dto.OrderNumber;

            await _emailQueue.EnqueueAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đưa email cập nhật trạng thái đơn #{OrderNumber} vào hàng đợi cho {ToEmail}",
                dto.OrderNumber, dto.RecipientEmail);
        }
    }

    public async Task SendRawEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var message = new QueuedEmailMessage
            {
                ToEmail = toEmail.Trim(),
                Subject = subject,
                HtmlBody = htmlBody,
                PlainTextBody = plainTextBody,
                MessageType = "Raw"
            };

            await _emailQueue.EnqueueAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đưa email '{Subject}' vào hàng đợi cho {ToEmail}", subject, toEmail);
        }
    }
}
