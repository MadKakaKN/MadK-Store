using System.Net;
using System.Text;
using MadK.Application.DTOs.Notifications;
using MadK.Application.Interfaces;

namespace MadK.Infrastructure.Services.Notifications;

public class EmailTemplateService : IEmailTemplateService
{
    private const string BrandColor = "#4f46e5";
    private const string DarkBg = "#0f172a";
    private const string LightBg = "#f8fafc";
    private const string BorderColor = "#e2e8f0";

    public string RenderEmailConfirmation(string fullName, string confirmationToken)
    {
        var safeName = WebUtility.HtmlEncode(fullName);
        var safeToken = WebUtility.HtmlEncode(confirmationToken);

        var body = $@"
            <div style=""text-align: center; padding: 20px 0;"">
                <h2 style=""color: #1e293b; margin-bottom: 8px;"">Chào mừng bạn đến với MadK Store!</h2>
                <p style=""color: #64748b; font-size: 15px; line-height: 1.6;"">
                    Xin chào <strong>{safeName}</strong>, cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã xác thực dưới đây để hoàn tất kích hoạt tài khoản của bạn.
                </p>
                <div style=""margin: 25px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;"">
                    <span style=""font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: {BrandColor};"">{safeToken}</span>
                </div>
                <p style=""color: #94a3b8; font-size: 13px;"">
                    Mã xác thực có hiệu lực trong 24 giờ. Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email.
                </p>
            </div>";

        return WrapLayout("Xác thực tài khoản MadK Store", body);
    }

    public string RenderPasswordReset(string fullName, string resetToken, int expiryMinutes = 30)
    {
        var safeName = WebUtility.HtmlEncode(fullName);
        var safeToken = WebUtility.HtmlEncode(resetToken);

        var body = $@"
            <div style=""padding: 10px 0;"">
                <h2 style=""color: #1e293b; margin-bottom: 8px;"">Yêu cầu đặt lại mật khẩu</h2>
                <p style=""color: #64748b; font-size: 15px; line-height: 1.6;"">
                    Xin chào <strong>{safeName}</strong>, hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản MadK Store của bạn.
                </p>
                <div style=""margin: 20px 0; text-align: center;"">
                    <div style=""padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block;"">
                        <div style=""font-size: 12px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; font-weight: 600;"">Mã khôi phục mật khẩu</div>
                        <span style=""font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 3px; color: {BrandColor};"">{safeToken}</span>
                    </div>
                </div>
                <div style=""background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin: 20px 0;"">
                    <p style=""color: #991b1b; font-size: 13px; margin: 0; line-height: 1.5;"">
                        ⚠️ <strong>Lưu ý bảo mật:</strong> Mã khôi phục này sẽ hết hạn sau <strong>{expiryMinutes} phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
                    </p>
                </div>
                <p style=""color: #94a3b8; font-size: 13px; line-height: 1.5;"">
                    Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng đổi mật khẩu ngay hoặc liên hệ với bộ phận hỗ trợ khách hàng.
                </p>
            </div>";

        return WrapLayout("Đặt lại mật khẩu - MadK Store", body);
    }

