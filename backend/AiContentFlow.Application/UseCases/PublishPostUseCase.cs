using AiContentFlow.Domain.Models;
using AiContentFlow.Application.Common.Interfaces;
using Application.Interfaces;

namespace Application.UseCases;

public class PublishPostUseCase
{
    private readonly IEnumerable<IPublisher> _publishers;
    private readonly ISocialAccountRepository _socialRepo;
    private readonly IContentPostRepository _postRepo;
    private readonly IPostVariantRepository _variantRepo;

    public PublishPostUseCase(
        IEnumerable<IPublisher> publishers,
        ISocialAccountRepository socialRepo,
        IContentPostRepository postRepo,
        IPostVariantRepository variantRepo)
    {
        _publishers = publishers;
        _socialRepo = socialRepo;
        _postRepo = postRepo;
        _variantRepo = variantRepo;
    }

    public async Task<ContentPost> Execute(Guid teamId, int postId)
    {
        var post = await _postRepo.GetByIdAsync(teamId, postId)
            ?? throw new Exception("Post not found");

        if (post.Status is not ContentStatus.Ready and not ContentStatus.Scheduled)
            throw new Exception("Post must be Ready or Scheduled before publishing");

        if (post.SocialAccountId == null)
            throw new Exception("Post has no social account assigned");

        var account = await _socialRepo.GetByIdAsync(teamId, post.SocialAccountId.Value)
            ?? throw new Exception("Social account not found");

        if (!account.IsActive || account.Status == SocialAccountStatus.Disconnected)
            throw new Exception("Social account is not active");

        var publisher = _publishers.FirstOrDefault(p => p.Platform == account.Platform)
            ?? throw new Exception($"No publisher registered for platform: {account.Platform}");

        // ✅ Snapshot of ContentJson at publish time — protects history if post is edited later
        var variant = new PostVariant
        {
            ContentPostId = post.Id,
            ContentPost = post,
            SocialAccountId = account.Id,
            SocialAccount = account,
            Platform = account.Platform,
            Title = post.Title,
            ContentJson = post.ContentJson,
            Status = ContentStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            var result = await publisher.PublishAsync(variant, account);

            if (!result.IsSuccess)
                throw new Exception(result.ErrorMessage);

            // ✅ Variant = per-platform execution record
            variant.Status = ContentStatus.Published;
            variant.PlatformPostId = result.PostId;
            variant.PlatformPostUrl = result.PostUrl;
            variant.PublishedAt = DateTime.UtcNow;
            variant.UpdatedAt = DateTime.UtcNow;

            await _variantRepo.AddAsync(variant);
            await _variantRepo.SaveChangesAsync();

            // ✅ ContentPost = aggregate status
            post.Status = ContentStatus.Published;
            post.PublishedAt = DateTime.UtcNow;
            post.PlatformPostId = result.PostId;
            post.PlatformPostUrl = result.PostUrl;
            post.UpdatedAt = DateTime.UtcNow;
            post.LastError = null;

            await _postRepo.UpdateAsync(post);
            await _postRepo.SaveChangesAsync();

            return post;
        }
        catch (Exception ex)
        {
            variant.Status = ContentStatus.Failed;
            variant.LastError = ex.Message;
            variant.RetryCount++;
            variant.UpdatedAt = DateTime.UtcNow;

            await _variantRepo.AddAsync(variant);
            await _variantRepo.SaveChangesAsync();

            post.Status = ContentStatus.Failed;
            post.LastError = ex.Message;
            post.RetryCount++;
            post.UpdatedAt = DateTime.UtcNow;

            await _postRepo.UpdateAsync(post);
            await _postRepo.SaveChangesAsync();

            throw;
        }
    }
}