using AiContentFlow.Application.Features.Ai.Dtos;

namespace AiContentFlow.Application.Features.Ai;

public interface IAiCreativeService
{
    Task<GeneratePostCreativeResponseDto> GenerateForPostAsync(
        Guid teamId,
        string requestingUserId,
        GeneratePostCreativeRequestDto dto,
        CancellationToken cancellationToken = default);
}
