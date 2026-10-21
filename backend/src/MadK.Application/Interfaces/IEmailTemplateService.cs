using MadK.Application.DTOs.Notifications;

namespace MadK.Application.Interfaces;

public interface IEmailTemplateService
{
    string RenderEmailConfirmation(string fullName, string confirmationToken);
    string RenderPasswordReset(string fullName, string resetToken, int expiryMinutes = 30);
    string RenderOrderConfirmation(OrderConfirmationEmailDto dto);
    string RenderOrderStatusChanged(OrderStatusChangedEmailDto dto);
}
