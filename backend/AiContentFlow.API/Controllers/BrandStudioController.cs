using AiContentFlow.Application.Features.BrandStudio;
using AiContentFlow.Application.Features.BrandStudio.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("sensitive")]
[Route("api/teams/{teamId:guid}/brand-studio")]
public class BrandStudioController : ControllerBase
{
    private readonly IBrandStudioService _brandStudioService;

    public BrandStudioController(IBrandStudioService brandStudioService)
    {
        _brandStudioService = brandStudioService;
    }

    [HttpGet]
    public async Task<ActionResult<BrandStudioSnapshotDto>> Get(Guid teamId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _brandStudioService.GetAsync(teamId, userId);
        return Ok(result);
    }

    [HttpPost("import")]
    public async Task<ActionResult<CreateBrandImportResponseDto>> Import(Guid teamId, [FromBody] CreateBrandImportDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _brandStudioService.StartImportAsync(teamId, userId, dto);
        return AcceptedAtAction(nameof(GetJob), new { teamId, jobId = result.Job.Id }, result);
    }

    [HttpGet("jobs")]
    public async Task<ActionResult<List<BrandImportJobDto>>> GetJobs(Guid teamId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _brandStudioService.GetJobsAsync(teamId, userId);
        return Ok(result);
    }

    [HttpPatch]
    public async Task<ActionResult<TeamBrandStudioDto>> Update(Guid teamId, [FromBody] UpdateBrandStudioDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _brandStudioService.UpdateAsync(teamId, userId, dto);
        return Ok(result);
    }

    [HttpGet("jobs/{jobId:int}")]
    public async Task<ActionResult<BrandImportJobDto>> GetJob(Guid teamId, int jobId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _brandStudioService.GetJobAsync(teamId, jobId, userId);
        return Ok(result);
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
