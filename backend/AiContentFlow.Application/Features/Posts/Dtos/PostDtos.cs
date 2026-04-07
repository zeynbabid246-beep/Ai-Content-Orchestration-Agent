namespace AiContentFlow.Application.Features.Posts.Dtos;

public record CreatePostDto(string Title, string Content);

public record UpdatePostDto(string Title, string Content);

public record PostResponseDto(
    Guid Id,
    Guid TeamId,
    string Title,
    string Content,
    string CreatedByUserId,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
