using Microsoft.EntityFrameworkCore;
using NutriMate.Server.Data;
using NutriMate.Server.DTOs;

namespace NutriMate.Server.Services;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(string userId);
    Task<UserProfileDto> UpdateProfileAsync(string userId, UpdateProfileRequest request);
}

public class UserService(NutriMateDbContext db) : IUserService
{
    public async Task<UserProfileDto> GetProfileAsync(string userId)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        return new UserProfileDto(
            user.UserId, user.Username, user.FullName,
            user.Age, user.Weight, user.Height, user.Gender,
            user.LastLoginAt, user.CreatedAt
        );
    }

    public async Task<UserProfileDto> UpdateProfileAsync(string userId, UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (request.FullName != null) user.FullName = request.FullName.Trim();
        if (request.Age.HasValue) user.Age = request.Age.Value;
        if (request.Weight.HasValue) user.Weight = request.Weight.Value;
        if (request.Height.HasValue) user.Height = request.Height.Value;
        if (request.Gender != null)
        {
            if (!new[] { "male", "female", "other" }.Contains(request.Gender.ToLower()))
                throw new ArgumentException("Gender must be male, female, or other.");
            user.Gender = request.Gender.ToLower();
        }

        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return new UserProfileDto(
            user.UserId, user.Username, user.FullName,
            user.Age, user.Weight, user.Height, user.Gender,
            user.LastLoginAt, user.CreatedAt
        );
    }
}
