using MadK.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Workers;

/// <summary>
/// Worker chạy nền (BackgroundService / IHostedService) định kỳ quét các đơn hàng
/// quá hạn thanh toán để tự động hủy đơn và giải phóng tồn kho đã giữ.
/// </summary>
public class OrderExpirationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrderExpirationWorker> _logger;

    public OrderExpirationWorker(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<OrderExpirationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Đọc cấu hình chu kỳ quét (mặc định 60 giây)
        bool isEnabled = _configuration.GetValue<bool>("OrderExpiration:Enabled", true);
        int intervalSeconds = _configuration.GetValue<int>("OrderExpiration:IntervalSeconds", 60);

        if (!isEnabled)
        {
            _logger.LogInformation("OrderExpirationWorker is disabled by configuration.");
            return;
        }

        _logger.LogInformation("OrderExpirationWorker started. Polling interval: {Interval}s", intervalSeconds);

        // Đợi 5 giây sau khi ứng dụng khởi động trước khi thực hiện lần quét đầu tiên
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var expirationService = scope.ServiceProvider.GetRequiredService<IOrderExpirationService>();

                int cancelled = await expirationService.CancelExpiredOrdersAsync(stoppingToken);
                if (cancelled > 0)
                {
                    _logger.LogInformation("OrderExpirationWorker completed cycle: Cancelled {Count} expired orders.", cancelled);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during OrderExpirationWorker execution.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("OrderExpirationWorker has stopped gracefully.");
    }
}
