using System;
using System.Collections.Generic;

namespace MadK.Application.DTOs.Ai;

public record AiChatMessageDto(
    string Role, // "user" hoặc "assistant"
    string Content
);

public record AiChatRequestDto(
    string Message,
    List<AiChatMessageDto>? History = null,
    decimal? Budget = null,
    string? Category = null
);

public record AiRecommendedProductDto(
    Guid Id,
    string Name,
    string Slug,
    string? ThumbnailUrl,
    decimal BasePrice,
    decimal? MinPrice,
    string CategoryName,
    string BrandName,
    string Reason
);

public record AiChatResponseDto(
    string Reply,
    List<AiRecommendedProductDto> RecommendedProducts
);

public class GeminiSettings
{
    public const string SectionName = "Gemini";
    public string? ApiKey { get; set; }
    public string ModelName { get; set; } = "gemini-1.5-flash";
}
