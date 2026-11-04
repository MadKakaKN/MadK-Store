using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Workers;

/// <summary>
/// Worker chạy nền (BackgroundService) định kỳ dọn dẹp các giỏ hàng của khách vãng lai
/// (UserId == null) bị bỏ quên quá 30 ngày, giúp giải phóng dung lượng Database.
/// </summary>
public class CartCleanupWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CartCleanupWorker> _logger;

    public CartCleanupWorker(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<CartCleanupWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        bool isEnabled = _configuration.GetValue<bool>("CartCleanup:Enabled", true);
        int intervalHours = _configuration.GetValue<int>("CartCleanup:IntervalHours", 6);
        int retentionDays = _configuration.GetValue<int>("CartCleanup:RetentionDays", 30);

        if (!isEnabled)
        {
            _logger.LogInformation("CartCleanupWorker is disabled by configuration.");
            return;
        }

        _logger.LogInformation("CartCleanupWorker started. Polling interval: {Interval}h, Retention: {Days} days", intervalHours, retentionDays);

        // Chờ 30 giây sau khi ứng dụng khởi động
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
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
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

                // Dọn dẹp giỏ hàng khách vãng lai không hoạt động quá hạn
                int deletedCount = await dbContext.Carts
                    .Where(c => c.UserId == null && (c.UpdatedAt ?? c.CreatedAt) < cutoff)
                    .ExecuteDeleteAsync(stoppingToken);

                if (deletedCount > 0)
                {
                    _logger.LogInformation("CartCleanupWorker: Cleaned up {Count} abandoned guest carts older than {Cutoff:yyyy-MM-dd}",
                        deletedCount, cutoff);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error occurred during guest cart cleanup execution.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
