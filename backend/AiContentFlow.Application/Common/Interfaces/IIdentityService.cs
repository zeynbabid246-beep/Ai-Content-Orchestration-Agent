using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace AiContentFlow.Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<(bool Success, string UserId, IEnumerable<string> Errors)> RegisterAsync(string email, string password);
        Task<(bool Success, string UserId, string Email)> LoginAsync(string email, string password); 

    }
}
