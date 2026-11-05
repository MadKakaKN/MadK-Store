using MadK.Domain.Enums;

namespace MadK.Domain.Entities;

/// <summary>
/// Đại diện cho Đơn hàng trong hệ thống MadK Store.
/// Lưu trữ snapshot địa chỉ giao hàng, thông tin thanh toán, và các dòng sản phẩm.
/// </summary>
public class Order : BaseEntity
{
    /// <summary>
    /// Mã đơn hàng thân thiện, dễ đọc cho khách (e.g. MK-20261013-ABC123).
    /// </summary>
    public string OrderNumber { get; set; } = string.Empty;

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;

    /// <summary>
    /// Tổng tiền hàng trước khi giảm giá (tính lại hoàn toàn từ DB).
    /// </summary>
    public decimal SubtotalAmount { get; set; }

    /// <summary>
    /// Số tiền được giảm giá (voucher / khuyến mãi).
    /// </summary>
    public decimal DiscountAmount { get; set; } = 0m;

    /// <summary>
    /// Phí vận chuyển.
    /// </summary>
    public decimal ShippingFee { get; set; } = 0m;

    /// <summary>
    /// Tổng tiền khách phải thanh toán = SubtotalAmount - DiscountAmount - LoyaltyDiscountAmount + ShippingFee.
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// [SNAPSHOT] Địa chỉ nhận hàng tại thời điểm đặt (Người nhận, SĐT, Tỉnh, Huyện, Xã, Chi tiết).
    /// Giữ nguyên vĩnh viễn dù khách có đổi hoặc xóa địa chỉ trong sổ địa chỉ.
    /// </summary>
    public string ShippingAddressSnapshot { get; set; } = "{}";

    public string? CouponSnapshot { get; set; }

    public string? CustomerNote { get; set; }
    public string? AdminNote { get; set; }

    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }

    /// <summary>
    /// Thời hạn thanh toán (đơn thanh toán online giữ hàng trong thời hạn này).
    /// Quá thời gian này, job nền sẽ tự động hủy đơn và giải phóng tồn kho.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Khóa Idempotency chống khách click đúp hoặc retry request tạo nhiều đơn trùng lặp.
    /// </summary>
    public string? IdempotencyKey { get; set; }

    /// <summary>
    /// Đơn vị vận chuyển (e.g. "GHN", "Giao Hàng Nhanh", "MadK Express").
    /// </summary>
    public string? CarrierName { get; set; }

    /// <summary>
    /// Mã vận đơn (AwbCode / Tracking Code) do bưu cục cấp.
    /// </summary>
    public string? TrackingCode { get; set; }

    /// <summary>
    /// Trạng thái giao vận (ready_to_pick, picking, delivering, delivered, delivery_fail, returned...).
    /// </summary>
    public string? ShippingStatus { get; set; }

    /// <summary>
    /// Đường dẫn in phiếu gửi hàng A5 / tem dán bưu cục.
    /// </summary>
    public string? ShippingLabelUrl { get; set; }

    /// <summary>
    /// Ngày giao hàng dự kiến.
    /// </summary>
    public DateTime? EstimatedDeliveryDate { get; set; }

    /// <summary>
    /// Số điểm thưởng khách đã sử dụng cho đơn hàng (1 điểm = 1 VNĐ).
    /// </summary>
    public int LoyaltyPointsUsed { get; set; } = 0;

    /// <summary>
    /// Số tiền được giảm giá trực tiếp từ điểm thưởng.
    /// </summary>
    public decimal LoyaltyDiscountAmount { get; set; } = 0m;

    /// <summary>
    /// Số điểm thưởng khách được cộng từ đơn hàng này khi hoàn tất giao hàng.
    /// </summary>
    public int LoyaltyPointsEarned { get; set; } = 0;

    /// <summary>
    /// Đánh dấu điểm đã được hoàn lại hay chưa khi đơn bị hủy hoặc trả hàng.
    /// </summary>
    public bool LoyaltyPointsRefunded { get; set; } = false;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderStatusHistory> StatusHistories { get; set; } = new List<OrderStatusHistory>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<ReturnRequest> ReturnRequests { get; set; } = new List<ReturnRequest>();
}
