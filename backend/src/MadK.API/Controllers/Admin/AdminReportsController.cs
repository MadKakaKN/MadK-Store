using System.Security.Claims;
using MadK.Application.Common;
using MadK.Application.DTOs.Reporting;
using MadK.Application.Interfaces;
using MadK.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/reports")]
public class AdminReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;
    private readonly IAppDbContext _dbContext;
    private readonly IExcelExportService _excelExportService;

    public AdminReportsController(
        IReportingService reportingService,
        IAppDbContext dbContext,
        IExcelExportService excelExportService)
    {
        _reportingService = reportingService;
        _dbContext = dbContext;
        _excelExportService = excelExportService;
    }

    /// <summary>
    /// Báo cáo doanh thu, lợi nhuận gộp và tình hình đơn hàng (Quyền: report.revenue / Sales, Admin).
    /// </summary>
    [HttpGet("revenue")]
    [Authorize(Policy = Permissions.ReportRevenue)]
    [ProducesResponseType(typeof(Result<RevenueReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevenueReport(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct)
    {
        var result = await _reportingService.GetRevenueReportAsync(fromDate, toDate, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// <summary>
    /// Xuất báo cáo doanh thu ra file Excel / CSV chuẩn UTF-8 (Quyền: report.revenue / Sales, Admin).
    /// </summary>
    [HttpGet("revenue/export")]
    [Authorize(Policy = Permissions.ReportRevenue)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportRevenueReport(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct)
    {
        var result = await _reportingService.GetRevenueReportAsync(fromDate, toDate, ct);
        if (!result.IsSuccess || result.Data == null)
        {
            return BadRequest(result);
        }

        var csvBytes = _excelExportService.ExportRevenueReportToCsv(result.Data, fromDate, toDate);
        var fileName = $"BaoCao_DoanhThu_{DateTime.UtcNow.AddHours(7):yyyyMMdd_HHmm}.csv";

        return File(csvBytes, "text/csv; charset=utf-8", fileName);
    }

    /// Báo cáo tồn kho và cảnh báo hết hàng (Quyền: report.inventory / Warehouse, Admin).
    /// </summary>
    [HttpGet("inventory")]
    [Authorize(Policy = Permissions.ReportInventory)]
    [ProducesResponseType(typeof(Result<InventoryReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventoryReport(
        [FromQuery] int threshold = 10,
        CancellationToken ct = default)
    {
        var result = await _reportingService.GetInventoryReportAsync(threshold, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Báo cáo tổng thể toàn bộ hệ thống (Quyền: report.all / Admin duy nhất).
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Policy = Permissions.ReportAll)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemSummaryReport(CancellationToken ct)
    {
        var summaryResult = await _reportingService.GetDashboardSummaryAsync(Roles.Admin, ct);
        if (!summaryResult.IsSuccess)
        {
            return BadRequest(summaryResult);
        }

        var report = new
        {
            TotalUsers = summaryResult.Value!.TotalUsers,
            TotalOrders = summaryResult.Value.Revenue?.TotalOrders ?? 0,
            TotalProducts = summaryResult.Value.TotalProducts,
            TotalAuditLogs = summaryResult.Value.TotalAuditLogs,
            SystemStatus = "Healthy",
            GeneratedAt = DateTime.UtcNow
        };

        return Ok(Result<object>.Success(report));
    }

    /// <summary>
    /// Dashboard điều hành hợp nhất hiển thị số liệu theo ma trận phân quyền:
    /// - Sales: Doanh thu, lợi nhuận gộp, biểu đồ ngày, top bán chạy.
    /// - Warehouse: Tồn kho thực tế/khả dụng, danh sách SKU sắp hết hàng.
    /// - Admin: Xem toàn bộ các chỉ số của cả doanh thu, tồn kho và hệ thống.
    /// </summary>
    [HttpGet("dashboard")]
    [Authorize]
    [ProducesResponseType(typeof(Result<DashboardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardSummary(CancellationToken ct)
    {
        string role;
        if (User.IsInRole(Roles.Admin))
        {
            role = Roles.Admin;
        }
        else if (User.IsInRole(Roles.Sales))
        {
            role = Roles.Sales;
        }
        else if (User.IsInRole(Roles.Warehouse))
        {
            role = Roles.Warehouse;
        }
        else
        {
            return Forbid();
        }

        var result = await _reportingService.GetDashboardSummaryAsync(role, ct);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
