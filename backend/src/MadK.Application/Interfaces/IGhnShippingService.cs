using MadK.Application.Common;
using MadK.Application.DTOs.Shipping;

namespace MadK.Application.Interfaces;

/// <summary>
/// Giao diện dịch vụ kết nối với đơn vị vận chuyển Giao Hàng Nhanh (GHN):
/// - Tra cứu danh mục địa chỉ hành chính chuẩn GHN.
/// - Tính cước vận chuyển tự động theo kích thước, khối lượng và vị trí kho.
/// - Tạo mã vận đơn (AwbCode / TrackingCode) gửi sang bưu cục.
/// - Sinh link in phiếu giao hàng A5 / tem dán.
/// - Tiếp nhận Webhook cập nhật hành trình bưu kiện theo thời gian thực.
/// </summary>
public interface IGhnShippingService
{
    /// <summary>
    /// Tính phí vận chuyển thực tế từ kho MadK Store tới địa chỉ khách hàng qua GHN.
    /// Tự động áp dụng chính sách Freeship toàn quốc cho đơn từ 1.000.000đ.
    /// </summary>
    Task<Result<GhnCalculateFeeResponseDto>> CalculateShippingFeeAsync(
        GhnCalculateFeeRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Tạo đơn giao hàng chính thức sang bưu cục GHN:
    /// - Nhận mã vận đơn (TrackingCode, vd GHN-L7A8BC9).
    /// - Sinh token và URL in phiếu gửi hàng A5.
    /// - Cập nhật thông tin vận chuyển vào Order.
    /// </summary>
    Task<Result<GhnCreateShippingOrderResponseDto>> CreateShippingOrderAsync(
        GhnCreateShippingOrderRequestDto request,
        CancellationToken ct = default);

    /// <summary>
    /// Tra cứu chi tiết hành trình vận chuyển của đơn hàng (qua mã đơn hoặc mã vận đơn).
    /// </summary>
    Task<Result<GhnTrackingDetailDto>> GetTrackingDetailAsync(
        string orderNumberOrTrackingCode,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy đường dẫn in phiếu gửi hàng A5 từ GHN.
    /// </summary>
    Task<Result<string>> GetPrintOrderUrlAsync(
        string orderCode,
        CancellationToken ct = default);

    /// <summary>
    /// Tiếp nhận Webhook hành trình bưu phẩm từ bưu tá / máy chủ GHN.
    /// Tự động đồng bộ trạng thái đơn hàng (đang giao -> Shipping, giao thành công -> Completed, thu COD -> Paid).
    /// </summary>
    Task<GhnWebhookResponseDto> ProcessGhnWebhookAsync(
        GhnWebhookPayloadDto payload,
        CancellationToken ct = default);

    /// <summary>
    /// Tra cứu danh sách Tỉnh/Thành chuẩn GHN.
    /// </summary>
    Task<Result<IReadOnlyList<GhnProvinceDto>>> GetProvincesAsync(CancellationToken ct = default);

    /// <summary>
    /// Tra cứu danh sách Quận/Huyện theo Tỉnh/Thành chuẩn GHN.
    /// </summary>
    Task<Result<IReadOnlyList<GhnDistrictDto>>> GetDistrictsAsync(int provinceId, CancellationToken ct = default);

    /// <summary>
    /// Tra cứu danh sách Phường/Xã theo Quận/Huyện chuẩn GHN.
    /// </summary>
    Task<Result<IReadOnlyList<GhnWardDto>>> GetWardsAsync(int districtId, CancellationToken ct = default);
}
