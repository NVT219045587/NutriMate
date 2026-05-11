using System.ComponentModel.DataAnnotations;

namespace NutriMate.Server.DTOs;

public record LogFoodRequest(
    [Required] string FoodId,
    [Range(0.01, 9999.0)] double Qty,
    string? LogDate
);

public record NutritionLogDto(
    string Id,
    string FoodId,
    string FoodName,
    string FoodType,
    string UnitOfMeasurement,
    double CaloriesPerUnit,
    double Qty,
    double TotalCalories,
    string LogDate
);

public record DailyLogResponse(
    string Date,
    List<NutritionLogDto> Logs,
    double TotalConsumed,
    double DailyGoal,
    double Remaining
);

public record WeeklyHistoryItem(string Date, double Calories, double Goal);

public record WeeklyHistoryResponse(
    List<WeeklyHistoryItem> History,
    double DailyGoal
);
