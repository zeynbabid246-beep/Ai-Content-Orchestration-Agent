using System;
using System.Collections.Generic;
using System.Text;

namespace AiContentFlow.Application.Features.Auth.Dtos
{
public class LoginRequestDto
    {
        public required string Email { get; set; }
         public string? Username { get; set; }
        public required string Password { get; set; }   
    }
}
