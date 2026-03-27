using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using AiContentFlow.Domain.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
namespace AiContentFlow.Application.Services;



public class TokenService
{
    private readonly IConfiguration _config;

public TokenService(IConfiguration config){

_config = config;
}
public string GenerateAccessToken(User user){

var claims = new[]
{
new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
new Claim(ClaimTypes.Name, user.Username)
};
#pragma warning disable CS8604 // Possible null reference argument.
        var key = new SymmetricSecurityKey(
Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
#pragma warning restore CS8604 // Possible null reference argument.

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

var token = new JwtSecurityToken(
issuer: _config["Jwt:Issuer"],
audience: _config["Jwt:Audience"],
claims: claims,
expires: DateTime.UtcNow.AddMinutes(15),
signingCredentials: creds

);

return new JwtSecurityTokenHandler().WriteToken(token);
}
public string GenerateRefreshToken()
{
return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
}
