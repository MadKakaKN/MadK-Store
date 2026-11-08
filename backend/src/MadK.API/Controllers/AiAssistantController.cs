using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MadK.Application.Common;
using MadK.Application.DTOs.Ai;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/ai")]
[AllowAnonymous]
public class AiAssistantController : ControllerBase
{
    private readonly IAiShoppingAssistantService _aiAssistantService;

    public AiAssistantController(IAiShoppingAssistantService aiAssistantService)
    {
        _aiAssistantService = aiAssistantService;
    }

    /// <summary>
    /// Gửi câu hỏi tư vấn công nghệ & sản phẩm tới Trợ lý AI MadK.
    /// </summary>
    [HttpPost("chat")]
    [ProducesResponseType(typeof(Result<AiChatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Chat([FromBody] AiChatRequestDto request, CancellationToken ct)
    {
        var result = await _aiAssistantService.ChatAsync(request, ct);
        return Ok(Result<AiChatResponseDto>.Success(result));
    }

    /// <summary>
    /// Lấy danh sách các câu hỏi gợi ý nhanh cho khách hàng.
    /// </summary>
    [HttpGet("prompts")]
    [ProducesResponseType(typeof(Result<List<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPrompts(CancellationToken ct)
    {
        var prompts = await _aiAssistantService.GetQuickPromptsAsync(ct);
        return Ok(Result<List<string>>.Success(prompts));
    }
}
