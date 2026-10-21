namespace MadK.Application.DTOs.Notifications;

public class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool EnableSsl { get; set; } = false;
    public string FromEmail { get; set; } = "noreply@madkstore.local";
    public string FromName { get; set; } = "MadK Store";
    public int MaxRetries { get; set; } = 3;
    public int RetryBaseDelayMs { get; set; } = 500;
    public bool UseMock { get; set; } = false;
}

public class RabbitMqSettings
{
    public const string SectionName = "RabbitMq";

    public bool Enabled { get; set; } = false;
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public string QueueName { get; set; } = "madk_email_notifications";
}

public class QueuedEmailMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ToEmail { get; set; } = string.Empty;
    public string? RecipientName { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? PlainTextBody { get; set; }
    public string MessageType { get; set; } = "Generic";
    public Dictionary<string, string> Metadata { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int RetryCount { get; set; } = 0;
}

public record OrderItemEmailDto(
    string ProductName,
    string VariantName,
    string? Sku,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string? ThumbnailUrl
);

public record OrderConfirmationEmailDto(
    string OrderNumber,
    string RecipientEmail,
    string RecipientName,
    string RecipientPhone,
    string ShippingAddress,
    string PaymentMethod,
    decimal SubtotalAmount,
    decimal ShippingFee,
    decimal DiscountAmount,
    decimal TotalAmount,
    string? CouponCode,
    string? CustomerNote,
    DateTime CreatedAt,
    List<OrderItemEmailDto> Items
);

public record OrderStatusChangedEmailDto(
    string OrderNumber,
    string RecipientEmail,
    string RecipientName,
    string OldStatus,
    string NewStatus,
    string? Reason,
    string? Note,
    DateTime ChangedAt,
    decimal TotalAmount
);

public record PasswordResetEmailDto(
    string ToEmail,
    string FullName,
    string ResetToken,
    int ExpiryMinutes = 30
);
