using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using MadK.Application.DTOs.Ai;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

/// <summary>
/// Bộ chuẩn hóa tiếng Việt, xử lý lỗi gõ Telex và nhận diện ý định danh mục thiết bị công nghệ.
/// </summary>
public static class VietnameseTextNormalizer
{
    /// <summary>
    /// Chuẩn hóa các lỗi gõ Telex phổ biến và viết tắt ngành công nghệ.
    /// </summary>
    public static string NormalizeTelex(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var text = input.Trim();

        // 1. Lỗi gõ dính phím Telex cho từ "điện" (ví dụ: 'ddieeneenj', 'ddieenj', 'dieenj', 'ddienj', 'dienj', 'ddieejn')
        text = Regex.Replace(text, @"\b(ddieeneenj|ddieenj|ddieejn|dieenj|dienj|ddienj|ddeenj|ddieen|dieen)\b", "điện", RegexOptions.IgnoreCase);
        // Lỗi gõ Telex cho từ "thoại" (ví dụ: 'thoaij', 'thooaij', 'thoaji', 'thoaị')
        text = Regex.Replace(text, @"\b(thoaij|thooaij|thoaji|thoaị|thoai)\b", "thoại", RegexOptions.IgnoreCase);

        // Cụm từ dính liền hoặc gõ sai
        text = Regex.Replace(text, @"ddieeneenj\s*thoại?", "điện thoại", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"ddieenj\s*thoaij?", "điện thoại", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"dienj\s*thoaij?", "điện thoại", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"dien\s*thoai", "điện thoại", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\bdienthoai\b", "điện thoại", RegexOptions.IgnoreCase);

        // 2. Các từ viết tắt điện thoại: đt, dt, ddt, dthoai, đthoại, dtdd
        text = Regex.Replace(text, @"\b(đt|dt|ddt|dthoai|đthoại|dtdd)\b", "điện thoại", RegexOptions.IgnoreCase);

        // 3. Phụ kiện & Gaming gear Telex typos
        text = Regex.Replace(text, @"\b(banf\s*phims?|phims\s*cow|ban\s*phim|phim\s*co)\b", "bàn phím cơ", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\b(chuoojt|chuootj|chuotj|chuot)\b", "chuột", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\b(manf\s*hinhf?|man\s*hinh)\b", "màn hình", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\b(tai\s*nghe|headphone|earphone|tai\s*phone)\b", "tai nghe", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\b(may\s*tinh\s*bang|maytinhbang)\b", "máy tính bảng", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\b(may\s*tinh\s*xach\s*tay|maytinhxachtay)\b", "máy tính xách tay", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\b(linh\s*kien|linhkien)\b", "linh kiện", RegexOptions.IgnoreCase);

        return text;
    }

    /// <summary>
    /// Xóa dấu tiếng Việt, chuyển về dạng ASCII không dấu và loại bỏ ký tự gõ thừa của Telex.
    /// </summary>
    public static string RemoveDiacritics(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalizedString.Length);

        foreach (var c in normalizedString)
        {
            var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        var result = sb.ToString().Normalize(NormalizationForm.FormC)
            .Replace('đ', 'd')
            .Replace('Đ', 'd')
            .ToLowerInvariant();

        // Xử lý các mẫu chữ cái đôi từ Telex
        result = Regex.Replace(result, @"dd", "d");
        result = Regex.Replace(result, @"ee", "e");
        result = Regex.Replace(result, @"oo", "o");
        result = Regex.Replace(result, @"aa", "a");

        return result;
    }

    public static bool IsPhoneQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("điện thoại")
            || asciiMsg.Contains("dien thoai")
            || asciiMsg.Contains("dienthoai")
            || normMsg.Contains("smartphone")
            || asciiMsg.Contains("smartphone")
            || normMsg.Contains("smart phone")
            || asciiMsg.Contains("smart phone")
            || normMsg.Contains("iphone")
            || asciiMsg.Contains("iphone")
            || normMsg.Contains("galaxy")
            || asciiMsg.Contains("galaxy")
            || Regex.IsMatch(normMsg, @"\b(đt|dt|ddt|dthoai|đthoại|dtdd)\b", RegexOptions.IgnoreCase)
            || Regex.IsMatch(asciiMsg, @"\b(dt|ddt|dthoai|dtdd)\b", RegexOptions.IgnoreCase);
    }

