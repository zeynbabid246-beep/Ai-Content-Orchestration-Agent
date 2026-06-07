using AiContentFlow.Domain.Models;

namespace AiContentFlow.Domain.Campaigns.Dtos;

public record CreateCampaignDto(
    string Name,
    string? Description,
    int ChannelId,
    string? Objective = null,
    string? ToneOfVoiceOverride = null,
    string? TargetAudienceOverride = null
);

public record UpdateCampaignDto(
    string Name,
    string? Description,
    int ChannelId,
    string? Objective = null,
    string? ToneOfVoiceOverride = null,
    string? TargetAudienceOverride = null
);

public record LinkCampaignContentPostDto(int ContentPostId);

public record UnlinkCampaignContentPostDto(int ContentPostId);

public record CampaignContentPostResponseDto(
    int ContentPostId,
    DateTime LinkedAt,
    string LinkedByUserId
);

public record CampaignPostSummaryDto(
    int DraftCount,
    int ScheduledCount,
    int PublishedCount
);

public record CampaignResponseDto(
    int Id,
    Guid TeamId,
    int ChannelId,
    string Name,
    string? Description,
    string? Objective,
    string? ToneOfVoiceOverride,
    string? TargetAudienceOverride,
    CampaignStatus Status,
    CampaignPostSummaryDto PostSummary,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<CampaignContentPostResponseDto> ContentPosts
);
