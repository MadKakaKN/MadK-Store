using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MadK.Application.DTOs.Ai;

namespace MadK.Application.Interfaces;

public interface IAiShoppingAssistantService
{
    Task<AiChatResponseDto> ChatAsync(AiChatRequestDto request, CancellationToken ct = default);
    Task<List<string>> GetQuickPromptsAsync(CancellationToken ct = default);
}