    public static bool IsLaptopQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("laptop")
            || asciiMsg.Contains("laptop")
            || normMsg.Contains("máy tính xách tay")
            || asciiMsg.Contains("may tinh xach tay")
            || normMsg.Contains("macbook")
            || asciiMsg.Contains("macbook")
            || Regex.IsMatch(normMsg, @"\blap\b", RegexOptions.IgnoreCase);
    }

    public static bool IsKeyboardQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("bàn phím")
            || asciiMsg.Contains("ban phim")
            || normMsg.Contains("phím cơ")
            || asciiMsg.Contains("phim co")
            || normMsg.Contains("keyboard")
            || asciiMsg.Contains("keyboard")
            || normMsg.Contains("keychron")
            || asciiMsg.Contains("keychron")
            || normMsg.Contains("blackwidow")
            || asciiMsg.Contains("blackwidow");
    }

    public static bool IsMouseQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("chuột")
            || asciiMsg.Contains("chuot")
            || normMsg.Contains("mouse")
            || asciiMsg.Contains("mouse")
            || normMsg.Contains("logitech g pro")
            || asciiMsg.Contains("deathadder");
    }

    public static bool IsHeadsetQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("tai nghe")
            || asciiMsg.Contains("tai nghe")
            || normMsg.Contains("headset")
            || asciiMsg.Contains("headset")
            || normMsg.Contains("headphone")
            || asciiMsg.Contains("headphone")
            || normMsg.Contains("earphone")
            || asciiMsg.Contains("tai phone");
    }

    public static bool IsMonitorQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("màn hình")
            || asciiMsg.Contains("man hinh")
            || normMsg.Contains("monitor")
            || asciiMsg.Contains("monitor");
    }

    public static bool IsTabletQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("máy tính bảng")
            || asciiMsg.Contains("may tinh bang")
            || normMsg.Contains("tablet")
            || asciiMsg.Contains("tablet")
            || normMsg.Contains("ipad")
            || asciiMsg.Contains("ipad");
    }

    public static bool IsComponentQuery(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("linh kiện")
            || asciiMsg.Contains("linh kien")
            || normMsg.Contains("card màn hình")
            || asciiMsg.Contains("card man hinh")
            || asciiMsg.Contains("vga")
            || asciiMsg.Contains("cpu")
            || asciiMsg.Contains("ram")
            || asciiMsg.Contains("ssd")
            || normMsg.Contains("mainboard")
            || asciiMsg.Contains("mainboard")
            || normMsg.Contains("nguồn máy tính")
            || asciiMsg.Contains("nguon may tinh");
    }

    public static bool IsAllRequest(string normMsg, string asciiMsg)
    {
        return normMsg.Contains("tất cả")
            || asciiMsg.Contains("tat ca")
            || normMsg.Contains("toàn bộ")
            || asciiMsg.Contains("toan bo")
            || normMsg.Contains("các mẫu")
            || asciiMsg.Contains("cac mau")
            || normMsg.Contains("danh sách")
            || asciiMsg.Contains("danh sach")
            || normMsg.Contains("những mẫu")
            || asciiMsg.Contains("nhung mau")
            || asciiMsg.Contains("all");
    }
}

