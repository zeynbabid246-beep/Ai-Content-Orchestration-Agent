using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Application.Features.Teams.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamController(ITeamService teamService)
    {
        _teamService = teamService ?? throw new ArgumentNullException(nameof(teamService));
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<UserTeamSummaryDto>>> GetMyTeams()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var teams = await _teamService.GetMyTeamsAsync(userId);
        return Ok(teams);
    }

    [HttpPost("switch")]
    public async Task<ActionResult<SwitchTeamResponseDto>> SwitchTeam([FromBody] SwitchTeamDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _teamService.SwitchTeamAsync(userId, dto);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TeamResponseDto>> CreateTeam([FromBody] CreateTeamDto dto)
    {
        var ownerIdString = GetCurrentUserId();

        if (string.IsNullOrEmpty(ownerIdString))
            return Unauthorized("User ID not found in token");

        var result = await _teamService.CreateTeamAsync(ownerIdString, dto);
        return CreatedAtAction(nameof(GetTeamMembers), new { teamId = result.Id }, result);
    }

    [HttpPut("{teamId:guid}/name")]
    public async Task<ActionResult<TeamResponseDto>> SetTeamName(Guid teamId, [FromBody] SetTeamNameDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _teamService.SetTeamNameAsync(teamId, userId, dto);
        return Ok(result);
    }

    [HttpGet("{teamId:guid}/members")]
    public async Task<ActionResult<List<TeamMemberDto>>> GetTeamMembers(Guid teamId)
    {
        var requestUserId = GetCurrentUserId();

        if (string.IsNullOrEmpty(requestUserId))
            return Unauthorized("User ID not found in token");

        var members = await _teamService.GetMembersAsync(teamId, requestUserId);
        return Ok(members);
    }

    [HttpPost("{teamId:guid}/invite")]
    public async Task<IActionResult> InviteUser(Guid teamId, [FromBody] InviteUserDto dto)
    {
        var requestingUserId = GetCurrentUserId();

        if (string.IsNullOrEmpty(requestingUserId))
            return Unauthorized("User ID not found in token");

        await _teamService.InviteUserAsync(teamId, requestingUserId, dto);
        return NoContent();
    }

    [HttpDelete("{teamId:guid}/members/{targetUserId}")]
    public async Task<IActionResult> RemoveUser(Guid teamId, string targetUserId)
    {
        var requestingUserId = GetCurrentUserId();

        if (string.IsNullOrEmpty(requestingUserId))
            return Unauthorized("User ID not found in token");

        await _teamService.RemoveUserAsync(teamId, requestingUserId, targetUserId);
        return NoContent();
    }

    [HttpPut("{teamId:guid}/members/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid teamId, [FromBody] UpdateMemberRoleDto dto)
    {
        var requestingUserId = GetCurrentUserId();

        if (string.IsNullOrEmpty(requestingUserId))
            return Unauthorized("User ID not found in token");

        await _teamService.UpdateMemberRoleAsync(teamId, requestingUserId, dto);
        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}