using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/publish-jobs")]
public class PublishJobsController : ControllerBase
{
    private readonly IPublishJobRepository _publishJobRepository;
    private readonly ITeamRepository _teamRepository;

    public PublishJobsController(IPublishJobRepository publishJobRepository, ITeamRepository teamRepository)
    {
        _publishJobRepository = publishJobRepository;
        _teamRepository = teamRepository;
    }

    [HttpGet]
    public async Task<ActionResult<List<PublishJobResponseDto>>> GetJobs(
        Guid teamId,
        [FromQuery] string status = "DeadLettered")
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        if (!await _teamRepository.IsUserMemberAsync(teamId, userId))
            return Unauthorized("Not a team member");

        if (!Enum.TryParse<PublishJobStatus>(status, true, out var jobStatus))
            return BadRequest(new { message = "Invalid publish job status." });

        var jobs = await _publishJobRepository.GetByTeamAndStatusAsync(teamId, jobStatus);
        return Ok(jobs.Select(j => new PublishJobResponseDto(
            j.Id,
            j.PostPublicationId,
            j.Status.ToString(),
            j.RetryCount,
            j.LastError,
            j.ScheduledAt,
            j.CompletedAt)).ToList());
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }

    public record PublishJobResponseDto(
        int Id,
        int PostPublicationId,
        string Status,
        int RetryCount,
        string? LastError,
        DateTime ScheduledAt,
        DateTime? CompletedAt);
}
