using AiContentFlow.Application.Features.Profile.Dtos;

namespace AiContentFlow.Application.Features.Profile;

public interface IUserProfileService
{
    Task<UserProfileDto> GetMyProfileAsync(string userId, Guid teamId);
    Task<UserProfileDto> UpdateMyProfileAsync(string userId, Guid teamId, UpdateUserProfileDto dto);
    Task<AvatarUploadResponseDto> UpdateAvatarAsync(string userId, string avatarUrl);
    Task RemoveAvatarAsync(string userId);
}
