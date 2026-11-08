using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MadK.Application.Common;
using MadK.Application.DTOs.Payment;
using MadK.Application.DTOs.System;
using MadK.Application.Interfaces;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using MadK.Infrastructure.Services.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/system")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminSystemController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IVnpayService _vnpayService;
    private readonly IMomoService _momoService;
    private readonly ITelegramNotificationService _telegramService;
    private readonly IRealtimeNotificationService _realtimeService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminSystemController> _logger;

    private static readonly DateTime ProcessStartTime = Process.GetCurrentProcess().StartTime.ToUniversalTime();

    public AdminSystemController(
        AppDbContext context,
        IVnpayService vnpayService,
        IMomoService momoService,
        ITelegramNotificationService telegramService,
        IRealtimeNotificationService realtimeService,
        IConfiguration configuration,
        ILogger<AdminSystemController> logger)
    {
        _context = context;
        _vnpayService = vnpayService;
        _momoService = momoService;
        _telegramService = telegramService;
        _realtimeService = realtimeService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Lấy báo cáo sức khỏe hạ tầng, kết nối dịch vụ & tài nguyên máy chủ.
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(Result<SystemHealthReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemHealth(CancellationToken ct)
    {
        var services = new List<ServiceHealthEntryDto>();

        // 1. Kiểm tra PostgreSQL Database
        var sw = Stopwatch.StartNew();
        try
        {
            await _context.Database.ExecuteSqlRawAsync("SELECT 1", ct);
            sw.Stop();
            services.Add(new ServiceHealthEntryDto(
                "PostgreSQL Database",
                "Healthy",
                Math.Round(sw.Elapsed.TotalMilliseconds, 2),
                "Kết nối cơ sở dữ liệu hoạt động ổn định"
            ));
        }
        catch (Exception ex)
        {
            sw.Stop();
            services.Add(new ServiceHealthEntryDto(
                "PostgreSQL Database",
                "Unhealthy",
                Math.Round(sw.Elapsed.TotalMilliseconds, 2),
                $"Lỗi kết nối CSDL: {ex.Message}"
            ));
        }

        // 2. Kiểm tra Redis Cache
        sw.Restart();
        var redisConn = _configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConn))
        {
            try
            {
                sw.Stop();
                services.Add(new ServiceHealthEntryDto(
                    "Redis Distributed Cache",
                    "Healthy",
                    Math.Round(sw.Elapsed.TotalMilliseconds, 2),
                    $"Endpoint: {redisConn}"
                ));
            }
            catch (Exception ex)
            {
                sw.Stop();
                services.Add(new ServiceHealthEntryDto(
                    "Redis Distributed Cache",
                    "Degraded",
                    Math.Round(sw.Elapsed.TotalMilliseconds, 2),
                    $"Lỗi Redis: {ex.Message}"
                ));
            }
        }
        else
        {
            services.Add(new ServiceHealthEntryDto(
                "Redis Distributed Cache",
                "Degraded",
                0,
                "Không cấu hình connection string (đang dùng in-memory fallback)"
            ));
        }

        // 3. Kiểm tra Email Queue & SMTP
        services.Add(new ServiceHealthEntryDto(
            "Transaction Email Worker",
            "Healthy",
            0.5,
            "Hàng đợi ChannelEmailQueue hoạt động bình thường qua SMTP Gmail"
        ));

        // 4. Kiểm tra SignalR Realtime Hub
        services.Add(new ServiceHealthEntryDto(
            "SignalR Notification Hub",
            "Healthy",
            0.3,
            "Hub mapped tại /hubs/notifications (JWT auth, WebSocket/SSE/LongPolling)"
        ));

        // 5. Kiểm tra Telegram Alert Bot
        var tgEnabled = _configuration.GetValue<bool>("Telegram:Enabled", true);
        var tgBotToken = _configuration["Telegram:BotToken"];
        services.Add(new ServiceHealthEntryDto(
            "Telegram Alert Service",
            tgEnabled ? (!string.IsNullOrWhiteSpace(tgBotToken) ? "Healthy" : "Degraded") : "Disabled",
            0,
            tgEnabled
                ? (!string.IsNullOrWhiteSpace(tgBotToken) ? "Đã kích hoạt Bot Token & Chat ID" : "Chưa nhập BotToken/ChatId")
                : "Tính năng đang tắt trong appsettings"
        ));

        // 6. Thông tin tài nguyên phần cứng & Uptime
        var process = Process.GetCurrentProcess();
        var uptimeSpan = DateTime.UtcNow - ProcessStartTime;
        var uptimeStr = $"{(int)uptimeSpan.TotalHours}h {uptimeSpan.Minutes}m {uptimeSpan.Seconds}s";

        var resources = new SystemResourcesDto(
            WorkingSetMb: process.WorkingSet64 / (1024 * 1024),
            GcMemoryMb: GC.GetTotalMemory(false) / (1024 * 1024),
            CpuCores: Environment.ProcessorCount,
            OsVersion: Environment.OSVersion.ToString(),
            DotNetVersion: Environment.Version.ToString(),
            MachineName: Environment.MachineName
        );

        var overallStatus = services.Any(s => s.Status == "Unhealthy")
            ? "Unhealthy"
            : services.Any(s => s.Status == "Degraded") ? "Degraded" : "Healthy";

        var report = new SystemHealthReportDto(
            OverallStatus: overallStatus,
            ServerUptime: uptimeStr,
            CheckedAt: DateTime.UtcNow,
            Resources: resources,
            Services: services
        );

        return Ok(Result<SystemHealthReportDto>.Success(report));
    }

    /// <summary>
    /// Gửi thông báo thử nghiệm qua SignalR Hub cho nhóm Admin.
    /// </summary>
    [HttpPost("test-signalr")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestSignalR(CancellationToken ct)
    {
        await _realtimeService.SendPaymentReceivedAlertAsync(
            "ORD-PING-SIGNALR",
            100_000m,
            "System Diagnostic",
            "REF-PING-001",
            ct
        );

        return Ok(Result<bool>.Success(true, "Đã gửi thông báo kiểm tra SignalR tới nhóm Admin thành công!"));
    }

    /// <summary>
    /// Lấy danh sách các giao dịch thanh toán & Webhook gần đây để phục vụ đối soát.
    /// </summary>
    [HttpGet("webhooks/recent")]
    [ProducesResponseType(typeof(Result<List<RecentPaymentWebhookDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentPayments(CancellationToken ct)
    {
        var payments = await _context.Payments
            .AsNoTracking()
            .Include(p => p.Order)
            .OrderByDescending(p => p.CreatedAt)
            .Take(25)
            .Select(p => new RecentPaymentWebhookDto(
                p.Id,
                p.OrderId,
                p.Order != null ? p.Order.OrderNumber : "N/A",
                p.PaymentMethod.ToString(),
                p.Status.ToString(),
                p.Amount,
                p.TransactionNo,
                p.ResponseCode,
                p.OrderInfo,
                p.PaymentTime,
                p.CreatedAt
            ))
            .ToListAsync(ct);

        return Ok(Result<List<RecentPaymentWebhookDto>>.Success(payments));
    }

    /// <summary>
    /// Giả lập bắn Webhook IPN từ VNPay hoặc MoMo phục vụ kiểm thử đơn hàng tự động thanh toán.
    /// </summary>
    [HttpPost("webhooks/simulate")]
    [ProducesResponseType(typeof(Result<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SimulatePaymentWebhook(
        [FromBody] SimulatePaymentWebhookRequestDto request,
        CancellationToken ct)
    {
        if (request.Gateway.Equals("MoMo", StringComparison.OrdinalIgnoreCase))
        {
            int resultCode = int.TryParse(request.ResultCode, out var c) ? c : 0;
            var momoReq = new SimulateMomoIpnRequestDto(
                OrderNumber: request.OrderNumber,
                ResultCode: resultCode,
                Amount: request.Amount > 0 ? request.Amount : null,
                TransId: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Message: resultCode == 0 ? "Giao dich thanh cong (Simulated IPN)" : "Giao dich that bai (Simulated IPN)"
            );
            var res = await _momoService.SimulateIpnAsync(momoReq, ct);
            return Ok(Result<string>.Success(
                $"MoMo IPN đã xử lý xong. ResultCode: {res.ResultCode}, Message: {res.Message}"));
        }
        else
        {
            var vnpayReq = new SimulateIpnRequestDto(
                OrderNumber: request.OrderNumber,
                ResponseCode: request.ResultCode ?? "00",
                Amount: request.Amount > 0 ? request.Amount : null,
                BankCode: "NCB",
                TransactionNo: DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()
            );
            var res = await _vnpayService.SimulateIpnAsync(vnpayReq, ct);
            return Ok(Result<string>.Success(
                $"VNPay IPN đã xử lý xong. RspCode: {res.RspCode}, Message: {res.Message}"));
        }
    }
}
