namespace NutriMate.Server.Models;

public class UserNutrition
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = null!;
    public string FoodId { get; set; } = null!;
    public double Qty { get; set; }
    public DateOnly LogDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Food Food { get; set; } = null!;
}
