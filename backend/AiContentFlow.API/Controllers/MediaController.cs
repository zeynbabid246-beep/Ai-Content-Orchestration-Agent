using AiContentFlow.API.Security;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/media")]
public class MediaController : ControllerBase
{
    private const long MaxImageSizeBytes = 10 * 1024 * 1024; // 10 MB
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    private readonly ITeamRepository _teamRepository;

    public MediaController(ITeamRepository teamRepository)
    {
        _teamRepository = teamRepository;
    }

    [HttpPost("images")]
    [RequestSizeLimit(MaxImageSizeBytes)]
    public async Task<ActionResult<UploadImageResponseDto>> UploadImage(Guid teamId, [FromForm] IFormFile file)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized("User ID not found in token");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, userId);
        if (membership is null)
            return Unauthorized("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            return Forbid();

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Image file is required." });

        if (file.Length > MaxImageSizeBytes)
            return BadRequest(new { message = "Image file is too large. Maximum size is 10 MB." });

        if (!AllowedMimeTypes.Contains(file.ContentType))
            return BadRequest(new { message = "Unsupported image format. Allowed: jpeg, png, webp, gif." });

        await using var validationStream = file.OpenReadStream();
        if (!ImageFileValidator.TryValidate(validationStream, file.ContentType, out var validationError))
            return BadRequest(new { message = validationError });

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", teamId.ToString("N"));
        Directory.CreateDirectory(uploadsRoot);

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
            extension = GuessExtension(file.ContentType);

        var filename = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(uploadsRoot, filename);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/{teamId:N}/{filename}";
        var publicUrl = $"{Request.Scheme}://{Request.Host}{relativePath}";

        return Ok(new UploadImageResponseDto(publicUrl, relativePath, file.ContentType, file.Length));
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
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

    public record UploadImageResponseDto(
        string Url,
        string RelativePath,
        string ContentType,
        long SizeBytes);
}
