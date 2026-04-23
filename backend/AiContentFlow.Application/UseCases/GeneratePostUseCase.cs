using System.Text.Json;
using AiContentFlow.Domain.Models;
using AiContentFlow.Application.Common.Interfaces;
using Application.Interfaces;

namespace Application.UseCases;

public class GeneratePostUseCase
{
    private readonly ITextGenerationService _textService;
    private readonly IImageGenerationService _imageService;
    private readonly IContentPostRepository _postRepository;

    public GeneratePostUseCase(
        ITextGenerationService textService,
        IImageGenerationService imageService,
        IContentPostRepository postRepository)
    {
        _textService = textService;
        _imageService = imageService;
        _postRepository = postRepository;
    }

    public async Task<ContentPost> Execute(
        Guid teamId,
        string topic,
        string title,
        string subject,
        string model,
        ContentType type,
        ContentFormat format,
        int? channelId,
        int? campaignId,
        int? socialAccountId,
        string userId)
    {
        var prompt = $"Write a professional LinkedIn post about: {topic}";

        var text = await _textService.GenerateTextAsync(prompt, model);

        string? imageUrl = null;
        if (format == ContentFormat.Image || format == ContentFormat.TextImage)
            imageUrl = await _imageService.GenerateImageAsync(topic, "pollinations");

        var contentJson = JsonSerializer.Serialize(new { text, imageUrl });

        var post = new ContentPost
        {
            TeamId = teamId,
            Topic = topic,
            Title = title,
            Subject = subject,
            Content = text,
            ImageUrl = imageUrl,
            ContentJson = contentJson,
            ContentType = type,
            ChannelId = channelId,
            CampaignId = campaignId,
            SocialAccountId = socialAccountId,
            AiModel = model,
            Prompt = prompt,
            Status = ContentStatus.Draft,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        return post;
    }
}