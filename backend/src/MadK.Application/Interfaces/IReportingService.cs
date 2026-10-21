using MadK.Application.Common;
using MadK.Application.DTOs.Reporting;

namespace MadK.Application.Interfaces;

public interface IReportingService
{
    /// <summary>
    /// Thống kê doanh thu, lợi nhuận gộp, biên lợi nhuận, số đơn theo ngày và top sản phẩm bán chạy.
    /// Truy vấn tối ưu, không load toàn bộ bảng vào bộ nhớ.
    /// </summary>
    Task<Result<RevenueReportDto>> GetRevenueReportAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default);

    /// <summary>
    /// Thống kê số lượng tồn kho (OnHand, Reserved, Available) và danh sách SKU sắp hết hàng.
    /// </summary>
    Task<Result<InventoryReportDto>> GetInventoryReportAsync(
        int lowStockThreshold = 10,
        CancellationToken ct = default);

    /// <summary>
    /// Tổng hợp dashboard điều hành tùy biến theo vai trò của người dùng:
    /// - Sales: Thống kê doanh thu, lợi nhuận, biểu đồ ngày, top bán chạy.
    /// - Warehouse: Tồn kho khả dụng, cảnh báo sắp hết hàng, danh sách SKU cần nhập.
    /// - Admin: Xem toàn bộ các chỉ số của cả doanh thu, tồn kho và hệ thống.
    /// </summary>
    Task<Result<DashboardSummaryDto>> GetDashboardSummaryAsync(
        string role,
        CancellationToken ct = default);
}
