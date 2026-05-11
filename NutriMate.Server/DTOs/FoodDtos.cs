namespace NutriMate.Server.DTOs;

public record FoodDto(
    string FoodId,
    string FoodName,
    string FoodType,
    double CaloriesPerUnit,
    string UnitOfMeasurement,
    double StandardWeight
);
