using AiContentFlow.Application.Features.Posts;
using AiContentFlow.Application.Features.Posts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiContentFlow.API.Controllers;

[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/posts")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpPost]
    public async Task<ActionResult<PostResponseDto>> Create(Guid teamId, [FromBody] CreatePostDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var result = await _postService.CreateAsync(teamId, userId, dto);
        return CreatedAtAction(nameof(GetById), new { teamId, postId = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<PostResponseDto>>> GetByTeam(Guid teamId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var posts = await _postService.GetByTeamAsync(teamId, userId);
        return Ok(posts);
    }

    [HttpGet("{postId:guid}")]
    public async Task<ActionResult<PostResponseDto>> GetById(Guid teamId, Guid postId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var post = await _postService.GetByIdAsync(teamId, postId, userId);
        return Ok(post);
    }

    [HttpPut("{postId:guid}")]
    public async Task<ActionResult<PostResponseDto>> Update(Guid teamId, Guid postId, [FromBody] UpdatePostDto dto)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var updated = await _postService.UpdateAsync(teamId, postId, userId, dto);
        return Ok(updated);
    }

    [HttpDelete("{postId:guid}")]
    public async Task<IActionResult> Delete(Guid teamId, Guid postId)
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        await _postService.DeleteAsync(teamId, postId, userId);
        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}
