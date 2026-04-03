using AiContentFlow.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace AiContentFlow.Infrastructure.Identity
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public IdentityService( UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        

        public Task<(bool Success, string UserId, IEnumerable<string> Errors)> RegisterAsync(string email, string password, string username)
        {
            var user = new ApplicationUser
            {
                Email = email,
                UserName = username
            };
            var result = _userManager.CreateAsync(user, password);

            if (!result.Result.Succeeded)
            {
                return Task.FromResult((false, string.Empty, result.Result.Errors.Select(e => e.Description)));
            }
            return Task.FromResult((true, user.Id, Enumerable.Empty<string>()));

        }

        public async Task<(bool Success, string UserId, string Email)> LoginAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) { return (false , null , null); }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, password);
            if(!isPasswordValid) { return (false, null, null); }
            return (true, user.Id, user.Email); 
        }
    }
}
