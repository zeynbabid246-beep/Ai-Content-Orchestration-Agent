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
    private readonly IAiCreativeService _aiCreativeService;

    public AiController(IAiContentService aiContentService, IAiCreativeService aiCreativeService)
    {
        _aiContentService = aiContentService;
        _aiCreativeService = aiCreativeService;
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

    [HttpPost("campaigns/strategy")]
    public async Task<ActionResult<CampaignStrategyStepResponseDto>> GenerateCampaignStrategy(
        Guid teamId,
        [FromBody] CampaignAiPipelineConfigDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _aiContentService.GenerateCampaignStrategyStepAsync(teamId, userId, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("campaigns/planning")]
    public async Task<ActionResult<CampaignPlanningStepResponseDto>> GenerateCampaignPlanning(
        Guid teamId,
        [FromBody] CampaignPlanningStepRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _aiContentService.GenerateCampaignPlanningStepAsync(teamId, userId, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("campaigns/content")]
    public async Task<ActionResult<CampaignContentStepResponseDto>> GenerateCampaignContent(
        Guid teamId,
        [FromBody] CampaignContentStepRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _aiContentService.GenerateCampaignContentStepAsync(teamId, userId, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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

    [HttpPost("campaigns/materialize")]
    public async Task<ActionResult<MaterializeCampaignResponseDto>> MaterializeCampaign(
        Guid teamId,
        [FromBody] MaterializeCampaignRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _aiContentService.MaterializeCampaignAsync(teamId, userId, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sync-brand")]
    public async Task<IActionResult> SyncBrand(Guid teamId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            await _aiContentService.SyncBrandToAiAsync(teamId, userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("health")]
    public async Task<ActionResult<AiHealthResponseDto>> GetHealth()
    {
        var result = await _aiContentService.GetAiHealthAsync();
        return Ok(result);
    }

    [HttpPost("assistant/chat")]
    public async Task<ActionResult<AssistantChatResponseDto>> ChatWithAssistant(
        Guid teamId,
        [FromBody] AssistantChatRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _aiContentService.ChatWithAssistantAsync(teamId, userId, dto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("LocalBackend", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("creative/generate-preview")]
    public async Task<ActionResult<GenerateCreativePreviewResponseDto>> GenerateCreativePreview(
        Guid teamId,
        [FromBody] GenerateCreativePreviewRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _aiCreativeService.GeneratePreviewAsync(teamId, userId, dto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("LocalBackend", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("creative/generate")]
    public async Task<ActionResult<GeneratePostCreativeResponseDto>> GeneratePostCreative(
        Guid teamId,
        [FromBody] GeneratePostCreativeRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _aiCreativeService.GenerateForPostAsync(teamId, userId, dto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("LocalBackend", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
