using MadK.Application.DTOs.Inventory;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Reporting;

namespace MadK.Application.Interfaces;

/// <summary>
/// Dịch vụ xuất khẩu dữ liệu báo cáo, đơn hàng và kho hàng ra tệp Excel / CSV chuẩn UTF-8 có BOM.
/// Đảm bảo tương thích 100% với Microsoft Excel, Google Sheets, LibreOffice không bị lỗi font Tiếng Việt.
/// </summary>
public interface IExcelExportService
{
    /// <summary>
    /// Xuất báo cáo doanh thu tổng quan và chi tiết theo ngày ra file CSV/Excel.
    /// </summary>
    byte[] ExportRevenueReportToCsv(RevenueReportDto report, DateTime? fromDate = null, DateTime? toDate = null);

    /// <summary>
    /// Xuất danh sách đơn hàng chi tiết ra file CSV/Excel.
    /// </summary>
    byte[] ExportOrdersToCsv(IEnumerable<OrderDto> orders);

    /// <summary>
    /// Xuất bảng kiểm kê kho hàng chi tiết từng biến thể (SKU, OnHand, Reserved, Available) ra file CSV/Excel.
    /// </summary>
    byte[] ExportInventoryToCsv(IEnumerable<VariantInventoryItemDto> items);
}
