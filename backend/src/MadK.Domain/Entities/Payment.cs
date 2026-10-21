using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho giao dịch thanh toán trong hệ thống MadK Store.
/// Lưu trữ toàn bộ thông tin thanh toán, mã đối soát từ cổng thanh toán (VNPay),
/// và payload thô (raw JSON) để phục vụ kiểm toán và đối soát độc lập.
/// </summary>
public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    /// <summary>
    /// Mã đơn hàng liên quan (e.g. MK-20261015-ABC123).
    /// </summary>
    public string OrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// Mã tham chiếu giao dịch gửi sang cổng thanh toán (vnp_TxnRef).
    /// Duy nhất cho mỗi lần khởi tạo yêu cầu thanh toán.
    /// </summary>
    public string TxnRef { get; set; } = string.Empty;

    /// <summary>
    /// Mã giao dịch do cổng thanh toán (VNPay) ghi nhận (vnp_TransactionNo).
    /// </summary>
    public string? TransactionNo { get; set; }

    /// <summary>
    /// Số tiền thanh toán thực tế (Đơn vị: VNĐ).
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Đơn vị tiền tệ, mặc định "VND".
    /// </summary>
    public string Currency { get; set; } = "VND";

    /// <summary>
    /// Phương thức thanh toán (COD hoặc VNPay).
    /// </summary>
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.VNPay;

    /// <summary>
    /// Trạng thái thanh toán (Pending, Paid, Failed, Refunded, ...).
    /// </summary>
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    /// <summary>
    /// Mã ngân hàng / Ví điện tử thanh toán (vnp_BankCode, e.g. VNBANK, NCB, VISA).
    /// </summary>
    public string? BankCode { get; set; }

    /// <summary>
    /// Mã giao dịch tại ngân hàng (vnp_BankTranNo).
    /// </summary>
    public string? BankTranNo { get; set; }

    /// <summary>
    /// Loại thẻ / tài khoản thanh toán (vnp_CardType, e.g. ATM, QRCODE).
    /// </summary>
    public string? CardType { get; set; }

    /// <summary>
    /// Nội dung thanh toán (vnp_OrderInfo).
    /// </summary>
    public string? OrderInfo { get; set; }

    /// <summary>
    /// Mã phản hồi từ cổng (vnp_ResponseCode, "00" = thành công).
    /// </summary>
    public string? ResponseCode { get; set; }

    /// <summary>
    /// Trạng thái giao dịch cổng (vnp_TransactionStatus, "00" = thành công).
    /// </summary>
    public string? TransactionStatus { get; set; }

    /// <summary>
    /// Chữ ký số kiểm tra tính toàn vẹn (vnp_SecureHash).
    /// </summary>
    public string? SecureHash { get; set; }

    /// <summary>
    /// Lưu trữ toàn bộ dữ liệu payload thô (JSON) từ webhook/IPN/Return để đối soát.
    /// </summary>
    public string RawPayload { get; set; } = "{}";

    /// <summary>
    /// Địa chỉ IP của máy khách khi thực hiện thanh toán.
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// Thời gian cổng ghi nhận thanh toán thành công (vnp_PayDate).
    /// </summary>
    public DateTime? PaymentTime { get; set; }
}
