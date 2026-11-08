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
            "Tư vấn laptop gaming tầm 20 - 30 triệu cấu hình mạnh",
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
                "Xin chào! Tôi là Trợ lý AI của MadK Store. Bạn đang quan tâm đến laptop, gaming gear hay phụ kiện công nghệ nào?",
                new List<AiRecommendedProductDto>()
            );
        }

        // Lấy danh mục sản phẩm đang mở bán từ cơ sở dữ liệu
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Variants)
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.IsFeatured)
            .ThenBy(p => p.Name)
            .Take(60)
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

        // Fallback Engine: Bộ tư vấn chuyên gia phân tích ngữ nghĩa & lọc cấu hình thông minh
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

        // Tạo context danh mục sản phẩm ngắn gọn cho Gemini
        var catalogContextBuilder = new StringBuilder();
        foreach (var p in products.Take(40))
        {
            var minPrice = p.Variants.Any() ? p.Variants.Min(v => v.SalePrice > 0 ? v.SalePrice : v.OriginalPrice) : p.BasePrice;
            catalogContextBuilder.AppendLine($"- ID: {p.Id} | Tên: {p.Name} | Hãng: {p.Brand?.Name} | Danh mục: {p.Category?.Name} | Giá: {minPrice:N0}đ");
        }

        var systemPrompt = $@"Bạn là MadK AI Tech Assistant - Chuyên gia tư vấn công nghệ, laptop, linh kiện máy tính và gaming gear cao cấp tại MadK Store (Việt Nam).
Nhiệm vụ của bạn:
1. Tư vấn nhiệt tình, chuyên nghiệp, súc tích và am hiểu sâu sắc về thông số phần cứng (CPU, GPU, RAM, Tần số quét, Switch phím, Cảm biến chuột, Tản nhiệt, Pin).
2. Phân tích nhu cầu của khách hàng (ngân sách, mục đích: gaming / đồ họa / văn phòng / sinh viên).
3. Đề xuất từ 1 đến 3 sản phẩm phù hợp nhất TỪ DANH MỤC CÓ SẴN dưới đây:
{catalogContextBuilder}

