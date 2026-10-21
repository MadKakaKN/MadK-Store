using System.Threading.Channels;
using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services.Notifications;

public class ChannelEmailQueue : IEmailQueue
{
    private readonly Channel<QueuedEmailMessage> _channel;
    private readonly ILogger<ChannelEmailQueue> _logger;

    public ChannelEmailQueue(ILogger<ChannelEmailQueue> logger, int capacity = 1000)
    {
        _logger = logger;
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = false,
            SingleWriter = false
        };
        _channel = Channel.CreateBounded<QueuedEmailMessage>(options);
    }

    public async ValueTask EnqueueAsync(QueuedEmailMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);

        _logger.LogDebug("Enqueueing email to {ToEmail} with subject '{Subject}' [Id={Id}]",
            message.ToEmail, message.Subject, message.Id);

        await _channel.Writer.WriteAsync(message, cancellationToken);
    }

    public IAsyncEnumerable<QueuedEmailMessage> DequeueAllAsync(CancellationToken cancellationToken = default)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
