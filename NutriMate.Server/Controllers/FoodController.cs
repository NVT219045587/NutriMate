using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NutriMate.Server.Data;
using NutriMate.Server.DTOs;

namespace NutriMate.Server.Controllers;

[ApiController]
[Route("api/food")]
[Authorize]
public class FoodController(NutriMateDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? type)
    {
        var query = db.Foods.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => f.FoodName.Contains(search));

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(f => f.FoodType == type);

        var foods = await query
            .OrderBy(f => f.FoodType).ThenBy(f => f.FoodName)
            .Select(f => new FoodDto(f.FoodId, f.FoodName, f.FoodType, f.CaloriesPerUnit, f.UnitOfMeasurement, f.StandardWeight))
            .ToListAsync();

        return Ok(foods);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var food = await db.Foods.FindAsync(id);
        if (food == null) return NotFound(new { error = "Food not found." });

        return Ok(new FoodDto(food.FoodId, food.FoodName, food.FoodType, food.CaloriesPerUnit, food.UnitOfMeasurement, food.StandardWeight));
    }
}
