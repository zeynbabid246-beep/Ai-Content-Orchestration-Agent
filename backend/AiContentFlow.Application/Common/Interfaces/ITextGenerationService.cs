namespace Application.Interfaces;
public interface ITextGenerationService
{
    Task<string> GenerateTextAsync(string prompt, string model);
}