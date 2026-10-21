namespace MadK.Application.Interfaces;

/// <summary>
/// Dịch vụ quét và xử lý đơn hàng quá hạn thanh toán.
/// Hủy các đơn online chưa thanh toán trong thời hạn cấu hình và giải phóng tồn kho đã giữ.
/// </summary>
public interface IOrderExpirationService
{
    /// <summary>
    /// Quét các đơn hàng ở trạng thái PendingPayment có thời hạn ExpiresAt &lt;= DateTime.UtcNow,
    /// chuyển trạng thái sang Cancelled và giải phóng tồn kho đang giữ (Release).
    /// </summary>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Số lượng đơn hàng quá hạn đã được xử lý hủy</returns>
    Task<int> CancelExpiredOrdersAsync(CancellationToken ct = default);
}
