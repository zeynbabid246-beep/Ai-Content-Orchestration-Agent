using AiContentFlow.Application.Features.Campaigns;
using AiContentFlow.Application.Features.Campaigns.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/campaigns")]
public class CampaignsController : ControllerBase
{
    private readonly ICampaignService _campaignService;

    public CampaignsController(ICampaignService campaignService)
    {
        _campaignService = campaignService;
    }

    [HttpPost]
    public async Task<ActionResult<CampaignResponseDto>> Create(Guid teamId, [FromBody] CreateCampaignDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _campaignService.CreateAsync(teamId, userId, dto);
        return CreatedAtAction(nameof(GetById), new { teamId, campaignId = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<CampaignResponseDto>>> GetByTeam(Guid teamId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var campaigns = await _campaignService.GetByTeamAsync(teamId, userId);
        return Ok(campaigns);
    }

    [HttpGet("{campaignId:int}")]
    public async Task<ActionResult<CampaignResponseDto>> GetById(Guid teamId, int campaignId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var campaign = await _campaignService.GetByIdAsync(teamId, campaignId, userId);
        return Ok(campaign);
    }

    [HttpPut("{campaignId:int}")]
    public async Task<ActionResult<CampaignResponseDto>> Update(Guid teamId, int campaignId, [FromBody] UpdateCampaignDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var campaign = await _campaignService.UpdateAsync(teamId, campaignId, userId, dto);
        return Ok(campaign);
    }

    [HttpDelete("{campaignId:int}")]
    public async Task<IActionResult> Delete(Guid teamId, int campaignId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _campaignService.DeleteAsync(teamId, campaignId, userId);
        return NoContent();
    }

    [HttpPost("{campaignId:int}/content-post-links")]
    public async Task<IActionResult> LinkContentPost(Guid teamId, int campaignId, [FromBody] LinkCampaignContentPostDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _campaignService.LinkContentPostAsync(teamId, campaignId, userId, dto.ContentPostId);
        return NoContent();
    }

    [HttpDelete("{campaignId:int}/content-post-links/{contentPostId:int}")]
    public async Task<IActionResult> UnlinkContentPost(Guid teamId, int campaignId, int contentPostId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _campaignService.UnlinkContentPostAsync(teamId, campaignId, userId, contentPostId);
        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
