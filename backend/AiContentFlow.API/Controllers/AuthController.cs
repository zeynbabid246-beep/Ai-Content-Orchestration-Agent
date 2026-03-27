

namespace AiContentFlow.API.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BC = BCrypt.Net.BCrypt;
using AiContentFlow.Domain.Models;
using AiContentFlow.Application.DTOs;
using AiContentFlow.Infrastructure.Data;
using AiContentFlow.Application.Services;



[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(LoginRequest request)
    {
        var exists = await _db.Users.AnyAsync(x => x.Username == request.Username);
        if (exists) return BadRequest("User exists");

        var user = new User
        {
            Username = request.Username,
          PasswordHash = BC.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.Username == request.Username);

if (user == null || !BC.Verify(request.Password, user.PasswordHash))
            return Unauthorized();

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

      
        _db.RefreshTokens.Add(new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return Ok(new { accessToken, refreshToken });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(TokenRequest request)
    {
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == request.RefreshToken);

        if (token == null || token.IsRevoked || token.ExpiryDate < DateTime.UtcNow)
            return Unauthorized();

        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;

        var newRefresh = _tokenService.GenerateRefreshToken();

     
        _db.RefreshTokens.Add(new RefreshToken
        {
            Token = newRefresh,
            UserId = token.UserId,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });

        
        var user = await _db.Users.FindAsync(token.UserId);
        if (user == null) return Unauthorized();

        var newAccess = _tokenService.GenerateAccessToken(user);

        await _db.SaveChangesAsync();

        return Ok(new { accessToken = newAccess, refreshToken = newRefresh });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(TokenRequest request)
    {
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == request.RefreshToken);

        if (token != null)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Ok();
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Ok(new { userId });
    }
}