using AiContentFlow.Application.Features.Ai;
using AiContentFlow.Application.Features.Ai.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("sensitive")]
[Route("api/teams/{teamId:guid}/ai")]
public class AiController : ControllerBase
{
    private readonly IAiContentService _aiContentService;

    public AiController(IAiContentService aiContentService)
    {
        _aiContentService = aiContentService;
    }

    [HttpPost("generate-post")]
    public async Task<ActionResult<GeneratePostResponseDto>> GeneratePost(
        Guid teamId,
        [FromBody] GeneratePostRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        var result = await _aiContentService.GeneratePostAsync(teamId, userId, dto);
        return Ok(result);
    }

    [HttpPost("campaigns/suggest")]
    public async Task<ActionResult<SuggestCampaignResponseDto>> SuggestCampaign(
        Guid teamId,
        [FromBody] SuggestCampaignRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        var result = await _aiContentService.SuggestCampaignAsync(teamId, userId, dto);
        return Ok(result);
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
