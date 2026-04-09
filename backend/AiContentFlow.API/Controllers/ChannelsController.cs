using AiContentFlow.Application.Features.Channels;
using AiContentFlow.Application.Features.Channels.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/channels")]
public class ChannelsController : ControllerBase
{
    private readonly IChannelService _channelService;

    public ChannelsController(IChannelService channelService)
    {
        _channelService = channelService;
    }

    [HttpPost]
    public async Task<ActionResult<ChannelResponseDto>> Create(Guid teamId, [FromBody] CreateChannelDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _channelService.CreateAsync(teamId, userId, dto);
        return CreatedAtAction(nameof(GetById), new { teamId, channelId = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<ChannelResponseDto>>> GetByTeam(Guid teamId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var channels = await _channelService.GetByTeamAsync(teamId, userId);
        return Ok(channels);
    }

    [HttpGet("{channelId:int}")]
    public async Task<ActionResult<ChannelResponseDto>> GetById(Guid teamId, int channelId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var channel = await _channelService.GetByIdAsync(teamId, channelId, userId);
        return Ok(channel);
    }

    [HttpPut("{channelId:int}")]
    public async Task<ActionResult<ChannelResponseDto>> Update(Guid teamId, int channelId, [FromBody] UpdateChannelDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var channel = await _channelService.UpdateAsync(teamId, channelId, userId, dto);
        return Ok(channel);
    }

    [HttpDelete("{channelId:int}")]
    public async Task<IActionResult> Delete(Guid teamId, int channelId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _channelService.DeleteAsync(teamId, channelId, userId);
        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}