public class AiShoppingAssistantService : IAiShoppingAssistantService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiShoppingAssistantService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public AiShoppingAssistantService(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<AiShoppingAssistantService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public Task<List<string>> GetQuickPromptsAsync(CancellationToken ct = default)
    {
        var prompts = new List<string>
        {
            "Tất cả mẫu điện thoại iPhone & Samsung mới nhất",
            "Tư vấn laptop gaming tầm 20 - 30 triệu cấu hình mạnh",
            "Điện thoại flagship chụp ảnh đẹp, pin trâu dưới 25 triệu",
            "Cần tìm chuột gaming không dây cảm biến chính xác, siêu nhẹ",
            "Gợi ý bàn phím cơ gõ văn phòng êm ái, kết nối Bluetooth",
            "Cấu hình máy tính cho thiết kế đồ họa & dựng video 4K",
            "Chính sách bảo hành và tích điểm thành viên MadK Store"
        };
        return Task.FromResult(prompts);
    }

    public async Task<AiChatResponseDto> ChatAsync(AiChatRequestDto request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return new AiChatResponseDto(
                "Xin chào! Tôi là Trợ lý AI của MadK Store. Bạn đang quan tâm đến điện thoại, laptop, linh kiện hay gaming gear nào?",
                new List<AiRecommendedProductDto>()
            );
        }

        // Lấy danh mục sản phẩm đang mở bán từ cơ sở dữ liệu (load đủ tất cả sản phẩm đang kinh doanh)
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Variants)
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.IsFeatured)
            .ThenBy(p => p.Name)
            .Take(200)
            .ToListAsync(ct);

        var apiKey = _configuration["Gemini:ApiKey"] 
            ?? _configuration["GEMINI_API_KEY"] 
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        // Nếu có Gemini API Key hợp lệ, thử gọi Google Gemini API
        if (!string.IsNullOrWhiteSpace(apiKey) && apiKey != "YOUR_GEMINI_API_KEY")
        {
            try
            {
                var geminiResult = await CallGeminiApiAsync(apiKey, request, products, ct);
                if (geminiResult != null && !string.IsNullOrWhiteSpace(geminiResult.Reply))
                {
                    return geminiResult;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gọi Gemini API thất bại hoặc vượt hạn ngạch. Chuyển sang công cụ tư vấn nội bộ.");
            }
        }

        // Fallback Engine: Bộ tư vấn chuyên gia phân tích ngữ nghĩa, sửa lỗi Telex & lọc cấu hình thông minh
        return BuildSmartCatalogRecommendation(request, products);
    }

    private async Task<AiChatResponseDto?> CallGeminiApiAsync(
        string apiKey,
        AiChatRequestDto request,
        List<Product> products,
        CancellationToken ct)
    {
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(25);

        // Tạo context danh mục sản phẩm chi tiết cho Gemini
        var catalogContextBuilder = new StringBuilder();
        foreach (var p in products.Take(80))
        {
            var minPrice = p.Variants.Any() ? p.Variants.Min(v => v.SalePrice > 0 ? v.SalePrice : v.OriginalPrice) : p.BasePrice;
            catalogContextBuilder.AppendLine($"- ID: {p.Id} | Tên: {p.Name} | Hãng: {p.Brand?.Name} | Danh mục: {p.Category?.Name} | Giá: {minPrice:N0}đ");
        }

        var systemPrompt = $@"Bạn là MadK AI Tech Assistant - Chuyên gia tư vấn công nghệ bán lẻ hàng đầu tại MadK Store (Việt Nam).
Cửa hàng kinh doanh các mặt hàng công nghệ chính hãng:
- Điện thoại thông minh (iPhone 15/14 series, Samsung Galaxy S24 series, Z Fold5, Z Flip5, Galaxy A series).
- Laptop & Máy tính xách tay (Gaming, Đồ họa, Văn phòng, Mỏng nhẹ).
- Phụ kiện & Gaming Gear (Bàn phím cơ, Chuột gaming, Tai nghe, Màn hình).
- Linh kiện PC (CPU, VGA, RAM, SSD, Nguồn, Bo mạch chủ).

QUY TẮC BẮT BUỘC VỀ PHÂN LOẠI DANH MỤC:
1. Khi khách hàng hỏi về ĐIỆN THOẠI (hoặc smartphone, iPhone, Samsung Galaxy, hoặc lỗi gõ phím telex như 'ddieeneenj thoại', 'dt', 'đt'):
   - Bạn BẮT BUỘC CHỈ ĐƯỢC đề xuất sản phẩm thuộc danh mục ĐIỆN THOẠI THÔNG MINH (iPhone, Samsung Galaxy).
   - TUYỆT ĐỐI KHÔNG ĐƯỢC đề xuất bàn phím cơ, chuột hay laptop khi khách hỏi điện thoại!
2. Khi khách hàng hỏi về BÀN PHÍM: Chỉ đề xuất bàn phím cơ.
3. Khi khách hàng hỏi về LAPTOP: Chỉ đề xuất laptop.
4. Khi khách hỏi 'cho tôi xem tất cả mẫu điện thoại' (hoặc 'tất cả mẫu...'):
   - Hãy liệt kê tổng quan đầy đủ các dòng điện thoại có trong danh mục (iPhone 15 series, Samsung S24 series, Z Fold5/Flip5, Galaxy A55) kèm mức giá và thông số nổi bật.
   - Thêm mã GUID của các sản phẩm đó vào [RECOMMENDED_IDS].

DANH MỤC SẢN PHẨM CÓ SẴN TẠI MADK STORE:
{catalogContextBuilder}

QUY ĐỊNH KỸ THUẬT:
Cuối câu trả lời, hãy thêm chính xác dòng này để hệ thống hiển thị thẻ sản phẩm tương ứng:
[RECOMMENDED_IDS: id1, id2, id3]
(Thay id1, id2 bằng mã GUID thực tế của các sản phẩm bạn gợi ý trong danh mục trên).";

        var contents = new List<object>();

        // Thêm lịch sử hội thoại gần nhất nếu có
        if (request.History != null && request.History.Any())
        {
            foreach (var h in request.History.TakeLast(6))
            {
                contents.Add(new
                {
                    role = h.Role == "assistant" ? "model" : "user",
                    parts = new[] { new { text = h.Content } }
                });
            }
        }

        // Câu hỏi hiện tại
        contents.Add(new
        {
            role = "user",
            parts = new[] { new { text = request.Message } }
        });

        var modelName = _configuration["Gemini:ModelName"] ?? "gemini-1.5-flash";
        var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = contents,
            generationConfig = new
            {
                temperature = 0.5,
                maxOutputTokens = 1000
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await httpClient.PostAsync(endpoint, jsonContent, ct);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Gemini API returned status {StatusCode}: {Error}", response.StatusCode, err);
            return null;
        }

        var resJson = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(resJson);
        var root = doc.RootElement;

        var text = root
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(text)) return null;

        // Trích xuất [RECOMMENDED_IDS: ...]
        var recommendedList = new List<AiRecommendedProductDto>();
        var match = Regex.Match(text, @"\[RECOMMENDED_IDS:\s*([^\]]+)\]", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var rawIds = match.Groups[1].Value;
            var idStrings = rawIds.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var idStr in idStrings)
            {
                if (Guid.TryParse(idStr.Trim(), out var parsedId))
                {
                    var found = products.FirstOrDefault(p => p.Id == parsedId);
                    if (found != null && !recommendedList.Any(r => r.Id == found.Id))
                    {
                        var minPrice = found.Variants.Any() 
                            ? found.Variants.Min(v => v.SalePrice > 0 ? v.SalePrice : v.OriginalPrice) 
                            : found.BasePrice;

                        recommendedList.Add(new AiRecommendedProductDto(
                            found.Id,
                            found.Name,
                            found.Slug,
                            found.ThumbnailUrl,
                            found.BasePrice,
                            minPrice,
                            found.Category?.Name ?? "Thiết bị",
                            found.Brand?.Name ?? "Chính hãng",
                            "Sản phẩm được chuyên gia AI khuyến nghị tối ưu nhất cho nhu cầu của bạn."
                        ));
                    }
                }
            }

            // Xóa thẻ kỹ thuật khỏi text trả về người dùng
            text = Regex.Replace(text, @"\[RECOMMENDED_IDS:[^\]]+\]", string.Empty).Trim();
        }

        // BẢO VỆ CHỐNG HALLUCINATION: Kiểm tra tính hợp lệ của sản phẩm đề xuất
        var normMsg = VietnameseTextNormalizer.NormalizeTelex(request.Message.ToLowerInvariant());
        var asciiMsg = VietnameseTextNormalizer.RemoveDiacritics(normMsg);
        bool isPhoneQuery = VietnameseTextNormalizer.IsPhoneQuery(normMsg, asciiMsg);

        if (isPhoneQuery)
        {
            // Loại bỏ hoàn toàn các sản phẩm không phải điện thoại (như bàn phím, laptop) nếu LLM nhầm lẫn
            recommendedList = recommendedList.Where(p => 
                p.CategoryName.Contains("Điện thoại", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("iPhone", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Galaxy", StringComparison.OrdinalIgnoreCase)).ToList();

            // Nếu Gemini không đề xuất được mẫu điện thoại nào hoặc câu trả lời chứa từ bàn phím cơ
            if (!recommendedList.Any() || text.Contains("bàn phím cơ", StringComparison.OrdinalIgnoreCase))
            {
                // Fallback an toàn về bộ tư vấn danh mục nội bộ
                return BuildSmartCatalogRecommendation(request, products);
            }
        }

        return new AiChatResponseDto(text, recommendedList);
    }

    public AiChatResponseDto BuildSmartCatalogRecommendation(AiChatRequestDto request, List<Product> products)
    {
        var rawLower = request.Message.ToLowerInvariant();
        var normalizedMsg = VietnameseTextNormalizer.NormalizeTelex(rawLower);
        var asciiMsg = VietnameseTextNormalizer.RemoveDiacritics(normalizedMsg);

        var replyBuilder = new StringBuilder();
        var recommendedList = new List<AiRecommendedProductDto>();

        // 1. Phân tích ngân sách
        decimal? budgetVnd = request.Budget;
        var budgetMatch = Regex.Match(rawLower, @"(\d+([\.,]\d+)?)\s*(triệu|tr|m|vnd|đ)");
        if (budgetMatch.Success && decimal.TryParse(budgetMatch.Groups[1].Value.Replace(",", "."), out var parsedNum))
        {
            var unit = budgetMatch.Groups[3].Value.ToLower();
            if (unit.Contains("triệu") || unit.Contains("tr") || unit == "m")
            {
                budgetVnd = parsedNum * 1_000_000m;
            }
        }

        // 2. Nhận diện danh mục bằng bộ phân tích ngữ nghĩa tiếng Việt
        bool isPhone = VietnameseTextNormalizer.IsPhoneQuery(normalizedMsg, asciiMsg);
        bool isLaptop = VietnameseTextNormalizer.IsLaptopQuery(normalizedMsg, asciiMsg);
        bool isKeyboard = VietnameseTextNormalizer.IsKeyboardQuery(normalizedMsg, asciiMsg);
        bool isMouse = VietnameseTextNormalizer.IsMouseQuery(normalizedMsg, asciiMsg);
        bool isHeadset = VietnameseTextNormalizer.IsHeadsetQuery(normalizedMsg, asciiMsg);
        bool isMonitor = VietnameseTextNormalizer.IsMonitorQuery(normalizedMsg, asciiMsg);
        bool isTablet = VietnameseTextNormalizer.IsTabletQuery(normalizedMsg, asciiMsg);
        bool isComponent = VietnameseTextNormalizer.IsComponentQuery(normalizedMsg, asciiMsg);

        // Nhận diện ý định xem toàn bộ danh mục ("tất cả mẫu", "các mẫu", "toàn bộ", ...)
        bool isAllRequest = VietnameseTextNormalizer.IsAllRequest(normalizedMsg, asciiMsg);

        // Nhu cầu chuyên biệt
        bool isGaming = normalizedMsg.Contains("game") || asciiMsg.Contains("gaming") || asciiMsg.Contains("fps") || asciiMsg.Contains("esport");
        bool isDesign = normalizedMsg.Contains("đồ họa") || asciiMsg.Contains("do hoa") || asciiMsg.Contains("render") || asciiMsg.Contains("photoshop");

        // Nhận diện thương hiệu cụ thể
        bool isApple = normalizedMsg.Contains("apple") || asciiMsg.Contains("apple") || normalizedMsg.Contains("iphone") || asciiMsg.Contains("iphone");
        bool isSamsung = normalizedMsg.Contains("samsung") || asciiMsg.Contains("samsung") || normalizedMsg.Contains("galaxy") || asciiMsg.Contains("galaxy");

        bool hasSpecificCategory = isPhone || isLaptop || isKeyboard || isMouse || isHeadset || isMonitor || isTablet || isComponent;

        // 3. Lọc danh sách ứng viên (STRICT CATEGORY ISOLATION)
        IEnumerable<Product> candidates = products;

        if (isPhone)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("dien-thoai") == true ||
                p.Category?.Name?.Contains("Điện thoại") == true ||
                p.Name.Contains("iPhone", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Galaxy", StringComparison.OrdinalIgnoreCase));

            if (isApple && !isSamsung)
            {
                var appleFiltered = candidates.Where(p => p.Brand?.Slug == "apple" || p.Name.Contains("iPhone", StringComparison.OrdinalIgnoreCase)).ToList();
                if (appleFiltered.Any()) candidates = appleFiltered;
            }
            else if (isSamsung && !isApple)
            {
                var samsungFiltered = candidates.Where(p => p.Brand?.Slug == "samsung" || p.Name.Contains("Galaxy", StringComparison.OrdinalIgnoreCase)).ToList();
                if (samsungFiltered.Any()) candidates = samsungFiltered;
            }
        }
        else if (isLaptop)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("laptop") == true ||
                p.Category?.Name?.Contains("Laptop", StringComparison.OrdinalIgnoreCase) == true ||
                p.Name.Contains("Laptop", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("MacBook", StringComparison.OrdinalIgnoreCase));
        }
        else if (isKeyboard)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("ban-phim") == true ||
                p.Category?.Name?.Contains("Bàn phím", StringComparison.OrdinalIgnoreCase) == true ||
                p.Name.Contains("Bàn phím", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Keychron", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("BlackWidow", StringComparison.OrdinalIgnoreCase));
        }
        else if (isMouse)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("chuot") == true ||
                p.Category?.Name?.Contains("Chuột", StringComparison.OrdinalIgnoreCase) == true ||
                p.Name.Contains("Chuột", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Mouse", StringComparison.OrdinalIgnoreCase));
        }
        else if (isHeadset)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("tai-nghe") == true ||
                p.Category?.Name?.Contains("Tai nghe", StringComparison.OrdinalIgnoreCase) == true ||
                p.Name.Contains("Tai nghe", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Headset", StringComparison.OrdinalIgnoreCase));
        }
        else if (isMonitor)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("man-hinh") == true ||
                p.Category?.Name?.Contains("Màn hình", StringComparison.OrdinalIgnoreCase) == true ||
                p.Name.Contains("Màn hình", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Monitor", StringComparison.OrdinalIgnoreCase));
        }
        else if (isTablet)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("may-tinh-bang") == true ||
                p.Category?.Name?.Contains("Máy tính bảng", StringComparison.OrdinalIgnoreCase) == true ||
                p.Name.Contains("iPad", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Contains("Tab", StringComparison.OrdinalIgnoreCase));
        }
        else if (isComponent)
        {
            candidates = candidates.Where(p =>
                p.Category?.Slug?.Contains("linh-kien") == true ||
                p.Category?.Name?.Contains("Linh kiện", StringComparison.OrdinalIgnoreCase) == true ||
                p.Category?.Slug?.Contains("cpu") == true ||
                p.Category?.Slug?.Contains("vga") == true ||
                p.Category?.Slug?.Contains("ram") == true ||
                p.Category?.Slug?.Contains("ssd") == true);
        }

        // Lọc theo ngân sách nếu có
        if (budgetVnd.HasValue && budgetVnd.Value > 0)
        {
            var maxAllowed = budgetVnd.Value * 1.2m; // dung sai 20%
            var budgetFiltered = candidates.Where(p => p.BasePrice <= maxAllowed).ToList();
            if (budgetFiltered.Any())
            {
                candidates = budgetFiltered;
            }
        }

        var candidateList = candidates.ToList();
        int takeCount = isAllRequest ? 10 : 4;
        List<Product> matchedProducts;

        if (hasSpecificCategory)
        {
            // CÔ LẬP DANH MỤC: Nếu khách hàng yêu cầu danh mục cụ thể, CHỈ ĐƯỢC trả về sản phẩm danh mục đó
            if (!candidateList.Any())
            {
                string catLabel = isPhone ? "Điện thoại thông minh" :
                                  isLaptop ? "Laptop" :
                                  isKeyboard ? "Bàn phím cơ" :
                                  isMouse ? "Chuột gaming" :
                                  isHeadset ? "Tai nghe" :
                                  isMonitor ? "Màn hình" :
                                  isTablet ? "Máy tính bảng" : "Linh kiện PC";

                replyBuilder.AppendLine($"Dạ hiện tại các mẫu **{catLabel}** theo tiêu chí của bạn đang trong đợt nhập kho bổ sung tại MadK Store.");
                replyBuilder.AppendLine("Bạn có muốn đăng ký nhận thông báo khi hàng về, hoặc tham khảo các dòng sản phẩm công nghệ sẵn có khác tại cửa hàng không?");
                return new AiChatResponseDto(replyBuilder.ToString().Trim(), new List<AiRecommendedProductDto>());
            }

            matchedProducts = candidateList.Take(takeCount).ToList();
        }
        else
        {
            // Không có danh mục cụ thể: lấy sản phẩm theo ngân sách hoặc nổi bật nhất
            if (candidateList.Any())
            {
                matchedProducts = candidateList.Where(p => p.IsFeatured).Take(takeCount).ToList();
                if (!matchedProducts.Any()) matchedProducts = candidateList.Take(takeCount).ToList();
            }
            else
            {
                matchedProducts = products.Where(p => p.IsFeatured).Take(takeCount).ToList();
                if (!matchedProducts.Any()) matchedProducts = products.Take(takeCount).ToList();
            }
        }

        // 4. Xây dựng câu trả lời chuyên nghiệp, chuẩn xác
        if (isPhone)
        {
            if (isAllRequest)
            {
                replyBuilder.AppendLine("Dạ chào bạn! MadK Store hiện đang phân phối đầy đủ các dòng **Điện thoại thông minh (Smartphones)** chính hãng mới nhất từ hai thương hiệu hàng đầu thế giới là **Apple** và **Samsung**:");
                replyBuilder.AppendLine();
                replyBuilder.AppendLine("📱 **Hệ sinh thái Apple iPhone Chính Hãng (VNA):**");
                replyBuilder.AppendLine("• **iPhone 15 Pro Max & iPhone 15 Pro**: Khung viền Titan hàng không vũ trụ siêu nhẹ, chip Apple A17 Pro 3nm mạnh mẽ hàng đầu, camera tiềm vọng 5x chuyên nghiệp.");
                replyBuilder.AppendLine("• **iPhone 15 & iPhone 14**: Màn hình Dynamic Island hiện đại, camera chính 48MP sắc nét và thời lượng pin cả ngày bền bỉ.");
                replyBuilder.AppendLine();
                replyBuilder.AppendLine("⚡ **Hệ sinh thái Samsung Galaxy Flagship & Màn Hình Gập:**");
                replyBuilder.AppendLine("• **Galaxy S24 Ultra / S24 Plus / S24**: Quyền năng trí tuệ nhân tạo Galaxy AI tiên phong, camera 200MP zoom 100x, khung Titan và bút S-Pen tích hợp.");
                replyBuilder.AppendLine("• **Galaxy Z Fold5 & Z Flip5**: Thiết kế màn hình gập thời thượng, bản lề Flex không kẽ hở, đa nhiệm đỉnh cao.");
                replyBuilder.AppendLine("• **Galaxy A55 5G**: Phân khúc cận cao cấp thiết kế khung kim loại sang trọng, bảo mật Knox Vault và pin 5000mAh.");
            }
            else if (budgetVnd.HasValue)
            {
                replyBuilder.AppendLine($"🎯 Với mức ngân sách khoảng **{budgetVnd.Value:N0}đ**, MadK Store xin gợi ý những mẫu điện thoại có hiệu năng, camera và thời lượng pin tối ưu nhất cho bạn:");
            }
            else
            {
                replyBuilder.AppendLine("Dạ chào bạn! Dưới đây là các mẫu **Điện thoại thông minh (Smartphones)** chính hãng nổi bật nhất tại MadK Store phù hợp với nhu cầu của bạn:");
            }
        }
        else if (isLaptop)
        {
            if (isGaming)
                replyBuilder.AppendLine("🎮 Đối với nhu cầu **Laptop Gaming & E-Sports**, MadK Store tuyển chọn những mẫu máy sở hữu GPU RTX 40-Series, màn hình tần số quét cao từ 165Hz - 240Hz và hệ thống tản nhiệt buồng hơi vapor chamber:");
            else if (isDesign)
                replyBuilder.AppendLine("🎨 Đối với nhu cầu **Laptop Đồ họa & Render 3D**, bạn nên ưu tiên màn hình chuẩn màu 100% DCI-P3, vi xử lý đa nhân Intel Core i9 / Ryzen 9 và dung lượng RAM từ 32GB:");
            else
                replyBuilder.AppendLine("💻 MadK Store xin gửi tới bạn danh sách các mẫu **Laptop chính hãng** đang được tin dùng nhất hiện nay:");
        }
        else if (isKeyboard)
        {
            replyBuilder.AppendLine("⌨️ Dưới đây là các mẫu **Bàn phím cơ cao cấp** (Keychron vỏ nhôm CNC, Razer Gaming RGB) mang lại cảm giác gõ êm ái và độ nảy xuất sắc:");
        }
        else if (isMouse)
        {
            replyBuilder.AppendLine("🖱️ Dưới đây là các mẫu **Chuột gaming không dây siêu nhẹ** với cảm biến quang học chính xác từng pixel:");
        }
        else if (isHeadset)
        {
            replyBuilder.AppendLine("🎧 Dưới đây là các mẫu **Tai nghe cao cấp** với công nghệ âm thanh vòm và chống ồn chủ động (ANC):");
        }
        else if (isMonitor)
        {
            replyBuilder.AppendLine("🖥️ Dưới đây là các mẫu **Màn hình máy tính chuyên nghiệp** chuẩn màu và tần số quét cao:");
        }
        else if (budgetVnd.HasValue)
        {
            replyBuilder.AppendLine($"🎯 Với mức ngân sách khoảng **{budgetVnd.Value:N0}đ**, MadK Store có những lựa chọn cấu hình rất xuất sắc vừa vặn với hầu bao của bạn:");
        }
        else
        {
            replyBuilder.AppendLine("✨ Dựa trên yêu cầu của bạn, đây là những thiết bị công nghệ chính hãng có hiệu năng/giá thành (P/P) tốt nhất hiện nay tại cửa hàng:");
        }

        replyBuilder.AppendLine();
        if (isPhone)
            replyBuilder.AppendLine("📋 **Danh sách các mẫu điện thoại đang có sẵn tại MadK Store:**");
        else if (isLaptop)
            replyBuilder.AppendLine("📋 **Danh sách các mẫu Laptop có sẵn tại MadK Store:**");
        else if (isKeyboard)
            replyBuilder.AppendLine("📋 **Danh sách bàn phím cơ chất lượng cao:**");
        else
            replyBuilder.AppendLine("📋 **Danh sách thiết bị đề xuất phù hợp nhất:**");

        foreach (var p in matchedProducts)
        {
            var minPrice = p.Variants.Any() 
                ? p.Variants.Min(v => v.SalePrice > 0 ? v.SalePrice : v.OriginalPrice) 
                : p.BasePrice;

            replyBuilder.AppendLine($"• **{p.Name}** ({p.Brand?.Name}): Giá niêm yết **{minPrice:N0}đ**");
            if (!string.IsNullOrWhiteSpace(p.ShortDescription))
            {
                replyBuilder.AppendLine($"  ↳ *{p.ShortDescription}*");
            }

            string reason = isPhone ? "Điện thoại chính hãng VNA, camera sắc nét, bảo hành 12 tháng 1 đổi 1 trong 30 ngày." :
                            isGaming ? "Tối ưu hóa tốc độ và tản nhiệt cho trải nghiệm chơi game mượt mà." :
                            isKeyboard ? "Switch cơ học gõ êm, kết nối đa thiết bị, độ bền cao." :
                            "Hiệu năng cân bằng xuất sắc, độ bền cao, bảo hành chính hãng.";

            recommendedList.Add(new AiRecommendedProductDto(
                p.Id,
                p.Name,
                p.Slug,
                p.ThumbnailUrl,
                p.BasePrice,
                minPrice,
                p.Category?.Name ?? (isPhone ? "Điện thoại thông minh" : "Thiết bị"),
                p.Brand?.Name ?? "Chính hãng",
                reason
            ));
        }

        replyBuilder.AppendLine();
        replyBuilder.AppendLine("💡 **Chính sách ưu đãi độc quyền tại MadK Store:**");
        if (isPhone)
        {
            replyBuilder.AppendLine("- 🛡️ Máy mới 100% nguyên seal chính hãng (VNA/Samsung VN), bảo hành 12 - 24 tháng.");
            replyBuilder.AppendLine("- 🔄 Thu cũ đổi mới trợ giá đến 2.000.000đ, trả góp 0% lãi suất xét duyệt nhanh.");
            replyBuilder.AppendLine("- 💎 Tích lũy điểm thưởng **MadK Rewards** đến 5% giá trị đơn hàng.");
            replyBuilder.AppendLine("- 🚚 Giao hàng hỏa tốc toàn quốc qua Giao Hàng Nhanh (GHN).");
            replyBuilder.AppendLine();
            replyBuilder.AppendLine("Bạn muốn xem chi tiết thông số hoặc cần tôi so sánh giữa các mẫu điện thoại nào ở trên không?");
        }
        else
        {
            replyBuilder.AppendLine("- 🛡️ Bảo hành chính hãng 12 - 24 tháng, lỗi 1 đổi 1 trong 30 ngày đầu.");
            replyBuilder.AppendLine("- 💎 Tích lũy điểm thưởng **MadK Rewards** đến 5% giá trị đơn hàng.");
            replyBuilder.AppendLine("- 🚚 Giao hàng hỏa tốc toàn quốc qua Giao Hàng Nhanh (GHN).");
            replyBuilder.AppendLine();
            replyBuilder.AppendLine("Bạn có muốn xem chi tiết thông số hoặc cần tôi tư vấn so sánh giữa các mẫu trên không?");
        }

        return new AiChatResponseDto(replyBuilder.ToString().Trim(), recommendedList);
    }
}
