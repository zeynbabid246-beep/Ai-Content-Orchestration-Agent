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
                UserName = normalizedUsername
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

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, password);
            if (!isPasswordValid)
            {
                return (false, string.Empty, string.Empty, string.Empty);
            }

            return (true, user.Id, user.Email ?? string.Empty, user.UserName ?? string.Empty);
        }
    }
}
