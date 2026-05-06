using AiContentFlow.Application.Features.Analytics;
using AiContentFlow.Application.Features.Analytics.Dtos;
using AiContentFlow.Application.Features.Publications;
using AiContentFlow.Application.Features.Publications.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}")]
public class PublicationsController : ControllerBase
{
    private readonly IPublicationService _publicationService;
    private readonly IAnalyticsService _analyticsService;

    public PublicationsController(IPublicationService publicationService, IAnalyticsService analyticsService)
    {
        _publicationService = publicationService;
        _analyticsService = analyticsService;
    }

    [HttpPost("content-posts/{contentPostId:int}/publications")]
    public async Task<ActionResult<PublicationResponseDto>> Publish(Guid teamId, int contentPostId, [FromBody] PublishPublicationDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _publicationService.PublishAsync(teamId, contentPostId, userId, dto);
        return Accepted(result);
    }

    [HttpPost("content-posts/{contentPostId:int}/publications/scheduled")]
    public async Task<ActionResult<PublicationResponseDto>> Schedule(Guid teamId, int contentPostId, [FromBody] SchedulePublicationDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _publicationService.ScheduleAsync(teamId, contentPostId, userId, dto);
        return Accepted(result);
    }

    [HttpGet("publications/{publicationId:int}/analytics")]
    public async Task<ActionResult<List<PublicationAnalyticsResponseDto>>> GetAnalytics(Guid teamId, int publicationId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _analyticsService.GetByPublicationAsync(teamId, publicationId, userId);
        return Ok(result);
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
