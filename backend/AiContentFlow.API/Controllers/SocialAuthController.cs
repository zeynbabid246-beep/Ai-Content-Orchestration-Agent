using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/auth")]
public class SocialAuthController : ControllerBase
{
    private readonly AiContentFlow.Application.Features.SocialAuth.SocialAuthService _socialAuthService;

    public SocialAuthController(AiContentFlow.Application.Features.SocialAuth.SocialAuthService socialAuthService)
    {
        _socialAuthService = socialAuthService;
    }

    // GET /api/auth/linkedin/login?teamId=...&channelId=1
    [HttpGet("{platform}/login")]
    public async Task<IActionResult> Login([FromRoute] string platform, [FromQuery] Guid teamId, [FromQuery] int channelId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        if (teamId == Guid.Empty)
            return BadRequest(new { error = "Invalid teamId" });

        if (channelId <= 0)
            return BadRequest(new { error = "Invalid channelId" });

        try
        {
            var result = await _socialAuthService.CreateLoginUrlAsync(teamId, channelId, userId, platform);
            return Redirect(result.AuthorizationUrl);
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/auth/linkedin/callback?code=...&state=...
    [HttpGet("{platform}/callback")]
    public async Task<IActionResult> Callback(
        [FromRoute] string platform,
        [FromQuery] string code,
        [FromQuery] string state)
    {
        if (string.IsNullOrEmpty(code))
            return BadRequest(new { error = "Authorization code missing" });

        if (string.IsNullOrEmpty(state))
            return BadRequest(new { error = "State parameter missing" });

        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        try
        {
            var result = await _socialAuthService.HandleCallbackAsync(platform, code, state, userId);
            return Ok(result);
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception)
        {
            return BadRequest(new { error = "Social authorization failed" });
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}