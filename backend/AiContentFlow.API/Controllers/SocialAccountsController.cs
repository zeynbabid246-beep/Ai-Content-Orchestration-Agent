using AiContentFlow.Application.Features.SocialAccounts;
using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/social-accounts")]
public class SocialAccountsController : ControllerBase
{
    private readonly ISocialAccountService _socialAccountService;

    public SocialAccountsController(ISocialAccountService socialAccountService)
    {
        _socialAccountService = socialAccountService;
    }

    [HttpPost]
    public async Task<ActionResult<SocialAccountResponseDto>> Create(Guid teamId, [FromBody] CreateSocialAccountDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _socialAccountService.CreateAsync(teamId, userId, dto);
        return CreatedAtAction(nameof(GetById), new { teamId, socialAccountId = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<SocialAccountResponseDto>>> GetByTeam(Guid teamId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var socialAccounts = await _socialAccountService.GetByTeamAsync(teamId, userId);
        return Ok(socialAccounts);
    }

    [HttpGet("{socialAccountId:int}")]
    public async Task<ActionResult<SocialAccountResponseDto>> GetById(Guid teamId, int socialAccountId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var socialAccount = await _socialAccountService.GetByIdAsync(teamId, socialAccountId, userId);
        return Ok(socialAccount);
    }

    [HttpPut("{socialAccountId:int}")]
    public async Task<ActionResult<SocialAccountResponseDto>> Update(Guid teamId, int socialAccountId, [FromBody] UpdateSocialAccountDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var updated = await _socialAccountService.UpdateAsync(teamId, socialAccountId, userId, dto);
        return Ok(updated);
    }

    [HttpDelete("{socialAccountId:int}")]
    public async Task<IActionResult> Delete(Guid teamId, int socialAccountId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _socialAccountService.DeleteAsync(teamId, socialAccountId, userId);
        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}