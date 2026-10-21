using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;
using MadK.Domain.Interfaces;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services.Notifications;
using MadK.Infrastructure.Workers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MadK.Infrastructure;

/// <summary>
/// Registers all Infrastructure layer services into the DI container.
/// Called from the API layer's Program.cs.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // PostgreSQL + EF Core
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    // Retry on transient failures
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorCodesToAdd: null);
                }));

        // Register UnitOfWork & IAppDbContext
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IUnitOfWork>(provider =>
        {
            var context = provider.GetRequiredService<AppDbContext>();
            return new UnitOfWork(context);
        });

        // Identity Services
        services.AddSingleton<IPasswordHasher, MadK.Infrastructure.Services.PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, MadK.Infrastructure.Services.JwtTokenGenerator>();
        // Email Notification System (Queue, Templates, SMTP, Worker)
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.Configure<RabbitMqSettings>(configuration.GetSection(RabbitMqSettings.SectionName));
        services.AddSingleton<IEmailTemplateService, EmailTemplateService>();
        services.AddSingleton<ChannelEmailQueue>();
        services.AddSingleton<IEmailQueue, RabbitMqEmailQueue>();
        services.AddSingleton<ISmtpTransport, SmtpTransport>();
        services.AddScoped<IEmailSender, QueuedEmailSender>();
        services.AddHostedService<EmailNotificationWorker>();
        services.AddScoped<IIdentityService, MadK.Infrastructure.Services.IdentityService>();
        services.AddScoped<IAuditLogService, MadK.Infrastructure.Services.AuditLogService>();
        services.AddScoped<IAdminUserService, MadK.Infrastructure.Services.AdminUserService>();

        // Storage & Image Processing Services
        services.Configure<MadK.Application.DTOs.Catalog.StorageSettings>(
            configuration.GetSection(MadK.Application.DTOs.Catalog.StorageSettings.SectionName));
        var storageConfig = configuration.GetSection(MadK.Application.DTOs.Catalog.StorageSettings.SectionName)
            .Get<MadK.Application.DTOs.Catalog.StorageSettings>();
        if (storageConfig != null &&
            (storageConfig.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase) ||
             storageConfig.Provider.Equals("MinIO", StringComparison.OrdinalIgnoreCase)) &&
            storageConfig.S3 != null)
        {
            services.AddSingleton<Amazon.S3.IAmazonS3>(sp =>
            {
                var s3Config = new Amazon.S3.AmazonS3Config
                {
                    ServiceURL = storageConfig.S3.ServiceUrl,
                    ForcePathStyle = storageConfig.S3.ForcePathStyle
                };
                if (!string.IsNullOrEmpty(storageConfig.S3.Region))
                {
                    s3Config.AuthenticationRegion = storageConfig.S3.Region;
                }
                return new Amazon.S3.AmazonS3Client(storageConfig.S3.AccessKey ?? "minioadmin", storageConfig.S3.SecretKey ?? "minioadmin", s3Config);
            });
        }
        services.AddScoped<IStorageService, MadK.Infrastructure.Services.StorageService>();
        services.AddScoped<IAdminCatalogService, MadK.Infrastructure.Services.AdminCatalogService>();
        services.AddScoped<IPricingService, MadK.Infrastructure.Services.PricingService>();
        services.AddScoped<IReportingService, MadK.Infrastructure.Services.ReportingService>();

        // VNPay Payment Gateway
        services.Configure<MadK.Application.DTOs.Payment.VnpaySettings>(opt =>
        {
            configuration.GetSection(MadK.Application.DTOs.Payment.VnpaySettings.SectionName).Bind(opt);
            var envTmn = configuration["VNPAY_TMN_CODE"];
            if (!string.IsNullOrWhiteSpace(envTmn)) opt.TmnCode = envTmn;
            var envSecret = configuration["VNPAY_HASH_SECRET"];
            if (!string.IsNullOrWhiteSpace(envSecret)) opt.HashSecret = envSecret;
            var envUrl = configuration["VNPAY_URL"];
            if (!string.IsNullOrWhiteSpace(envUrl)) opt.BaseUrl = envUrl;
            var envReturn = configuration["VNPAY_RETURN_URL"];
            if (!string.IsNullOrWhiteSpace(envReturn)) opt.ReturnUrl = envReturn;
        });
        services.AddScoped<IVnpayService, MadK.Infrastructure.Services.VnpayService>();

        // Order Expiration & Stock Retention Worker
        services.AddScoped<IOrderExpirationService, MadK.Infrastructure.Services.OrderExpirationService>();
        services.AddHostedService<MadK.Infrastructure.Workers.OrderExpirationWorker>();

        // Returns & Refunds
        services.AddScoped<IReturnService, MadK.Infrastructure.Services.ReturnService>();

        // Promotions & Coupons
        services.AddScoped<ICouponService, MadK.Infrastructure.Services.CouponService>();

        // Shipping
        services.AddScoped<IShippingFeeService, MadK.Infrastructure.Services.StandardShippingFeeService>();

        return services;
    }
}

/// <summary>
/// UnitOfWork implementation wrapping AppDbContext.
/// </summary>
internal class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);

    public void Dispose()
        => _context.Dispose();
}
