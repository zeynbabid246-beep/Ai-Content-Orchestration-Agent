using System;
using System.Collections.Generic;
using System.Text;

namespace AiContentFlow.Application.Features.Auth.Dtos
{
    public class RefreshRequestDto
    {
        public required string RefreshToken { get; set; }
    }
}
