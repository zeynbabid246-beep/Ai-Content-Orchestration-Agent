using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Campaigns.Dtos;

public record CreateCampaignDto(
    string Name,
    string? Description,
    CampaignStatus Status
);

public record UpdateCampaignDto(
    string Name,
    string? Description,
    CampaignStatus Status
);

public record LinkCampaignContentPostDto(int ContentPostId);

public record UnlinkCampaignContentPostDto(int ContentPostId);

public record CampaignContentPostResponseDto(
    int ContentPostId,
    DateTime LinkedAt,
    string LinkedByUserId
);

public record CampaignResponseDto(
    int Id,
    Guid TeamId,
    string Name,
    string? Description,
    CampaignStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<CampaignContentPostResponseDto> ContentPosts
);