    public string RenderOrderConfirmation(OrderConfirmationEmailDto dto)
    {
        var safeName = WebUtility.HtmlEncode(dto.RecipientName);
        var safeOrderNumber = WebUtility.HtmlEncode(dto.OrderNumber);
        var safeAddress = WebUtility.HtmlEncode(dto.ShippingAddress);
        var safePhone = WebUtility.HtmlEncode(dto.RecipientPhone);
        var safePaymentMethod = WebUtility.HtmlEncode(dto.PaymentMethod);

        var itemsHtml = new StringBuilder();
        foreach (var item in dto.Items)
        {
            var pName = WebUtility.HtmlEncode(item.ProductName);
            var vName = WebUtility.HtmlEncode(item.VariantName);

            itemsHtml.Append($@"
                <tr style=""border-bottom: 1px solid {BorderColor};"">
                    <td style=""padding: 12px 8px;"">
                        <strong style=""color: #1e293b; font-size: 14px;"">{pName}</strong><br/>
                        <span style=""color: #64748b; font-size: 12px;"">{vName}</span>
                    </td>
                    <td style=""padding: 12px 8px; text-align: center; color: #334155; font-size: 14px;"">
                        x{item.Quantity}
                    </td>
                    <td style=""padding: 12px 8px; text-align: right; color: #334155; font-size: 14px;"">
                        {item.UnitPrice:N0} đ
                    </td>
                    <td style=""padding: 12px 8px; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px;"">
                        {item.TotalPrice:N0} đ
                    </td>
                </tr>");
        }

        string couponRow = "";
        if (dto.DiscountAmount > 0)
        {
            var codeText = !string.IsNullOrWhiteSpace(dto.CouponCode) ? $" ({WebUtility.HtmlEncode(dto.CouponCode)})" : "";
            couponRow = $@"
                <tr>
                    <td colspan=""3"" style=""padding: 6px 8px; text-align: right; color: #16a34a;"">Giảm giá voucher{codeText}:</td>
                    <td style=""padding: 6px 8px; text-align: right; color: #16a34a; font-weight: 600;"">-{dto.DiscountAmount:N0} đ</td>
                </tr>";
        }

        string noteRow = "";
        if (!string.IsNullOrWhiteSpace(dto.CustomerNote))
        {
            noteRow = $@"
                <div style=""margin-top: 15px; padding: 10px 14px; background: #f8fafc; border-radius: 6px; font-size: 13px; color: #475569;"">
                    <strong>Ghi chú đơn hàng:</strong> {WebUtility.HtmlEncode(dto.CustomerNote)}
                </div>";
        }

        var body = $@"
            <div style=""padding: 10px 0;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <div style=""display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px;"">
                        📦
                    </div>
                    <h2 style=""color: #1e293b; margin: 10px 0 4px 0;"">Cảm ơn bạn đã đặt hàng!</h2>
                    <p style=""color: #64748b; font-size: 14px; margin: 0;"">
                        Đơn hàng <strong style=""color: {BrandColor};"">#{safeOrderNumber}</strong> đã được ghi nhận và đang chuẩn bị xử lý.
                    </p>
                </div>

                <!-- Thông tin giao nhận -->
                <div style=""background-color: #f8fafc; border: 1px solid {BorderColor}; border-radius: 8px; padding: 16px; margin-bottom: 20px;"">
                    <h3 style=""margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;"">Thông tin giao hàng</h3>
                    <table style=""width: 100%; font-size: 13px; color: #334155; line-height: 1.6;"">
                        <tr>
                            <td style=""width: 140px; color: #64748b;"">Người nhận:</td>
                            <td><strong>{safeName}</strong> ({safePhone})</td>
                        </tr>
                        <tr>
                            <td style=""color: #64748b;"">Địa chỉ nhận hàng:</td>
                            <td>{safeAddress}</td>
                        </tr>
                        <tr>
                            <td style=""color: #64748b;"">Phương thức thanh toán:</td>
                            <td><strong>{safePaymentMethod}</strong></td>
                        </tr>
                        <tr>
                            <td style=""color: #64748b;"">Thời gian đặt:</td>
                            <td>{dto.CreatedAt.ToLocalTime():dd/MM/yyyy HH:mm}</td>
                        </tr>
                    </table>
                    {noteRow}
                </div>

                <!-- Danh sách sản phẩm -->
                <h3 style=""margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;"">Chi tiết đơn hàng</h3>
                <table style=""width: 100%; border-collapse: collapse; margin-bottom: 20px;"">
                    <thead>
                        <tr style=""background-color: #f1f5f9; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase;"">
                            <th style=""padding: 10px 8px;"">Sản phẩm</th>
                            <th style=""padding: 10px 8px; text-align: center; width: 60px;"">SL</th>
                            <th style=""padding: 10px 8px; text-align: right; width: 100px;"">Đơn giá</th>
                            <th style=""padding: 10px 8px; text-align: right; width: 110px;"">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsHtml}
                    </tbody>
                    <tfoot style=""font-size: 13px;"">
                        <tr>
                            <td colspan=""3"" style=""padding: 10px 8px 4px 8px; text-align: right; color: #64748b;"">Tạm tính:</td>
                            <td style=""padding: 10px 8px 4px 8px; text-align: right; color: #1e293b;"">{dto.SubtotalAmount:N0} đ</td>
                        </tr>
                        <tr>
                            <td colspan=""3"" style=""padding: 4px 8px; text-align: right; color: #64748b;"">Phí vận chuyển:</td>
                            <td style=""padding: 4px 8px; text-align: right; color: #1e293b;"">{dto.ShippingFee:N0} đ</td>
                        </tr>
                        {couponRow}
                        <tr style=""border-top: 2px solid #cbd5e1;"">
                            <td colspan=""3"" style=""padding: 12px 8px; text-align: right; font-size: 15px; font-weight: bold; color: #1e293b;"">Tổng thanh toán:</td>
                            <td style=""padding: 12px 8px; text-align: right; font-size: 18px; font-weight: bold; color: {BrandColor};"">{dto.TotalAmount:N0} đ</td>
                        </tr>
                    </tfoot>
                </table>
            </div>";

        return WrapLayout($"Xác nhận đơn hàng #{dto.OrderNumber} - MadK Store", body);
    }

