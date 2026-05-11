namespace NutriMate.Server.Models;

public class Food
{
    public string FoodId { get; set; } = Guid.NewGuid().ToString();
    public string FoodName { get; set; } = null!;
    public string FoodType { get; set; } = null!;
    public double CaloriesPerUnit { get; set; }
    public string UnitOfMeasurement { get; set; } = null!;
    public double StandardWeight { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserNutrition> NutritionLogs { get; set; } = [];
}
