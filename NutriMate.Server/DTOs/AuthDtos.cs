using System.ComponentModel.DataAnnotations;

namespace NutriMate.Server.DTOs;

public record RegisterRequest(
    [Required, MinLength(3), MaxLength(50)] string Username,
    [Required] string Password,
    [Required, MaxLength(100)] string FullName,
    [Range(1, 120)] int Age,
    [Range(1.0, 500.0)] double Weight,
    [Range(50.0, 300.0)] double Height,
    [Required] string Gender
);

public record LoginRequest(
    [Required] string Username,
    [Required] string Password
);

public record AuthResponse(
    string CsrfToken,
    UserBriefDto User
);

public record UserBriefDto(
    string UserId,
    string Username,
    string FullName
);