    public string RenderOrderStatusChanged(OrderStatusChangedEmailDto dto)
    {
        var safeName = WebUtility.HtmlEncode(dto.RecipientName);
        var safeOrderNumber = WebUtility.HtmlEncode(dto.OrderNumber);
        var safeOldStatus = WebUtility.HtmlEncode(TranslateStatus(dto.OldStatus));
        var safeNewStatus = WebUtility.HtmlEncode(TranslateStatus(dto.NewStatus));

        string reasonNoteHtml = "";
        if (!string.IsNullOrWhiteSpace(dto.Reason) || !string.IsNullOrWhiteSpace(dto.Note))
        {
            var content = dto.Reason ?? dto.Note;
            reasonNoteHtml = $@"
                <div style=""margin: 15px 0; padding: 12px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #94a3b8; font-size: 13px; color: #334155;"">
                    <strong>Ghi chú cập nhật:</strong> {WebUtility.HtmlEncode(content)}
                </div>";
        }

        var (statusBg, statusColor) = GetStatusColor(dto.NewStatus);

        var body = $@"
            <div style=""padding: 10px 0;"">
                <h2 style=""color: #1e293b; margin-bottom: 8px;"">Cập nhật đơn hàng #{safeOrderNumber}</h2>
                <p style=""color: #64748b; font-size: 15px; line-height: 1.6;"">
                    Xin chào <strong>{safeName}</strong>, đơn hàng <strong>#{safeOrderNumber}</strong> của bạn vừa có cập nhật trạng thái mới.
                </p>

                <div style=""margin: 25px 0; text-align: center;"">
                    <div style=""display: inline-flex; align-items: center; justify-content: center; gap: 12px; padding: 14px 20px; background-color: #f1f5f9; border-radius: 8px;"">
                        <span style=""color: #94a3b8; text-decoration: line-through; font-size: 14px;"">{safeOldStatus}</span>
                        <span style=""color: #64748b; font-size: 16px;"">➔</span>
                        <span style=""background-color: {statusBg}; color: {statusColor}; font-weight: bold; padding: 4px 12px; border-radius: 9999px; font-size: 14px;"">
                            {safeNewStatus}
                        </span>
                    </div>
                </div>

                {reasonNoteHtml}

                <div style=""margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; color: #475569;"">
                    <strong>Tổng giá trị đơn:</strong> <span style=""font-weight: 600; color: #1e293b;"">{dto.TotalAmount:N0} đ</span><br/>
                    <strong>Thời gian cập nhật:</strong> {dto.ChangedAt.ToLocalTime():dd/MM/yyyy HH:mm}
                </div>
            </div>";

        return WrapLayout($"Đơn hàng #{dto.OrderNumber}: {safeNewStatus} - MadK Store", body);
    }

    private static string WrapLayout(string title, string innerHtml)
    {
        return $@"
<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""utf-8""/>
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
    <title>{WebUtility.HtmlEncode(title)}</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #f1f5f9; padding: 25px 10px;"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background-color: {DarkBg}; padding: 24px 30px; text-align: left;"">
                            <table width=""100%"" border=""0"" cellpadding=""0"" cellspacing=""0"">
                                <tr>
                                    <td>
                                        <span style=""font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;"">MadK<span style=""color: #818cf8;"">Store</span></span>
                                    </td>
                                    <td style=""text-align: right; color: #94a3b8; font-size: 12px;"">
                                        Mechanical Keyboards & Gear
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                        <td style=""padding: 30px;"">
                            {innerHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f8fafc; border-top: 1px solid {BorderColor}; padding: 20px 30px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;"">
                            <p style=""margin: 0 0 6px 0;"">MadK Store - Bàn phím cơ & Phụ kiện cao cấp</p>
                            <p style=""margin: 0;"">Email này được gửi tự động từ hệ thống. Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ <a href=""mailto:support@madkstore.local"" style=""color: {BrandColor}; text-decoration: none;"">support@madkstore.local</a>.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }

    private static string TranslateStatus(string status)
    {
        return status.Trim().ToLowerInvariant() switch
        {
            "pending" => "Chờ xác nhận",
            "pendingpayment" => "Chờ thanh toán",
            "confirmed" => "Đã xác nhận",
            "processing" => "Đang xử lý / Đóng gói",
            "shipping" => "Đang giao hàng",
            "completed" => "Giao hàng thành công",
            "cancelled" => "Đã hủy đơn",
            "returnrequested" => "Yêu cầu đổi trả",
            "returned" => "Đã hoàn hàng",
            _ => status
        };
    }

    private static (string bg, string text) GetStatusColor(string status)
    {
        return status.Trim().ToLowerInvariant() switch
        {
            "pending" => ("#fef3c7", "#d97706"),
            "pendingpayment" => ("#fef9c3", "#a16207"),
            "confirmed" => ("#dbeafe", "#1d4ed8"),
            "processing" => ("#e0e7ff", "#4338ca"),
            "shipping" => ("#ede9fe", "#6d28d9"),
            "completed" => ("#dcfce7", "#15803d"),
            "cancelled" => ("#fee2e2", "#b91c1c"),
            "returned" => ("#ffedd5", "#c2410c"),
            _ => ("#f1f5f9", "#475569")
        };
    }
}
