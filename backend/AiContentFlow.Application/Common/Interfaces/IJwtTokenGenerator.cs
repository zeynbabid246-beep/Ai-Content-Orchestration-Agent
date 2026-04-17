namespace AiContentFlow.Application.Common.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(string UserId, string email);
        string GenerateRefreshToken();
    }
}
