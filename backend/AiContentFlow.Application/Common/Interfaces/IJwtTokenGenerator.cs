using System;
using System.Collections.Generic;
using System.Text;

namespace AiContentFlow.Application.Common.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(string UserId, string email);
    }
}
