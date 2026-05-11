namespace NutriMate.Server.DTOs;

public record UserProfileDto(
    string UserId,
    string Username,
    string FullName,
    int Age,
    double Weight,
    double Height,
    string Gender,
    DateTime? LastLoginAt,
    DateTime CreatedAt
);

public record UpdateProfileRequest(
    string? FullName,
    int? Age,
    double? Weight,
    double? Height,
    string? Gender
);