QUY ĐỊNH BẮT BUỘC:
- Cuối câu trả lời, hãy thêm chính xác dòng này để hệ thống hiển thị thẻ sản phẩm:
[RECOMMENDED_IDS: id1, id2]
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
                temperature = 0.7,
                maxOutputTokens = 800
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

        return new AiChatResponseDto(text, recommendedList);
    }

    private AiChatResponseDto BuildSmartCatalogRecommendation(AiChatRequestDto request, List<Product> products)
    {
        var msg = request.Message.ToLowerInvariant();
        var replyBuilder = new StringBuilder();
        var recommendedList = new List<AiRecommendedProductDto>();

        // 1. Phân tích ngân sách
        decimal? budgetVnd = request.Budget;
        var budgetMatch = Regex.Match(msg, @"(\d+([\.,]\d+)?)\s*(triệu|tr|m|vnd|đ)");
        if (budgetMatch.Success && decimal.TryParse(budgetMatch.Groups[1].Value.Replace(",", "."), out var parsedNum))
        {
            var unit = budgetMatch.Groups[3].Value.ToLower();
            if (unit.Contains("triệu") || unit.Contains("tr") || unit == "m")
            {
                budgetVnd = parsedNum * 1_000_000m;
            }
        }

        // 2. Phân tích danh mục / từ khóa
        bool isLaptop = msg.Contains("laptop") || msg.Contains("máy tính xách tay") || msg.Contains("macbook");
        bool isMouse = msg.Contains("chuột") || msg.Contains("mouse");
        bool isKeyboard = msg.Contains("bàn phím") || msg.Contains("keyboard") || msg.Contains("phím cơ");
        bool isHeadset = msg.Contains("tai nghe") || msg.Contains("headset") || msg.Contains("audio") || msg.Contains("headphone");
        bool isMonitor = msg.Contains("màn hình") || msg.Contains("monitor");
        bool isGaming = msg.Contains("game") || msg.Contains("gaming") || msg.Contains("fps") || msg.Contains("esport");
        bool isOffice = msg.Contains("văn phòng") || msg.Contains("học tập") || msg.Contains("sinh viên");
        bool isDesign = msg.Contains("đồ họa") || msg.Contains("render") || msg.Contains("photoshop") || msg.Contains("premiere") || msg.Contains("3d");

        // Lọc sản phẩm phù hợp
        var candidates = products.AsEnumerable();

        if (isLaptop)
            candidates = candidates.Where(p => p.Category?.Name.Contains("Laptop", StringComparison.OrdinalIgnoreCase) == true 
                                            || p.Name.Contains("Laptop", StringComparison.OrdinalIgnoreCase)
                                            || p.Name.Contains("MacBook", StringComparison.OrdinalIgnoreCase));
        else if (isMouse)
            candidates = candidates.Where(p => p.Category?.Name.Contains("Chuột", StringComparison.OrdinalIgnoreCase) == true 
                                            || p.Name.Contains("Chuột", StringComparison.OrdinalIgnoreCase)
                                            || p.Name.Contains("Mouse", StringComparison.OrdinalIgnoreCase));
        else if (isKeyboard)
            candidates = candidates.Where(p => p.Category?.Name.Contains("Bàn phím", StringComparison.OrdinalIgnoreCase) == true 
                                            || p.Name.Contains("Bàn phím", StringComparison.OrdinalIgnoreCase)
                                            || p.Name.Contains("Keyboard", StringComparison.OrdinalIgnoreCase));
        else if (isHeadset)
            candidates = candidates.Where(p => p.Category?.Name.Contains("Tai nghe", StringComparison.OrdinalIgnoreCase) == true 
                                            || p.Name.Contains("Tai nghe", StringComparison.OrdinalIgnoreCase)
                                            || p.Name.Contains("Headset", StringComparison.OrdinalIgnoreCase));
        else if (isMonitor)
            candidates = candidates.Where(p => p.Category?.Name.Contains("Màn hình", StringComparison.OrdinalIgnoreCase) == true 
                                            || p.Name.Contains("Màn hình", StringComparison.OrdinalIgnoreCase));

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

        var matchedProducts = candidates.Take(3).ToList();

        // Nếu không khớp chính xác danh mục nào, lấy các sản phẩm nổi bật nhất
        if (!matchedProducts.Any())
        {
            matchedProducts = products.Where(p => p.IsFeatured).Take(3).ToList();
            if (!matchedProducts.Any()) matchedProducts = products.Take(3).ToList();
        }

        // Tạo câu trả lời chi tiết
        replyBuilder.AppendLine("Chào bạn! Dưới đây là phân tích và tư vấn từ chuyên gia công nghệ MadK Store:");
        replyBuilder.AppendLine();

        if (budgetVnd.HasValue)
        {
            replyBuilder.AppendLine($"🎯 Với mức ngân sách khoảng **{budgetVnd.Value:N0}đ**, MadK Store có những lựa chọn cấu hình rất xuất sắc vừa vặn với hầu bao của bạn:");
        }
        else if (isGaming)
        {
            replyBuilder.AppendLine("🎮 Đối với nhu cầu **Gaming & E-Sports**, yếu tố then chốt là hiệu năng card đồ họa (GPU), tần số quét màn hình mượt mà và hệ thống tản nhiệt bền bỉ:");
        }
        else if (isDesign)
        {
            replyBuilder.AppendLine("🎨 Đối với nhu cầu **Thiết kế đồ họa & Render 3D**, bạn nên ưu tiên màn hình chuẩn màu (sRGB/DCI-P3 cao), vi xử lý đa nhân và RAM tối thiểu 16GB-32GB:");
        }
        else
        {
            replyBuilder.AppendLine("✨ Dựa trên yêu cầu của bạn, đây là những thiết bị công nghệ chính hãng có hiệu năng/giá thành (P/P) tốt nhất hiện nay tại cửa hàng:");
        }

        replyBuilder.AppendLine();

        foreach (var p in matchedProducts)
        {
            var minPrice = p.Variants.Any() 
                ? p.Variants.Min(v => v.SalePrice > 0 ? v.SalePrice : v.OriginalPrice) 
                : p.BasePrice;

            replyBuilder.AppendLine($"* **{p.Name}** ({p.Brand?.Name}): Giá niêm yết **{minPrice:N0}đ**");
            if (!string.IsNullOrWhiteSpace(p.ShortDescription))
            {
                replyBuilder.AppendLine($"  ↳ *{p.ShortDescription}*");
            }

            recommendedList.Add(new AiRecommendedProductDto(
                p.Id,
                p.Name,
                p.Slug,
                p.ThumbnailUrl,
                p.BasePrice,
                minPrice,
                p.Category?.Name ?? "Thiết bị",
                p.Brand?.Name ?? "Chính hãng",
                isGaming ? "Tối ưu hóa tốc độ và tản nhiệt cho trải nghiệm chơi game mượt mà." 
                         : "Hiệu năng cân bằng xuất sắc, độ bền cao, bảo hành chính hãng."
            ));
        }

        replyBuilder.AppendLine();
        replyBuilder.AppendLine("💡 **Chính sách tại MadK Store:**");
        replyBuilder.AppendLine("- 🛡️ Bảo hành chính hãng 12 - 24 tháng, lỗi 1 đổi 1 trong 30 ngày đầu.");
        replyBuilder.AppendLine("- 💎 Tích lũy điểm thưởng **MadK Rewards** đến 5% giá trị đơn hàng.");
        replyBuilder.AppendLine("- 🚚 Giao hàng hỏa tốc toàn quốc qua Giao Hàng Nhanh (GHN).");
        replyBuilder.AppendLine();
        replyBuilder.AppendLine("Bạn có muốn xem chi tiết thông số hoặc cần tôi tư vấn so sánh giữa các mẫu trên không?");

        return new AiChatResponseDto(replyBuilder.ToString().Trim(), recommendedList);
    }
}
