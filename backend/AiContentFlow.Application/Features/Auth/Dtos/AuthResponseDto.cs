using System;
using System.Collections.Generic;
using System.Text;

namespace AiContentFlow.Application.Features.Auth.Dtos
{
    public class AuthResponseDto
    {    public string UserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
    }
}
