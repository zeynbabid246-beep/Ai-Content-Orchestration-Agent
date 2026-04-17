using AiContentFlow.Application.Features.SocialAccounts.Dtos;

namespace AiContentFlow.Application.Features.SocialAccounts;

public interface ISocialAccountService
{
    Task<SocialAccountResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateSocialAccountDto dto);
    Task<List<SocialAccountResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId);
    Task<SocialAccountResponseDto> GetByIdAsync(Guid teamId, int socialAccountId, string requestingUserId);
    Task<SocialAccountResponseDto> UpdateAsync(Guid teamId, int socialAccountId, string requestingUserId, UpdateSocialAccountDto dto);
    Task DeleteAsync(Guid teamId, int socialAccountId, string requestingUserId);
}