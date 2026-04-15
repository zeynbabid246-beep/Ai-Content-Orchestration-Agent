using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/content-posts")]
public class ContentPostsController : ControllerBase
{
    private readonly IContentPostService _contentPostService;

    public ContentPostsController(IContentPostService contentPostService)
    {
        _contentPostService = contentPostService;
    }

    [HttpPost]
    public async Task<ActionResult<ContentPostResponseDto>> Create(Guid teamId, [FromBody] CreateContentPostDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _contentPostService.CreateAsync(teamId, userId, dto);
        return CreatedAtAction(nameof(GetById), new { teamId, contentPostId = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<ContentPostResponseDto>>> GetByTeam(Guid teamId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var contentPosts = await _contentPostService.GetByTeamAsync(teamId, userId);
        return Ok(contentPosts);
    }

    [HttpGet("{contentPostId:int}")]
    public async Task<ActionResult<ContentPostResponseDto>> GetById(Guid teamId, int contentPostId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var contentPost = await _contentPostService.GetByIdAsync(teamId, contentPostId, userId);
        return Ok(contentPost);
    }

    [HttpPut("{contentPostId:int}")]
    public async Task<ActionResult<ContentPostResponseDto>> Update(Guid teamId, int contentPostId, [FromBody] UpdateContentPostDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var updated = await _contentPostService.UpdateAsync(teamId, contentPostId, userId, dto);
        return Ok(updated);
    }

    [HttpPost("{contentPostId:int}/workflow/transition")]
    public async Task<ActionResult<ContentPostResponseDto>> TransitionStatus(Guid teamId, int contentPostId, [FromBody] TransitionContentPostStatusDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var updated = await _contentPostService.TransitionStatusAsync(teamId, contentPostId, userId, dto);
        return Ok(updated);
    }

    [HttpPost("{contentPostId:int}/workflow/schedule")]
    public async Task<ActionResult<ContentPostResponseDto>> Schedule(Guid teamId, int contentPostId, [FromBody] ScheduleContentPostDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var updated = await _contentPostService.ScheduleAsync(teamId, contentPostId, userId, dto);
        return Ok(updated);
    }

    [HttpPost("{contentPostId:int}/workflow/publish")]
    public async Task<ActionResult<ContentPostResponseDto>> Publish(Guid teamId, int contentPostId, [FromBody] PublishContentPostDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var updated = await _contentPostService.PublishAsync(teamId, contentPostId, userId, dto);
        return Ok(updated);
    }

    [HttpDelete("{contentPostId:int}")]
    public async Task<IActionResult> Delete(Guid teamId, int contentPostId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _contentPostService.DeleteAsync(teamId, contentPostId, userId);
        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
