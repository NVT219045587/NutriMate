using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NutriMate.Server.Data;
using NutriMate.Server.DTOs;
using NutriMate.Server.Models;

namespace NutriMate.Server.Services;

public interface IAuthService
{
    Task<(AuthResponse Response, string Token)> RegisterAsync(RegisterRequest request);
    Task<(AuthResponse Response, string Token)> LoginAsync(LoginRequest request);
    Task<(AuthResponse Response, string Token)> RefreshAsync(string userId, string username);
}

public class AuthService(NutriMateDbContext db, IConfiguration config) : IAuthService
{
    private static readonly Regex UpperCase = new("[A-Z]");
    private static readonly Regex LowerCase = new("[a-z]");
    private static readonly Regex Digit = new("[0-9]");
    private static readonly Regex Special = new(@"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>/?]");

    public async Task<(AuthResponse Response, string Token)> RegisterAsync(RegisterRequest request)
    {
        if (request.Password.Length < 8)
            throw new ArgumentException("Password must be at least 8 characters.");
        if (!UpperCase.IsMatch(request.Password))
            throw new ArgumentException("Password must contain at least one uppercase letter.");
        if (!LowerCase.IsMatch(request.Password))
            throw new ArgumentException("Password must contain at least one lowercase letter.");
        if (!Digit.IsMatch(request.Password))
            throw new ArgumentException("Password must contain at least one digit.");
        if (!Special.IsMatch(request.Password))
            throw new ArgumentException("Password must contain at least one special character.");
        if (!new[] { "male", "female", "other" }.Contains(request.Gender.ToLower()))
            throw new ArgumentException("Gender must be male, female, or other.");

        var existing = await db.Users.AnyAsync(u => u.Username == request.Username);
        if (existing) throw new InvalidOperationException("Username already taken.");

        var salt = BCrypt.Net.BCrypt.GenerateSalt(12);
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, salt);

        var user = new User
        {
            Username = request.Username.Trim(),
            PasswordHash = passwordHash,
            Salt = salt,
            FullName = request.FullName.Trim(),
            Age = request.Age,
            Weight = request.Weight,
            Height = request.Height,
            Gender = request.Gender.ToLower(),
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return await BuildAuthResponse(user);
    }

    public async Task<(AuthResponse Response, string Token)> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return await BuildAuthResponse(user);
    }

    public async Task<(AuthResponse Response, string Token)> RefreshAsync(string userId, string username)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        return await BuildAuthResponse(user);
    }

    private Task<(AuthResponse Response, string Token)> BuildAuthResponse(User user)
    {
        var csrfToken = Guid.NewGuid().ToString();
        var jwtToken = GenerateToken(user.UserId, user.Username, csrfToken);

        var response = new AuthResponse(
            csrfToken,
            new UserBriefDto(user.UserId, user.Username, user.FullName)
        );

        return Task.FromResult((response, jwtToken));
    }

    private string GenerateToken(string userId, string username, string csrfToken)
    {
        var secret = config["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, username),
            new Claim("csrf_token", csrfToken),
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
