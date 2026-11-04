using MadK.Application.DTOs.Payment;

namespace MadK.Application.Interfaces;

/// <summary>
/// Giao diện xử lý thanh toán chuyển khoản ngân hàng tự động (VietQR / SePAY Webhook).
/// </summary>
public interface IBankTransferService
{
    /// <summary>
    /// Tiếp nhận và xử lý webhook biến động số dư từ cổng SePAY / ngân hàng.
    /// Tự động đối soát mã đơn, số tiền và chuyển trạng thái đơn hàng sang Processing.
    /// </summary>
    Task<BankTransferWebhookResponseDto> ProcessSepayWebhookAsync(
        SepayWebhookDto dto,
        string? authHeader = null,
        CancellationToken ct = default);

    /// <summary>
    /// Mô phỏng chuyển khoản để kiểm thử quy trình duyệt đơn tự động.
    /// </summary>
    Task<BankTransferWebhookResponseDto> SimulateTransferAsync(
        SimulateBankTransferRequestDto dto,
        CancellationToken ct = default);
}
