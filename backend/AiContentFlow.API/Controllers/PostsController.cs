using AiContentFlow.Domain.Models;
using AiContentFlow.Application.Common.Interfaces;
using Application.UseCases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Models;

namespace API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/posts")]
public class PostsController : ControllerBase
{
   private readonly GeneratePostUseCase _generateUseCase;
private readonly PublishPostUseCase _publishUseCase;
private readonly GenerateAndPublishUseCase _generateAndPublishUseCase; // ✅ add
private readonly IContentPostRepository _postRepository;

public PostsController(
    GeneratePostUseCase generateUseCase,
    PublishPostUseCase publishUseCase,
    GenerateAndPublishUseCase generateAndPublishUseCase, // ✅ add
    IContentPostRepository postRepository)
{
    _generateUseCase = generateUseCase;
    _publishUseCase = publishUseCase;
    _generateAndPublishUseCase = generateAndPublishUseCase; // ✅ add
    _postRepository = postRepository;
}
    // ✅ 1. Generate → Draft
    [HttpPost("generate")]
    public async Task<IActionResult> Generate(Guid teamId, [FromBody] GeneratePostRequest req)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var post = await _generateUseCase.Execute(
            teamId,
            req.Topic,
            req.Title,
            req.Subject,
            req.Model,
            req.Type,
            req.Format,
            req.ChannelId,
            req.CampaignId,
            req.SocialAccountId,
            userId
        );

        return CreatedAtAction(nameof(GetById), new { teamId, id = post.Id }, ToDto(post));
    }

    // ✅ 2. Draft → Ready
    [HttpPost("{id:int}/ready")]
    public async Task<IActionResult> MarkReady(Guid teamId, int id)
    {
        var post = await _postRepository.GetByIdAsync(teamId, id);
        if (post == null) return NotFound();

        if (post.Status != ContentStatus.Draft)
            return BadRequest("Only draft posts can be marked as ready");

        post.Status = ContentStatus.Ready;
        post.UpdatedAt = DateTime.UtcNow;

        await _postRepository.UpdateAsync(post);
        await _postRepository.SaveChangesAsync();

        return Ok(ToDto(post));
    }

    // 🚀 3. Ready → Published
    [HttpPost("{id:int}/publish")]
    public async Task<IActionResult> Publish(Guid teamId, int id)
    {
        var post = await _publishUseCase.Execute(teamId, id);
        return Ok(ToDto(post));
    }
    // 🚀 Generate + Publish in one shot
[HttpPost("generate-and-publish")]
public async Task<IActionResult> GenerateAndPublish(Guid teamId, [FromBody] GeneratePostRequest req)
{
    var userId = User.FindFirst("sub")?.Value;
    if (string.IsNullOrEmpty(userId))
        return Unauthorized("User ID not found in token");

    if (req.SocialAccountId == null)
        return BadRequest(new { error = "SocialAccountId is required for direct publish" });

    var post = await _generateAndPublishUseCase.Execute(
        teamId,
        req.Topic,
        req.Title,
        req.Subject,
        req.Model,
        req.Type,
        req.Format,
        req.ChannelId,
        req.CampaignId,
        req.SocialAccountId,
        userId
    );

    return Ok(ToDto(post));
}

    // 📥 4. Get all posts for team
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid teamId)
    {
        var posts = await _postRepository.GetByTeamAsync(teamId);
        return Ok(posts.Select(ToDto));
    }

    // 📥 5. Get single post
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(Guid teamId, int id)
    {
        var post = await _postRepository.GetByIdAsync(teamId, id);
        if (post == null) return NotFound();
        return Ok(ToDto(post));
    }

    // 📥 6. Get drafts
    [HttpGet("drafts")]
    public async Task<IActionResult> GetDrafts(Guid teamId)
    {
        var posts = await _postRepository.GetByStatusAsync(teamId, ContentStatus.Draft);
        return Ok(posts.Select(ToDto));
    }

    // 📥 7. Get ready
    [HttpGet("ready")]
    public async Task<IActionResult> GetReady(Guid teamId)
    {
        var posts = await _postRepository.GetByStatusAsync(teamId, ContentStatus.Ready);
        return Ok(posts.Select(ToDto));
    }

    // 📥 8. Get published
    [HttpGet("published")]
    public async Task<IActionResult> GetPublished(Guid teamId)
    {
        var posts = await _postRepository.GetByStatusAsync(teamId, ContentStatus.Published);
        return Ok(posts.Select(ToDto));
    }

    private static ContentPostDto ToDto(ContentPost p) => new()
    {
        Id = p.Id,
        TeamId = p.TeamId,
        ChannelId = p.ChannelId,
        SocialAccountId = p.SocialAccountId,
        CampaignId = p.CampaignId,
        Topic = p.Topic,
        Title = p.Title,
        Subject = p.Subject,
        Content = p.Content,
        ImageUrl = p.ImageUrl,
        ContentJson = p.ContentJson,
        ContentType = p.ContentType.ToString(),
        Status = p.Status.ToString(),
        AiModel = p.AiModel,
        ScheduledAt = p.ScheduledAt,
        PublishedAt = p.PublishedAt,
        PlatformPostId = p.PlatformPostId,
        PlatformPostUrl = p.PlatformPostUrl,
        RetryCount = p.RetryCount,
        LastError = p.LastError,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}