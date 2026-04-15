using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace AiContentFlow.Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<(bool Success, string UserId, string Email, string Username, IEnumerable<string> Errors)> RegisterAsync(string email, string password, string username);
        Task<(bool Success, string UserId, string Email, string Username)> LoginAsync(string email, string password); 

    }
}
