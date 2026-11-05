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
        var connectionString = ResolveConnectionString(configuration.GetConnectionString("DefaultConnection"));
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                connectionString,
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
        services.AddSingleton<IExcelExportService, MadK.Infrastructure.Services.ExcelExportService>();
        services.AddScoped<IProductReviewService, MadK.Infrastructure.Services.ProductReviewService>();
        services.AddScoped<IWishlistService, MadK.Infrastructure.Services.WishlistService>();

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

        // MoMo All-In-One Payment Gateway
        services.Configure<MadK.Application.DTOs.Payment.MomoSettings>(opt =>
        {
            configuration.GetSection(MadK.Application.DTOs.Payment.MomoSettings.SectionName).Bind(opt);
            var envPartner = configuration["MOMO_PARTNER_CODE"];
            if (!string.IsNullOrWhiteSpace(envPartner)) opt.PartnerCode = envPartner;
            var envAccess = configuration["MOMO_ACCESS_KEY"];
            if (!string.IsNullOrWhiteSpace(envAccess)) opt.AccessKey = envAccess;
            var envSecret = configuration["MOMO_SECRET_KEY"];
            if (!string.IsNullOrWhiteSpace(envSecret)) opt.SecretKey = envSecret;
            var envEndpoint = configuration["MOMO_ENDPOINT"];
            if (!string.IsNullOrWhiteSpace(envEndpoint)) opt.Endpoint = envEndpoint;
            var envReturn = configuration["MOMO_RETURN_URL"];
            if (!string.IsNullOrWhiteSpace(envReturn)) opt.ReturnUrl = envReturn;
            var envIpn = configuration["MOMO_IPN_URL"];
            if (!string.IsNullOrWhiteSpace(envIpn)) opt.IpnUrl = envIpn;
        });
        services.AddHttpClient<IMomoService, MadK.Infrastructure.Services.MomoService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        // VietQR / SePAY Bank Transfer Webhook Service
        services.Configure<MadK.Application.DTOs.Payment.BankTransferSettings>(
            configuration.GetSection(MadK.Application.DTOs.Payment.BankTransferSettings.SectionName));
        services.AddScoped<IBankTransferService, MadK.Infrastructure.Services.BankTransferService>();

        // Telegram Bot Notification Service
        services.Configure<TelegramSettings>(configuration.GetSection(TelegramSettings.SectionName));
        services.AddSingleton<ITelegramNotificationService, TelegramNotificationService>();

        // Order Expiration & Stock Retention Worker
        services.AddScoped<IOrderExpirationService, MadK.Infrastructure.Services.OrderExpirationService>();
        services.AddHostedService<MadK.Infrastructure.Workers.OrderExpirationWorker>();
        services.AddHostedService<MadK.Infrastructure.Workers.CartCleanupWorker>();

        // Returns & Refunds
        services.AddScoped<IReturnService, MadK.Infrastructure.Services.ReturnService>();

        // Promotions & Coupons
        services.AddScoped<ICouponService, MadK.Infrastructure.Services.CouponService>();

        // Shipping
        services.AddScoped<IShippingFeeService, MadK.Infrastructure.Services.StandardShippingFeeService>();
        services.Configure<MadK.Application.DTOs.Shipping.GhnSettings>(opt =>
        {
            configuration.GetSection(MadK.Application.DTOs.Shipping.GhnSettings.SectionName).Bind(opt);
            var envToken = configuration["GHN_API_TOKEN"];
            if (!string.IsNullOrWhiteSpace(envToken)) opt.ApiToken = envToken;
            var envShopId = configuration["GHN_SHOP_ID"];
            if (!string.IsNullOrWhiteSpace(envShopId)) opt.ShopId = envShopId;
            var envBaseUrl = configuration["GHN_BASE_URL"];
            if (!string.IsNullOrWhiteSpace(envBaseUrl)) opt.BaseUrl = envBaseUrl;
        });
        services.AddHttpClient<IGhnShippingService, MadK.Infrastructure.Services.GhnShippingService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        // Loyalty & Rewards Program
        services.Configure<MadK.Application.DTOs.Loyalty.LoyaltySettings>(
            configuration.GetSection(MadK.Application.DTOs.Loyalty.LoyaltySettings.SectionName));
        services.AddScoped<ILoyaltyService, MadK.Infrastructure.Services.LoyaltyService>();

        return services;
    }

    /// <summary>
    /// Resolves connection string from either standard ADO.NET format or URI format (postgres:// or postgresql://).
    /// </summary>
    public static string ResolveConnectionString(string? rawConn)
    {
        if (string.IsNullOrWhiteSpace(rawConn))
            return string.Empty;

        Npgsql.NpgsqlConnectionStringBuilder builder;

        if (rawConn.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            rawConn.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(rawConn);
                var userInfo = uri.UserInfo.Split(':');
                builder = new Npgsql.NpgsqlConnectionStringBuilder
                {
                    Host = uri.Host,
                    Port = uri.Port > 0 ? uri.Port : 5432,
                    Database = uri.AbsolutePath.TrimStart('/'),
                    Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "",
                    Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
                    SslMode = Npgsql.SslMode.Require
                };
            }
            catch
            {
                return rawConn;
            }
        }
        else
        {
            try
            {
                builder = new Npgsql.NpgsqlConnectionStringBuilder(rawConn);
            }
            catch
            {
                return rawConn;
            }
        }

        // Tối ưu Connection Pooling cho Supabase PostgreSQL (tránh lỗi 53300: remaining connection slots are reserved)
        builder.Pooling = true;
        if (builder.MaxPoolSize > 15)
        {
            builder.MaxPoolSize = 15;
        }
        if (builder.MinPoolSize < 1)
        {
            builder.MinPoolSize = 1;
        }
        builder.ConnectionIdleLifetime = 30; // Giải phóng kết nối rỗi sau 30 giây
        builder.Timeout = 15; // Timeout thiết lập kết nối 15 giây

        return builder.ToString();
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
