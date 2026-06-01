using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/auth")]
public class SocialAuthController : ControllerBase
{
    private readonly AiContentFlow.Application.Features.SocialAuth.SocialAuthService _socialAuthService;
    private readonly IConfiguration _configuration;

    public SocialAuthController(
        AiContentFlow.Application.Features.SocialAuth.SocialAuthService socialAuthService,
        IConfiguration configuration)
    {
        _socialAuthService = socialAuthService;
        _configuration = configuration;
    }

    // GET /api/auth/linkedin/login?teamId=...&channelId=1
    [HttpGet("{platform}/login")]
    public async Task<IActionResult> Login([FromRoute] string platform, [FromQuery] Guid teamId, [FromQuery] int? channelId = null)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        if (teamId == Guid.Empty)
            return BadRequest(new { error = "Invalid teamId" });

        if (channelId.HasValue && channelId.Value <= 0)
            return BadRequest(new { error = "Invalid channelId" });

        try
        {
            var result = await _socialAuthService.CreateLoginUrlAsync(teamId, channelId, userId, platform);
            return Ok(result);
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/auth/linkedin/callback?code=...&state=...
    [AllowAnonymous]
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

        try
        {
            var userId = GetCurrentUserId();
            _ = await _socialAuthService.HandleCallbackAsync(platform, code, state, userId);
            return Redirect(BuildFrontendRedirectUrl(platform, true, null));
        }
        catch (NotSupportedException ex)
        {
            return Redirect(BuildFrontendRedirectUrl(platform, false, MapProviderError(platform, ex.Message)));
        }
        catch (Exception ex)
        {
            return Redirect(BuildFrontendRedirectUrl(platform, false, MapProviderError(platform, ex.Message)));
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }

    private string BuildFrontendRedirectUrl(string platform, bool success, string error)
    {
        var baseUrl = _configuration["SocialAuth:FrontendRedirectUrl"] ?? "http://localhost:5173/app/generate";
        var separator = baseUrl.Contains('?') ? "&" : "?";
        var status = success ? "success" : "error";
        var query = $"{separator}socialAuthStatus={status}&platform={Uri.EscapeDataString(platform)}";
        if (!string.IsNullOrWhiteSpace(error))
            query += $"&socialAuthError={Uri.EscapeDataString(error)}";
        return $"{baseUrl}{query}";
    }

    private static string MapProviderError(string platform, string error)
    {
        var normalizedPlatform = platform.Trim().ToLowerInvariant();
        var normalizedError = error.ToLowerInvariant();

        if (normalizedError.Contains("redirect_uri") || normalizedError.Contains("redirect uri"))
            return $"OAuth redirect URI mismatch for {platform}. Verify provider app settings and server config.";

        if (normalizedError.Contains("invalid scope") || normalizedError.Contains("permissions"))
            return $"Missing required {platform} permissions. Review provider scopes and app approval status.";

        if (normalizedError.Contains("token") && normalizedError.Contains("expired"))
            return $"{platform} token expired. Reconnect the account.";

        if (normalizedPlatform == "instagram" && normalizedError.Contains("instagram_business_account"))
            return "Instagram Business account is not linked to the selected Facebook page.";

        if (normalizedPlatform == "linkedin" && normalizedError.Contains("member"))
            return "LinkedIn member identity could not be resolved. Try reconnecting and check app scopes.";

        return error;
    }
}