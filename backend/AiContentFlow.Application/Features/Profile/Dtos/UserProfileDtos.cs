namespace AiContentFlow.Application.Features.Profile.Dtos;

public record UserProfileDto(
    string UserId,
    string Username,
    string Email,
    string? Bio,
    string? AvatarUrl,
    string TeamRole,
    string TeamName,
    DateTime MemberSince);

public record UpdateUserProfileDto(string Username, string? Bio);

public record AvatarUploadResponseDto(string Url);
