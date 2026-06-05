using AiContentFlow.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace AiContentFlow.Infrastructure.Identity
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public IdentityService(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<(bool Success, string UserId, string Email, string Username, IEnumerable<string> Errors)> RegisterAsync(string email, string password, string username)
        {
            var normalizedEmail = email.Trim();
            var normalizedUsername = username.Trim();

            var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);
            if (existingUser != null)
            {
                return (false, string.Empty, string.Empty, string.Empty, new[] { "Email is already in use." });
            }

            var user = new ApplicationUser
            {
                Email = normalizedEmail,
                UserName = normalizedUsername,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                return (false, string.Empty, string.Empty, string.Empty, result.Errors.Select(e => e.Description));
            }

            return (true, user.Id, user.Email ?? string.Empty, user.UserName ?? string.Empty, Enumerable.Empty<string>());
        }

        public async Task<(bool Success, string UserId, string Email, string Username)> LoginAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email.Trim());
            if (user == null)
            {
                return (false, string.Empty, string.Empty, string.Empty);
            }

            if (await _userManager.IsLockedOutAsync(user))
            {
                return (false, string.Empty, string.Empty, string.Empty);
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, password);
            if (!isPasswordValid)
            {
                await _userManager.AccessFailedAsync(user);
                return (false, string.Empty, string.Empty, string.Empty);
            }

            await _userManager.ResetAccessFailedCountAsync(user);
            return (true, user.Id, user.Email ?? string.Empty, user.UserName ?? string.Empty);
        }

        public async Task<string?> GeneratePasswordResetTokenAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email.Trim());
            if (user == null)
                return null;

            return await _userManager.GeneratePasswordResetTokenAsync(user);
        }

        public async Task<(bool Success, IEnumerable<string> Errors)> ResetPasswordAsync(string email, string token, string newPassword)
        {
            var user = await _userManager.FindByEmailAsync(email.Trim());
            if (user == null)
                return (false, new[] { "Invalid reset request." });

            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            if (!result.Succeeded)
                return (false, result.Errors.Select(e => e.Description));

            await _userManager.ResetAccessFailedCountAsync(user);
            return (true, Enumerable.Empty<string>());
        }

        public async Task<(bool Success, IEnumerable<string> Errors)> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, new[] { "User not found." });

            var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            if (!result.Succeeded)
                return (false, result.Errors.Select(e => e.Description));

            return (true, Enumerable.Empty<string>());
        }

        public async Task<UserProfileData?> GetUserProfileAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return null;

            return new UserProfileData(
                user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                user.Bio,
                user.AvatarUrl,
                user.CreatedAt);
        }

        public async Task<(bool Success, IEnumerable<string> Errors)> UpdateUsernameAsync(string userId, string username)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, new[] { "User not found." });

            var normalizedUsername = username.Trim();
            if (string.IsNullOrWhiteSpace(normalizedUsername))
                return (false, new[] { "Username is required." });

            if (string.Equals(user.UserName, normalizedUsername, StringComparison.Ordinal))
                return (true, Enumerable.Empty<string>());

            var existing = await _userManager.FindByNameAsync(normalizedUsername);
            if (existing != null && existing.Id != userId)
                return (false, new[] { "Username is already taken." });

            user.UserName = normalizedUsername;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return (false, result.Errors.Select(e => e.Description));

            return (true, Enumerable.Empty<string>());
        }

        public async Task UpdateBioAsync(string userId, string? bio)
        {
            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new KeyNotFoundException("User not found");

            user.Bio = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();
            await _userManager.UpdateAsync(user);
        }

        public async Task UpdateAvatarUrlAsync(string userId, string? avatarUrl)
        {
            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new KeyNotFoundException("User not found");

            user.AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim();
            await _userManager.UpdateAsync(user);
        }
    }
}
