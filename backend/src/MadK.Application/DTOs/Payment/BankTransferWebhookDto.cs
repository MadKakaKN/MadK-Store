using System.Text.Json.Serialization;

namespace MadK.Application.DTOs.Payment;

/// <summary>
/// Cấu hình webhook ngân hàng / VietQR (SePAY / Casso).
/// </summary>
public class BankTransferSettings
{
    public const string SectionName = "BankTransfer";

    /// <summary>
    /// API Key xác thực từ SePAY / Casso webhook (để trong header Authorization: Apikey {ApiKey}).
    /// Nếu để trống, hệ thống cho phép bypass xác thực ở môi trường phát triển.
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// Số tài khoản ngân hàng thụ hưởng (e.g. 19050430057012).
    /// </summary>
    public string AccountNumber { get; set; } = "19050430057012";

    /// <summary>
    /// Tên ngân hàng thụ hưởng (e.g. Techcombank).
    /// </summary>
    public string BankName { get; set; } = "Techcombank";
}

/// <summary>
/// Payload webhook chuẩn từ SePAY gửi về khi có biến động số dư ngân hàng.
/// </summary>
public class SepayWebhookDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("gateway")]
    public string Gateway { get; set; } = "Techcombank";

    [JsonPropertyName("transactionDate")]
    public string? TransactionDate { get; set; }

    [JsonPropertyName("accountNumber")]
    public string? AccountNumber { get; set; }

    [JsonPropertyName("subAccount")]
    public string? SubAccount { get; set; }

    [JsonPropertyName("code")]
    public string? Code { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("transferType")]
    public string TransferType { get; set; } = "in"; // "in" là tiền vào, "out" là tiền ra

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("transferAmount")]
    public decimal TransferAmount { get; set; }

    [JsonPropertyName("referenceCode")]
    public string? ReferenceCode { get; set; }

    [JsonPropertyName("accumulated")]
    public decimal? Accumulated { get; set; }
}

/// <summary>
/// Phản hồi của Webhook cho cổng ngân hàng.
/// </summary>
public record BankTransferWebhookResponseDto(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("orderNumber")] string? OrderNumber = null,
    [property: JsonPropertyName("amount")] decimal? Amount = null
);

/// <summary>
/// DTO mô phỏng chuyển khoản để kiểm thử tính năng duyệt đơn tự động.
/// </summary>
public record SimulateBankTransferRequestDto(
    string OrderNumber,
    decimal Amount,
    string? Content = null
);
