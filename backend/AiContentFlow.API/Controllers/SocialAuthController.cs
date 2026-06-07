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

    // GET /api/auth/linkedin/login?teamId=...&linkChannelId=1 (channelId alias supported)
    [HttpGet("{platform}/login")]
    public async Task<IActionResult> Login(
        [FromRoute] string platform,
        [FromQuery] Guid teamId,
        [FromQuery] int? linkChannelId = null,
        [FromQuery] int? channelId = null,
        [FromQuery] string? redirectPath = null)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        if (teamId == Guid.Empty)
            return BadRequest(new { error = "Invalid teamId" });

        var resolvedLinkChannelId = linkChannelId ?? channelId;
        if (resolvedLinkChannelId.HasValue && resolvedLinkChannelId.Value <= 0)
            return BadRequest(new { error = "Invalid linkChannelId" });

        if (!string.IsNullOrWhiteSpace(redirectPath)
            && !redirectPath.Trim().StartsWith("/app/", StringComparison.Ordinal))
            return BadRequest(new { error = "Invalid redirectPath" });

        try
        {
            var result = await _socialAuthService.CreateLoginUrlAsync(
                teamId,
                resolvedLinkChannelId,
                userId,
                platform,
                redirectPath);
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
            var result = await _socialAuthService.HandleCallbackAsync(platform, code, state, userId);
            return Redirect(BuildFrontendRedirectUrl(platform, true, null, result.LinkChannelId, result.RedirectPath));
        }
        catch (NotSupportedException ex)
        {
            return Redirect(BuildFrontendRedirectUrl(platform, false, MapProviderError(platform, ex.Message), null, null));
        }
        catch (Exception ex)
        {
            return Redirect(BuildFrontendRedirectUrl(platform, false, MapProviderError(platform, ex.Message), null, null));
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }

    private string BuildFrontendRedirectUrl(
        string platform,
        bool success,
        string? error,
        int? linkChannelId,
        string? redirectPath)
    {
        var frontendBase = (_configuration["App:FrontendBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
        var baseUrl = linkChannelId is > 0
            ? $"{frontendBase}/app/channels/{linkChannelId.Value}/publishing"
            : redirectPath is not null
                ? $"{frontendBase}{redirectPath}"
                : _configuration["SocialAuth:FrontendRedirectUrl"]
                  ?? $"{frontendBase}/app/integrations/social-accounts";

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

        if (normalizedPlatform == "threads"
            && (normalizedError.Contains("not accepted the invite")
                || normalizedError.Contains("1349245")))
        {
            return "Your Threads account has not accepted the tester invite. In Meta Developers add yourself as a Threads Tester, " +
                   "then in the Threads app go to Settings → Account → Website permissions → Invites and accept. " +
                   "You must OAuth with the same Threads account that accepted the invite.";
        }

        if (normalizedPlatform == "threads"
            && (normalizedError.Contains("url blocked")
                || normalizedError.Contains("not whitelisted")
                || normalizedError.Contains("1349168")))
        {
            return "Threads redirect URI is not whitelisted in Meta. Open Use cases → Access the Threads API → Settings " +
                   "and set Redirect callback URL to exactly https://localhost:7075/api/auth/threads/callback " +
                   "(fill uninstall/delete callback URLs too so the form saves). " +
                   "Do not use Facebook Login → Valid OAuth Redirect URIs for Threads.";
        }

        if (normalizedPlatform == "threads" && normalizedError.Contains("threads profile"))
            return "Threads profile could not be resolved. Reconnect and ensure threads_basic permission is granted.";

        if (normalizedPlatform == "linkedin" && normalizedError.Contains("member"))
            return "LinkedIn member identity could not be resolved. Try reconnecting and check app scopes.";

        return error;
    }
}