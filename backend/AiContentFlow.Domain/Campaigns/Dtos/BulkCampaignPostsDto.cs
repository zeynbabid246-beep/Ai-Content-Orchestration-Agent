using AiContentFlow.Domain.Models;

namespace AiContentFlow.Domain.Campaigns.Dtos;

public record BulkCampaignPostItemDto(
    string? Title,
    string ContentJson,
    ContentType ContentType,
    DateTime? ScheduledAt,
    int? SocialAccountId,
    SocialPlatform? Platform);

public record BulkCreateCampaignPostsDto(IReadOnlyList<BulkCampaignPostItemDto> Posts);

public record BulkCreateCampaignPostsResponseDto(
    int CreatedCount,
    IReadOnlyList<int> ContentPostIds);
