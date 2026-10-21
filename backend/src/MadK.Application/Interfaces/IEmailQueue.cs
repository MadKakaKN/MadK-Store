using MadK.Application.DTOs.Notifications;

namespace MadK.Application.Interfaces;

public interface IEmailQueue
{
    ValueTask EnqueueAsync(QueuedEmailMessage message, CancellationToken cancellationToken = default);
    IAsyncEnumerable<QueuedEmailMessage> DequeueAllAsync(CancellationToken cancellationToken = default);
}
