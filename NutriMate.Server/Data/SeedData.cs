using NutriMate.Server.Models;

namespace NutriMate.Server.Data;

public static class SeedData
{
    public static void SeedFoods(NutriMateDbContext db)
    {
        var foods = new List<Food>
        {
            new() { FoodName = "Chicken Breast",        FoodType = "Protein",       CaloriesPerUnit = 165,  UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Salmon Fillet",         FoodType = "Protein",       CaloriesPerUnit = 208,  UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Egg",                   FoodType = "Protein",       CaloriesPerUnit = 78,   UnitOfMeasurement = "piece",   StandardWeight = 50  },
            new() { FoodName = "Tuna (Canned)",         FoodType = "Protein",       CaloriesPerUnit = 116,  UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Tofu",                  FoodType = "Protein",       CaloriesPerUnit = 76,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "White Rice (Cooked)",   FoodType = "Carbohydrate",  CaloriesPerUnit = 130,  UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Brown Rice (Cooked)",   FoodType = "Carbohydrate",  CaloriesPerUnit = 112,  UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Oatmeal (Cooked)",      FoodType = "Carbohydrate",  CaloriesPerUnit = 71,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Whole Wheat Bread",     FoodType = "Carbohydrate",  CaloriesPerUnit = 69,   UnitOfMeasurement = "slice",   StandardWeight = 28  },
            new() { FoodName = "Sweet Potato",          FoodType = "Carbohydrate",  CaloriesPerUnit = 86,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Pasta (Cooked)",        FoodType = "Carbohydrate",  CaloriesPerUnit = 131,  UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Quinoa (Cooked)",       FoodType = "Carbohydrate",  CaloriesPerUnit = 120,  UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Broccoli",              FoodType = "Vegetable",     CaloriesPerUnit = 34,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Spinach",               FoodType = "Vegetable",     CaloriesPerUnit = 23,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Carrot",                FoodType = "Vegetable",     CaloriesPerUnit = 41,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Bell Pepper",           FoodType = "Vegetable",     CaloriesPerUnit = 31,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Apple",                 FoodType = "Fruit",         CaloriesPerUnit = 95,   UnitOfMeasurement = "piece",   StandardWeight = 182 },
            new() { FoodName = "Banana",                FoodType = "Fruit",         CaloriesPerUnit = 105,  UnitOfMeasurement = "piece",   StandardWeight = 118 },
            new() { FoodName = "Orange",                FoodType = "Fruit",         CaloriesPerUnit = 62,   UnitOfMeasurement = "piece",   StandardWeight = 131 },
            new() { FoodName = "Strawberries",          FoodType = "Fruit",         CaloriesPerUnit = 32,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Whole Milk",            FoodType = "Dairy",         CaloriesPerUnit = 61,   UnitOfMeasurement = "100ml",   StandardWeight = 100 },
            new() { FoodName = "Greek Yogurt",          FoodType = "Dairy",         CaloriesPerUnit = 59,   UnitOfMeasurement = "100g",    StandardWeight = 100 },
            new() { FoodName = "Cheddar Cheese",        FoodType = "Dairy",         CaloriesPerUnit = 113,  UnitOfMeasurement = "slice",   StandardWeight = 28  },
            new() { FoodName = "Almonds",               FoodType = "Fat",           CaloriesPerUnit = 164,  UnitOfMeasurement = "oz",      StandardWeight = 28  },
            new() { FoodName = "Avocado",               FoodType = "Fat",           CaloriesPerUnit = 234,  UnitOfMeasurement = "piece",   StandardWeight = 146 },
            new() { FoodName = "Olive Oil",             FoodType = "Fat",           CaloriesPerUnit = 119,  UnitOfMeasurement = "tbsp",    StandardWeight = 14  },
            new() { FoodName = "Peanut Butter",         FoodType = "Fat",           CaloriesPerUnit = 94,   UnitOfMeasurement = "tbsp",    StandardWeight = 16  },
        };

        db.Foods.AddRange(foods);
        db.SaveChanges();
    }
}
