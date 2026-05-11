using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NutriMate.Server.DTOs;
using NutriMate.Server.Services;

namespace NutriMate.Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    private static readonly CookieOptions JwtCookieOptions = new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
        Path = "/",
        MaxAge = TimeSpan.FromHours(1),
    };

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var (response, token) = await authService.RegisterAsync(request);
            AppendJwtCookie(token);
            return Ok(response);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var (response, token) = await authService.LoginAsync(request);
            AppendJwtCookie(token);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { error = ex.Message }); }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("nutrimate_jwt", new CookieOptions { Path = "/" });
        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("refresh")]
    [Authorize]
    public async Task<IActionResult> Refresh()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var username = User.FindFirstValue(ClaimTypes.Name)!;
        try
        {
            var (response, token) = await authService.RefreshAsync(userId, username);
            AppendJwtCookie(token);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { error = ex.Message }); }
    }

    private void AppendJwtCookie(string token)
    {
        var opts = new CookieOptions
        {
            HttpOnly = JwtCookieOptions.HttpOnly,
            SameSite = JwtCookieOptions.SameSite,
            Path = JwtCookieOptions.Path,
            MaxAge = JwtCookieOptions.MaxAge,
            Secure = HttpContext.Request.IsHttps,
        };
        Response.Cookies.Append("nutrimate_jwt", token, opts);
    }
}
