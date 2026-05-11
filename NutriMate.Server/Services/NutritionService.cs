using Microsoft.EntityFrameworkCore;
using NutriMate.Server.Data;
using NutriMate.Server.DTOs;
using NutriMate.Server.Models;

namespace NutriMate.Server.Services;

public interface INutritionService
{
    Task<DailyLogResponse> GetDailyLogAsync(string userId, DateOnly date);
    Task<WeeklyHistoryResponse> GetWeeklyHistoryAsync(string userId);
    Task<NutritionLogDto> LogFoodAsync(string userId, LogFoodRequest request);
    Task DeleteLogAsync(string userId, string logId);
}

public class NutritionService(NutriMateDbContext db) : INutritionService
{
    public async Task<DailyLogResponse> GetDailyLogAsync(string userId, DateOnly date)
    {
        var logs = await db.UserNutritions
            .Include(un => un.Food)
            .Where(un => un.UserId == userId && un.LogDate == date)
            .OrderBy(un => un.CreatedAt)
            .ToListAsync();

        var user = await db.Users.FindAsync(userId);
        var dailyGoal = user != null ? CalculateDailyGoal(user) : 2000;
        var totalConsumed = logs.Sum(l => Math.Round(l.Food.CaloriesPerUnit * l.Qty, 1));

        return new DailyLogResponse(
            date.ToString("yyyy-MM-dd"),
            logs.Select(ToDto).ToList(),
            Math.Round(totalConsumed, 1),
            dailyGoal,
            Math.Round(dailyGoal - totalConsumed, 1)
        );
    }

    public async Task<WeeklyHistoryResponse> GetWeeklyHistoryAsync(string userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var startDate = today.AddDays(-6);

        var logs = await db.UserNutritions
            .Include(un => un.Food)
            .Where(un => un.UserId == userId && un.LogDate >= startDate && un.LogDate <= today)
            .ToListAsync();

        var user = await db.Users.FindAsync(userId);
        var dailyGoal = user != null ? CalculateDailyGoal(user) : 2000;

        var history = Enumerable.Range(0, 7)
            .Select(i => today.AddDays(-6 + i))
            .Select(date =>
            {
                var dayCalories = logs
                    .Where(l => l.LogDate == date)
                    .Sum(l => l.Food.CaloriesPerUnit * l.Qty);
                return new WeeklyHistoryItem(
                    date.ToString("yyyy-MM-dd"),
                    Math.Round(dayCalories, 1),
                    dailyGoal
                );
            })
            .ToList();

        return new WeeklyHistoryResponse(history, dailyGoal);
    }

    public async Task<NutritionLogDto> LogFoodAsync(string userId, LogFoodRequest request)
    {
        var food = await db.Foods.FindAsync(request.FoodId)
            ?? throw new KeyNotFoundException("Food not found.");

        var logDate = request.LogDate != null
            ? DateOnly.Parse(request.LogDate)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var log = new UserNutrition
        {
            UserId = userId,
            FoodId = request.FoodId,
            Qty = request.Qty,
            LogDate = logDate,
        };

        db.UserNutritions.Add(log);
        await db.SaveChangesAsync();

        log.Food = food;
        return ToDto(log);
    }

    public async Task DeleteLogAsync(string userId, string logId)
    {
        var log = await db.UserNutritions
            .FirstOrDefaultAsync(un => un.Id == logId && un.UserId == userId)
            ?? throw new KeyNotFoundException("Log entry not found.");

        db.UserNutritions.Remove(log);
        await db.SaveChangesAsync();
    }

    private static NutritionLogDto ToDto(UserNutrition log) => new(
        log.Id,
        log.FoodId,
        log.Food.FoodName,
        log.Food.FoodType,
        log.Food.UnitOfMeasurement,
        log.Food.CaloriesPerUnit,
        log.Qty,
        Math.Round(log.Food.CaloriesPerUnit * log.Qty, 1),
        log.LogDate.ToString("yyyy-MM-dd")
    );

    private static double CalculateDailyGoal(User user)
    {
        // Mifflin-St Jeor × sedentary-to-moderate activity factor (1.55)
        double bmr = user.Gender == "female"
            ? 10 * user.Weight + 6.25 * user.Height - 5 * user.Age - 161
            : 10 * user.Weight + 6.25 * user.Height - 5 * user.Age + 5;
        return Math.Round(bmr * 1.55);
    }
}
