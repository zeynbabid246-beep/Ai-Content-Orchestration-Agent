using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.ContentPosts.Dtos;

public record ContentPostQueryDto(
    int? ChannelId = null,
    int? CampaignId = null,
    ContentStatus? Status = null);
