using System.Globalization;
using System.Text;

namespace MadK.Application.Common;

public static class StringUtils
{
    /// <summary>
    /// Chuyển đổi chuỗi tiếng Việt có dấu sang không dấu (lowercase, trim).
    /// Ví dụ: "Điện thoại thông minh" -> "dien thoai thong minh"
    /// </summary>
    public static string RemoveVietnameseTones(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        return sb.ToString()
            .Normalize(NormalizationForm.FormC)
            .Replace('đ', 'd')
            .Replace('Đ', 'd')
            .ToLowerInvariant()
            .Trim();
    }
}
