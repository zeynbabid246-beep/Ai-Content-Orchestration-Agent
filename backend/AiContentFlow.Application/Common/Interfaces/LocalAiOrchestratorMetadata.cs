namespace AiContentFlow.Application.Common.Interfaces;

public record LocalAiOrchestratorMetadata(
    string? ContentType = null,
    string? PostType = null,
    string? InternalType = null,
    bool? NeedsCreative = null);
