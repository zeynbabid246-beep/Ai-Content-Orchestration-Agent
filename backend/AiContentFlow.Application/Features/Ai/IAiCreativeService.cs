using AiContentFlow.Application.Features.Ai.Dtos;

namespace AiContentFlow.Application.Features.Ai;

public interface IAiCreativeService
{
    Task<GeneratePostCreativeResponseDto> GenerateForPostAsync(
        Guid teamId,
        string requestingUserId,
        GeneratePostCreativeRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<GenerateCreativePreviewResponseDto> GeneratePreviewAsync(
        Guid teamId,
        string requestingUserId,
        GenerateCreativePreviewRequestDto dto,
        CancellationToken cancellationToken = default);
}
