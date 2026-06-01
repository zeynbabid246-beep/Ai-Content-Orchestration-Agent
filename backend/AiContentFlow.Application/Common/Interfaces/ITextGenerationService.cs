namespace Application.Interfaces;

public enum AiUseCase
{
    GeneratePost,
    SuggestCampaign,
    BrandExtraction
}

public interface ITextGenerationService
{
    Task<string> GenerateTextAsync(string prompt, string model, AiUseCase useCase = AiUseCase.GeneratePost);
}