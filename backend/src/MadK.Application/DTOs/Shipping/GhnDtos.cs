namespace MadK.Application.DTOs.Shipping;

/// <summary>
/// Cấu hình kết nối tới API Giao Hàng Nhanh (GHN).
/// Nạp qua biến môi trường (GHN_*) hoặc appsettings.json.
/// </summary>
public class GhnSettings
{
    public const string SectionName = "Ghn";

    /// <summary>
    /// API Token do GHN cấp.
    /// Mặc định: Token Sandbox GHN công khai phục vụ phát triển & kiểm thử.
    /// </summary>
    public string ApiToken { get; set; } = "d94064d7-4c12-11ef-8e53-0a00184fe694";

    /// <summary>
    /// Mã định danh Shop trên hệ thống GHN.
    /// </summary>
    public string ShopId { get; set; } = "193024";

    /// <summary>
    /// Base URL của API GHN (Sandbox hoặc Production).
    /// Sandbox: https://dev-online-gateway.ghn.vn/shiip/public-api
    /// Production: https://online-gateway.ghn.vn/shiip/public-api
    /// </summary>
    public string BaseUrl { get; set; } = "https://dev-online-gateway.ghn.vn/shiip/public-api";

    /// <summary>
    /// Mã Quận/Huyện của kho xuất hàng MadK Store (1442 = Quận 1, TP.HCM).
    /// </summary>
    public int FromDistrictId { get; set; } = 1442;

    /// <summary>
    /// Mã Phường/Xã kho gửi (20101 = Phường Bến Nghé, Quận 1).
    /// </summary>
    public string FromWardCode { get; set; } = "20101";

    /// <summary>
    /// Tên người gửi hiển thị trên phiếu gửi hàng.
    /// </summary>
    public string SenderName { get; set; } = "MadK Store";

    /// <summary>
    /// Số điện thoại kho gửi hàng.
    /// </summary>
    public string SenderPhone { get; set; } = "0901316434";

    /// <summary>
    /// Địa chỉ kho xuất hàng MadK Store.
    /// </summary>
    public string SenderAddress { get; set; } = "123 Đường Công Nghệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh";

    /// <summary>
    /// Tự động gọi GHN tạo mã vận đơn khi đơn hàng được duyệt sang trạng thái Processing.
    /// </summary>
    public bool AutoCreateShippingOnProcessing { get; set; } = true;
}

public record GhnProvinceDto(
    int ProvinceId,
    string ProvinceName,
    string? Code
);

public record GhnDistrictDto(
    int DistrictId,
    int ProvinceId,
    string DistrictName,
    string? Code
);

public record GhnWardDto(
    string WardCode,
    int DistrictId,
    string WardName
);

public record GhnCalculateFeeRequestDto(
    int? ToDistrictId = null,
    string? ToWardCode = null,
    string? ProvinceName = null,
    string? DistrictName = null,
    string? WardName = null,
    decimal SubtotalAmount = 0m,
    int TotalWeightGrams = 800,
    int TotalQuantity = 1
);

public record GhnCalculateFeeResponseDto(
    decimal TotalFee,
    decimal ServiceFee,
    decimal InsuranceFee,
    string ExpectedDeliveryTime,
    bool IsFreeShipping
);

public record GhnCreateShippingOrderRequestDto(
    string OrderNumber,
    string? Note = null,
    string? RequiredNote = "CHOXEMHANGKHONGTHU"
);

public record GhnCreateShippingOrderResponseDto(
    string OrderNumber,
    string TrackingCode,
    decimal TotalFee,
    string ExpectedDeliveryTime,
    string? SortCode,
    string? PrintToken,
    string? PrintUrl
);

public record GhnTrackingDetailDto(
    string OrderNumber,
    string TrackingCode,
    string Status,
    string StatusDescription,
    string? ShipperName,
    string? ShipperPhone,
    string? Warehouse,
    DateTime? UpdatedAt,
    IReadOnlyList<GhnTrackingLogDto> Logs
);

public record GhnTrackingLogDto(
    string Status,
    string Description,
    DateTime Time,
    string? Location
);

public record GhnWebhookPayloadDto(
    string OrderCode,
    string? ClientOrderCode,
    string Status,
    DateTime? Time,
    string? Description,
    string? Reason,
    string? ReasonCode,
    string? ShipperName,
    string? ShipperPhone,
    string? Warehouse
);

public record GhnWebhookResponseDto(
    bool Success,
    string Message,
    string? OrderNumber = null,
    string? NewStatus = null
);
