

using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;

namespace Application.UseCases;

public class GenerateAndPublishUseCase
{
    private readonly GeneratePostUseCase _generateUseCase;
    private readonly PublishPostUseCase _publishUseCase;
    private readonly IContentPostRepository _postRepo;

    public GenerateAndPublishUseCase(
        GeneratePostUseCase generateUseCase,
        PublishPostUseCase publishUseCase,
        IContentPostRepository postRepo)
    {
        _generateUseCase = generateUseCase;
        _publishUseCase = publishUseCase;
        _postRepo = postRepo;
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
        // ✅ Step 1 — Generate → Draft
        var post = await _generateUseCase.Execute(
            teamId, topic, title, subject,
            model, type, format,
            channelId, campaignId, socialAccountId, userId);

        // ✅ Step 2 — Draft → Ready (required by workflow)
        post.Status = ContentStatus.Ready;
        post.UpdatedAt = DateTime.UtcNow;
        await _postRepo.UpdateAsync(post);
        await _postRepo.SaveChangesAsync();

        // ✅ Step 3 — Ready → Published
        return await _publishUseCase.Execute(teamId, post.Id);
    }
}