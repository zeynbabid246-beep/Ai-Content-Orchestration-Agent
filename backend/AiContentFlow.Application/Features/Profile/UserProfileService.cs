using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Profile.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.Profile;

public class UserProfileService : IUserProfileService
{
    private readonly IIdentityService _identityService;
    private readonly ITeamRepository _teamRepository;
    private readonly IValidator<UpdateUserProfileDto> _updateValidator;

    public UserProfileService(
        IIdentityService identityService,
        ITeamRepository teamRepository,
        IValidator<UpdateUserProfileDto> updateValidator)
    {
        _identityService = identityService;
        _teamRepository = teamRepository;
        _updateValidator = updateValidator;
    }

    public async Task<UserProfileDto> GetMyProfileAsync(string userId, Guid teamId)
    {
        var profile = await _identityService.GetUserProfileAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, userId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        var team = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        return MapProfile(profile, membership.Role.ToString(), team.Name);
    }

    public async Task<UserProfileDto> UpdateMyProfileAsync(string userId, Guid teamId, UpdateUserProfileDto dto)
    {
        await _updateValidator.ValidateAndThrowAsync(dto);

        var usernameResult = await _identityService.UpdateUsernameAsync(userId, dto.Username);
        if (!usernameResult.Success)
            throw new InvalidOperationException(string.Join(", ", usernameResult.Errors));

        await _identityService.UpdateBioAsync(userId, dto.Bio);

        return await GetMyProfileAsync(userId, teamId);
    }

    public async Task<AvatarUploadResponseDto> UpdateAvatarAsync(string userId, string avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
            throw new InvalidOperationException("Avatar URL is required.");

        await _identityService.UpdateAvatarUrlAsync(userId, avatarUrl);
        return new AvatarUploadResponseDto(avatarUrl);
    }

    public Task RemoveAvatarAsync(string userId) =>
        _identityService.UpdateAvatarUrlAsync(userId, null);

    private static UserProfileDto MapProfile(
        UserProfileData profile,
        string teamRole,
        string teamName) =>
        new(
            profile.UserId,
            profile.Username,
            profile.Email,
            profile.Bio,
            profile.AvatarUrl,
            teamRole,
            teamName,
            profile.MemberSince);
}
