namespace AiContentFlow.Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<(bool Success, string UserId, string Email, string Username, IEnumerable<string> Errors)> RegisterAsync(string email, string password, string username);
        Task<(bool Success, string UserId, string Email, string Username)> LoginAsync(string email, string password);
        Task<string?> GeneratePasswordResetTokenAsync(string email);
        Task<(bool Success, IEnumerable<string> Errors)> ResetPasswordAsync(string email, string token, string newPassword);
        Task<(bool Success, IEnumerable<string> Errors)> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        Task<UserProfileData?> GetUserProfileAsync(string userId);
        Task<(bool Success, IEnumerable<string> Errors)> UpdateUsernameAsync(string userId, string username);
        Task UpdateBioAsync(string userId, string? bio);
        Task UpdateAvatarUrlAsync(string userId, string? avatarUrl);
    }

    public record UserProfileData(
        string UserId,
        string Username,
        string Email,
        string? Bio,
        string? AvatarUrl,
        DateTime MemberSince);
}
