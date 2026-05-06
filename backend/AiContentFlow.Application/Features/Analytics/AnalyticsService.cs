using System.Security.Cryptography;
using System.Text;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Analytics.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly IPublicationAnalyticsRepository _analyticsRepository;
    private readonly IPostPublicationRepository _publicationRepository;
    private readonly ITeamRepository _teamRepository;

    public AnalyticsService(
        IPublicationAnalyticsRepository analyticsRepository,
        IPostPublicationRepository publicationRepository,
        ITeamRepository teamRepository)
    {
        _analyticsRepository = analyticsRepository;
        _publicationRepository = publicationRepository;
        _teamRepository = teamRepository;
    }

    public async Task<PublicationAnalyticsResponseDto?> RecordAsync(Guid teamId, string requestingUserId, RecordPublicationAnalyticsDto dto)
    {
        await EnsureCanReadAsync(teamId, requestingUserId);

        _ = await _publicationRepository.GetByIdAsync(teamId, dto.PublicationId)
            ?? throw new KeyNotFoundException("Publication not found");

        var dedupeKey = BuildDedupeKey(teamId, dto);
        if (await _analyticsRepository.ExistsByDedupeKeyAsync(teamId, dedupeKey))
            return null;

        var analytics = new PublicationAnalytics
        {
            TeamId = teamId,
            PostPublicationId = dto.PublicationId,
            Source = NormalizeRequired(dto.Source),
            DedupeKey = dedupeKey,
            WindowStart = dto.WindowStart,
            WindowEnd = dto.WindowEnd,
            PlatformCollectedAt = dto.PlatformCollectedAt,
            MetricVersion = Normalize(dto.MetricVersion),
            Impressions = dto.Impressions,
            Clicks = dto.Clicks,
            Shares = dto.Shares,
            EngagementRate = dto.EngagementRate,
            CollectedAt = DateTime.UtcNow
        };

        await _analyticsRepository.AddAsync(analytics);
        await _analyticsRepository.SaveChangesAsync();
        return Map(analytics);
    }

    public async Task<List<PublicationAnalyticsResponseDto>> GetByPublicationAsync(Guid teamId, int publicationId, string requestingUserId)
    {
        await EnsureCanReadAsync(teamId, requestingUserId);
        _ = await _publicationRepository.GetByIdAsync(teamId, publicationId)
            ?? throw new KeyNotFoundException("Publication not found");

        var analytics = await _analyticsRepository.GetByPublicationAsync(teamId, publicationId);
        return analytics.Select(Map).ToList();
    }

    private async Task EnsureCanReadAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");
    }

    private static string BuildDedupeKey(Guid teamId, RecordPublicationAnalyticsDto dto)
    {
        var raw = $"{teamId:N}:{dto.PublicationId}:{NormalizeRequired(dto.Source)}:{dto.WindowStart:O}:{dto.WindowEnd:O}:{Normalize(dto.MetricVersion)}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
    }

    private static string NormalizeRequired(string value)
    {
        var normalized = Normalize(value);
        if (normalized is null)
            throw new InvalidOperationException("Analytics source is required");

        return normalized;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static PublicationAnalyticsResponseDto Map(PublicationAnalytics analytics)
    {
        return new PublicationAnalyticsResponseDto(
            analytics.Id,
            analytics.TeamId,
            analytics.PostPublicationId,
            analytics.Source,
            analytics.DedupeKey,
            analytics.WindowStart,
            analytics.WindowEnd,
            analytics.Impressions,
            analytics.Clicks,
            analytics.Shares,
            analytics.EngagementRate,
            analytics.CollectedAt);
    }
}
