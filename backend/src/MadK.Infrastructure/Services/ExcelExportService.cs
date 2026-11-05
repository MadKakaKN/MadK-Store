using System.Text;
using MadK.Application.DTOs.Inventory;
using MadK.Application.DTOs.Order;
using MadK.Application.DTOs.Reporting;
using MadK.Application.Interfaces;
using MadK.Domain.Enums;

namespace MadK.Infrastructure.Services;

public class ExcelExportService : IExcelExportService
{
    private static readonly Encoding Utf8WithBom = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true);

    public byte[] ExportRevenueReportToCsv(RevenueReportDto report, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var sb = new StringBuilder();

        // 1. Tiêu đề báo cáo
        sb.AppendLine("BÁO CÁO DOANH THU & HIỆU QUẢ KINH DOANH MADK-STORE");
        sb.AppendLine($"Thời gian: Từ {fromDate?.ToString("dd/MM/yyyy") ?? "Tất cả"} đến {toDate?.ToString("dd/MM/yyyy") ?? "Hiện tại"}");
        sb.AppendLine($"Ngày xuất báo cáo: {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm:ss}");
        sb.AppendLine();

        // 2. Tóm tắt chỉ số tài chính (KPIs)
        sb.AppendLine("CHỈ SỐ TỔNG QUAN,GIÁ TRỊ");
        sb.AppendLine($"Tổng doanh thu,{EscapeCsv(report.TotalRevenue.ToString("N0"))} đ");
        sb.AppendLine($"Lợi nhuận gộp,{EscapeCsv(report.GrossProfit.ToString("N0"))} đ");
        sb.AppendLine($"Tỷ suất lợi nhuận gộp,{EscapeCsv(report.GrossMarginPercentage.ToString("F2"))}%");
        sb.AppendLine($"Tổng số đơn hàng,{report.TotalOrders}");
        sb.AppendLine($"Số đơn thành công,{report.CompletedOrders}");
        sb.AppendLine($"Số đơn bị hủy,{report.CancelledOrders}");
        sb.AppendLine($"Giá trị đơn trung bình (AOV),{EscapeCsv(report.AverageOrderValue.ToString("N0"))} đ");
        sb.AppendLine();

        // 3. Bảng kê theo ngày
        sb.AppendLine("CHI TIẾT THEO NGÀY");
        sb.AppendLine("Ngày,Số đơn hàng,Doanh thu (VNĐ),Lợi nhuận gộp (VNĐ)");
        if (report.DailyStats != null && report.DailyStats.Count > 0)
        {
            foreach (var stat in report.DailyStats)
            {
                sb.AppendLine($"{EscapeCsv(stat.Date)},{stat.OrderCount},{EscapeCsv(stat.Revenue.ToString("N0"))},{EscapeCsv(stat.GrossProfit.ToString("N0"))}");
            }
        }
        else
        {
            sb.AppendLine("Không có dữ liệu phát sinh trong kỳ,0,0,0");
        }
        sb.AppendLine();

        // 4. Bảng top sản phẩm bán chạy
        sb.AppendLine("TOP SẢN PHẨM BÁN CHẠY NHẤT");
        sb.AppendLine("Tên sản phẩm,Phân loại (Biến thể),SKU,Số lượng đã bán,Doanh thu (VNĐ),Lợi nhuận gộp (VNĐ)");
        if (report.TopProducts != null && report.TopProducts.Count > 0)
        {
            foreach (var p in report.TopProducts)
            {
                sb.AppendLine($"{EscapeCsv(p.ProductName)},{EscapeCsv(p.VariantName)},{EscapeCsv(p.Sku)},{p.QuantitySold},{EscapeCsv(p.Revenue.ToString("N0"))},{EscapeCsv(p.GrossProfit.ToString("N0"))}");
            }
        }
        else
        {
            sb.AppendLine("Không có sản phẩm nào bán ra trong kỳ,-,-,0,0,0");
        }

        return WriteCsvWithBom(sb.ToString());
    }

    public byte[] ExportOrdersToCsv(IEnumerable<OrderDto> orders)
    {
        var sb = new StringBuilder();

        sb.AppendLine("DANH SÁCH ĐƠN HÀNG MADK-STORE");
        sb.AppendLine($"Thời điểm xuất file: {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm:ss}");
        sb.AppendLine();

        // Headers
        sb.AppendLine("Mã đơn hàng,Ngày đặt,Tên khách hàng,Số điện thoại,Địa chỉ giao hàng,Phương thức thanh toán,Trạng thái đơn,Trạng thái thanh toán,Tiền hàng (VNĐ),Phí ship (VNĐ),Giảm giá (VNĐ),Tổng thanh toán (VNĐ),Ghi chú");

        if (orders != null)
        {
            foreach (var order in orders)
            {
                var (recipientName, recipientPhone, fullAddress) = ParseAddressSnapshot(order.ShippingAddressSnapshot);

                string paymentMethodStr = order.PaymentMethod switch
                {
                    PaymentMethod.BankTransfer => "Chuyển khoản VietQR",
                    PaymentMethod.MoMo => "Ví điện tử MoMo",
                    PaymentMethod.VNPay => "Cổng VNPay",
                    _ => "COD (Thanh toán khi nhận hàng)"
                };

                string orderStatusStr = order.Status switch
                {
                    OrderStatus.Pending => "Chờ xác nhận",
                    OrderStatus.PendingPayment => "Chờ thanh toán",
                    OrderStatus.Confirmed => "Đã xác nhận",
                    OrderStatus.Processing => "Đang chuẩn bị hàng",
                    OrderStatus.Shipping => "Đang giao hàng",
                    OrderStatus.Completed => "Hoàn thành",
                    OrderStatus.Cancelled => "Đã hủy",
                    OrderStatus.ReturnRequested => "Yêu cầu đổi trả",
                    OrderStatus.Returned => "Đã đổi trả",
                    _ => order.Status.ToString()
                };

                string paymentStatusStr = order.PaymentStatus switch
                {
                    PaymentStatus.Paid => "Đã thanh toán",
                    PaymentStatus.Pending => "Chờ thanh toán",
                    PaymentStatus.Failed => "Thanh toán thất bại",
                    PaymentStatus.Refunded => "Đã hoàn tiền",
                    _ => order.PaymentStatus.ToString()
                };

                sb.AppendLine(string.Join(",",
                    EscapeCsv(order.OrderNumber),
                    EscapeCsv(order.CreatedAt.AddHours(7).ToString("dd/MM/yyyy HH:mm")),
                    EscapeCsv(recipientName),
                    EscapeCsv(recipientPhone),
                    EscapeCsv(fullAddress),
                    EscapeCsv(paymentMethodStr),
                    EscapeCsv(orderStatusStr),
                    EscapeCsv(paymentStatusStr),
                    EscapeCsv(order.SubtotalAmount.ToString("N0")),
                    EscapeCsv(order.ShippingFee.ToString("N0")),
                    EscapeCsv(order.DiscountAmount.ToString("N0")),
                    EscapeCsv(order.TotalAmount.ToString("N0")),
                    EscapeCsv(order.CustomerNote ?? "")
                ));
            }
        }

        return WriteCsvWithBom(sb.ToString());
    }

    public byte[] ExportInventoryToCsv(IEnumerable<VariantInventoryItemDto> items)
    {
        var sb = new StringBuilder();

        sb.AppendLine("BẢNG KIỂM KÊ TỒN KHO CHI TIẾT MADK-STORE");
        sb.AppendLine($"Thời điểm xuất file: {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm:ss}");
        sb.AppendLine();

        // Headers
        sb.AppendLine("Mã SKU,Tên sản phẩm,Phân loại (Màu/Size),Tồn thực tế (OnHand),Tồn đang giữ (Reserved),Tồn khả dụng (Available),Giá vốn (VNĐ),Giá bán (VNĐ),Tình trạng kho,Cập nhật lần cuối");

        if (items != null)
        {
            foreach (var item in items)
            {
                string status = item.AvailableQuantity <= 0 ? "HẾT HÀNG" :
                                item.AvailableQuantity <= 3 ? "SẮP HẾT HÀNG" : "Còn hàng";

                var updateTime = item.UpdatedAt.HasValue
                    ? item.UpdatedAt.Value.AddHours(7).ToString("dd/MM/yyyy HH:mm")
                    : "-";

                sb.AppendLine(string.Join(",",
                    EscapeCsv(item.Sku),
                    EscapeCsv(item.ProductName),
                    EscapeCsv(item.VariantName),
                    item.OnHandQuantity,
                    item.ReservedQuantity,
                    item.AvailableQuantity,
                    EscapeCsv(item.CostPrice.ToString("N0")),
                    EscapeCsv(item.SalePrice.ToString("N0")),
                    EscapeCsv(status),
                    EscapeCsv(updateTime)
                ));
            }
        }

        return WriteCsvWithBom(sb.ToString());
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";

        bool mustQuote = value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r');
        if (mustQuote)
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    private static (string Name, string Phone, string Address) ParseAddressSnapshot(string? snapshot)
    {
        if (string.IsNullOrWhiteSpace(snapshot)) return ("Khách hàng", "", "");

        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(snapshot);
            var root = doc.RootElement;

            string name = root.TryGetProperty("recipientName", out var n) ? n.GetString() ?? "Khách hàng" : "Khách hàng";
            string phone = root.TryGetProperty("phoneNumber", out var p) ? p.GetString() ?? "" : "";
            string address = root.TryGetProperty("fullAddress", out var a) ? a.GetString() ?? "" : "";

            return (name, phone, address);
        }
        catch
        {
            return ("Khách hàng", "", "");
        }
    }

    private static byte[] WriteCsvWithBom(string text)
    {
        var preamble = Utf8WithBom.GetPreamble();
        var contentBytes = Utf8WithBom.GetBytes(text);
        var result = new byte[preamble.Length + contentBytes.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(contentBytes, 0, result, preamble.Length, contentBytes.Length);
        return result;
    }
}
