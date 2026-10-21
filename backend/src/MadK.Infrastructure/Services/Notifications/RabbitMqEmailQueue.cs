using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;
using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace MadK.Infrastructure.Services.Notifications;

public class RabbitMqEmailQueue : IEmailQueue, IDisposable
{
    private readonly RabbitMqSettings _settings;
    private readonly ChannelEmailQueue _fallbackQueue;
    private readonly ILogger<RabbitMqEmailQueue> _logger;
    private IConnection? _connection;
    private IModel? _channel;
    private readonly bool _isInitialized;

    public RabbitMqEmailQueue(
        IOptions<RabbitMqSettings> options,
        ChannelEmailQueue fallbackQueue,
        ILogger<RabbitMqEmailQueue> logger)
    {
        _settings = options.Value;
        _fallbackQueue = fallbackQueue;
        _logger = logger;

        if (_settings.Enabled)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _settings.HostName,
                    Port = _settings.Port,
                    UserName = _settings.UserName,
                    Password = _settings.Password,
                    VirtualHost = _settings.VirtualHost,
                    DispatchConsumersAsync = true
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                _channel.QueueDeclare(
                    queue: _settings.QueueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                _isInitialized = true;
                _logger.LogInformation("Connected to RabbitMQ at {Host}:{Port}, Queue '{Queue}'",
                    _settings.HostName, _settings.Port, _settings.QueueName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to connect to RabbitMQ at {Host}:{Port}. Falling back to ChannelEmailQueue.",
                    _settings.HostName, _settings.Port);
                _isInitialized = false;
            }
        }
    }

    public async ValueTask EnqueueAsync(QueuedEmailMessage message, CancellationToken cancellationToken = default)
    {
        if (!_isInitialized || _channel == null || !_channel.IsOpen)
        {
            await _fallbackQueue.EnqueueAsync(message, cancellationToken);
            return;
        }

        try
        {
            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var props = _channel.CreateBasicProperties();
            props.Persistent = true;
            props.MessageId = message.Id.ToString();
            props.Type = message.MessageType;
            props.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

            lock (_channel)
            {
                _channel.BasicPublish(
                    exchange: string.Empty,
                    routingKey: _settings.QueueName,
                    basicProperties: props,
                    body: body);
            }

            _logger.LogDebug("Published email message {Id} to RabbitMQ queue '{Queue}'", message.Id, _settings.QueueName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish email to RabbitMQ. Falling back to in-memory channel.");
            await _fallbackQueue.EnqueueAsync(message, cancellationToken);
        }
    }

    public async IAsyncEnumerable<QueuedEmailMessage> DequeueAllAsync([EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        if (!_isInitialized || _channel == null || !_channel.IsOpen)
        {
            await foreach (var msg in _fallbackQueue.DequeueAllAsync(cancellationToken))
            {
                yield return msg;
            }
            yield break;
        }

        var bridgeChannel = Channel.CreateUnbounded<QueuedEmailMessage>();
        var consumer = new AsyncEventingBasicConsumer(_channel);

        consumer.Received += async (sender, ea) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                var message = JsonSerializer.Deserialize<QueuedEmailMessage>(json);
                if (message != null)
                {
                    await bridgeChannel.Writer.WriteAsync(message, cancellationToken);
                }
                _channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing RabbitMQ message with deliveryTag {DeliveryTag}", ea.DeliveryTag);
                _channel.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
            }
        };

        _channel.BasicConsume(queue: _settings.QueueName, autoAck: false, consumer: consumer);

        await foreach (var msg in bridgeChannel.Reader.ReadAllAsync(cancellationToken))
        {
            yield return msg;
        }
    }

    public void Dispose()
    {
        try { _channel?.Close(); } catch { }
        try { _connection?.Close(); } catch { }
        GC.SuppressFinalize(this);
    }
}
