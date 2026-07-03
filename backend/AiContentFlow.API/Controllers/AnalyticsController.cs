using AiContentFlow.Application.Features.Analytics;
using AiContentFlow.Application.Features.Analytics.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsAggregationService _aggregationService;

    public AnalyticsController(IAnalyticsAggregationService aggregationService)
    {
        _aggregationService = aggregationService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetTeamSummary(
        Guid teamId,
        [FromQuery] int days = 30)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var summary = await _aggregationService.GetTeamSummaryAsync(teamId, userId, days);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpGet("channels/{channelId:int}/summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetChannelSummary(
        Guid teamId,
        int channelId,
        [FromQuery] int days = 30)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var summary = await _aggregationService.GetChannelSummaryAsync(teamId, channelId, userId, days);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpGet("channels/{channelId:int}/campaigns/{campaignId:int}/summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetCampaignSummary(
        Guid teamId,
        int channelId,
        int campaignId,
        [FromQuery] int days = 30)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var summary = await _aggregationService.GetCampaignSummaryAsync(
                teamId,
                channelId,
                campaignId,
                userId,
                days);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpGet("platforms/{platform}/posts")]
    public async Task<ActionResult<IReadOnlyList<AnalyticsSummaryDto>>> GetPlatformPosts(
        Guid teamId,
        string platform,
        [FromQuery] int days = 30)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var posts = await _aggregationService.GetPlatformPostsAsync(teamId, userId, platform, days);
            return Ok(posts);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
