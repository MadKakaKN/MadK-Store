using System;
using System.Collections.Generic;

namespace MadK.Application.DTOs.System;

public record ServiceHealthEntryDto(
    string ServiceName,
    string Status, // "Healthy", "Degraded", "Unhealthy"
    double LatencyMs,
    string? Details
);

public record SystemResourcesDto(
    long WorkingSetMb,
    long GcMemoryMb,
    int CpuCores,
    string OsVersion,
    string DotNetVersion,
    string MachineName
);

public record SystemHealthReportDto(
    string OverallStatus,
    string ServerUptime,
    DateTime CheckedAt,
    SystemResourcesDto Resources,
    List<ServiceHealthEntryDto> Services
);

public record RecentPaymentWebhookDto(
    Guid PaymentId,
    Guid OrderId,
    string OrderNumber,
    string PaymentMethod,
    string Status,
    decimal Amount,
    string? TransactionNo,
    string? ResponseCode,
    string? OrderInfo,
    DateTime? PaidAt,
    DateTime CreatedAt
);

public record SimulatePaymentWebhookRequestDto(
    string Gateway, // "VNPay" hoặc "MoMo"
    string OrderNumber,
    decimal Amount,
    string ResultCode // "00" (thành công) hoặc khác
);
