using AiContentFlow.API.Security;
using AiContentFlow.Application.Features.Profile;
using AiContentFlow.Application.Features.Profile.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private const long MaxImageSizeBytes = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    private readonly IUserProfileService _profileService;

    public ProfileController(IUserProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetMyProfile([FromQuery] Guid teamId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var profile = await _profileService.GetMyProfileAsync(userId, teamId);
        return Ok(profile);
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserProfileDto>> UpdateMyProfile(
        [FromQuery] Guid teamId,
        [FromBody] UpdateUserProfileDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var profile = await _profileService.UpdateMyProfileAsync(userId, teamId, dto);
        return Ok(profile);
    }

    [HttpPost("avatar")]
    [RequestSizeLimit(MaxImageSizeBytes)]
    public async Task<ActionResult<AvatarUploadResponseDto>> UploadAvatar([FromForm] IFormFile file)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Image file is required." });

        if (file.Length > MaxImageSizeBytes)
            return BadRequest(new { message = "Image file is too large. Maximum size is 10 MB." });

        var contentType = ResolveContentType(file);
        if (!AllowedMimeTypes.Contains(contentType))
            return BadRequest(new { message = "Unsupported image format. Allowed: jpeg, png, webp, gif." });

        await using var validationStream = file.OpenReadStream();
        if (!ImageFileValidator.TryValidate(validationStream, contentType, out var validationError))
            return BadRequest(new { message = validationError });

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "users", userId);
        Directory.CreateDirectory(uploadsRoot);

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
            extension = GuessExtension(contentType);

        var filename = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(uploadsRoot, filename);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/users/{userId}/{filename}";
        var publicUrl = $"{Request.Scheme}://{Request.Host}{relativePath}";

        var result = await _profileService.UpdateAvatarAsync(userId, publicUrl);
        return Ok(result);
    }

    [HttpDelete("avatar")]
    public async Task<IActionResult> RemoveAvatar()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _profileService.RemoveAvatarAsync(userId);
        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? string.Empty;
    }

    private static string ResolveContentType(IFormFile file)
    {
        if (!string.IsNullOrWhiteSpace(file.ContentType)
            && !string.Equals(file.ContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase)
            && AllowedMimeTypes.Contains(file.ContentType))
        {
            return file.ContentType;
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        return extension switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => file.ContentType
        };
    }

    private static string GuessExtension(string mimeType)
    {
        return mimeType.ToLowerInvariant() switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            _ => ".jpg"
        };
    }
}
