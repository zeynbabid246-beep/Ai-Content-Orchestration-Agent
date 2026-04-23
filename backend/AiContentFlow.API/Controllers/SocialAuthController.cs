using AiContentFlow.Application.Common.Interfaces;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Route("api/auth")]
public class SocialAuthController : ControllerBase
{
    private readonly IAuthServiceFactory _factory;

    public SocialAuthController(IAuthServiceFactory factory)
    {
        _factory = factory;
    }

    // GET /api/auth/linkedin/login?channelId=1
    [HttpGet("{platform}/login")]
    public IActionResult Login([FromRoute] string platform, [FromQuery] int channelId)
    {
        if (channelId <= 0)
            return BadRequest(new { error = "Invalid channelId" });

        try
        {
            var service = _factory.GetService(platform);
            var url = service.GetAuthUrl(channelId);
            return Redirect(url);
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

        try
        {
            var service = _factory.GetService(platform);
            await service.ProcessCallbackAsync(code, state);
            return Ok(new { message = $"{platform} connected successfully" });
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}