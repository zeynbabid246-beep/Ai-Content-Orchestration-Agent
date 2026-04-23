namespace Application.Interfaces;
public interface IImageGenerationService
{
    Task<string> GenerateImageAsync(string prompt, string model);
}