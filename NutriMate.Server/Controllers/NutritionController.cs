using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NutriMate.Server.DTOs;
using NutriMate.Server.Filters;
using NutriMate.Server.Services;

namespace NutriMate.Server.Controllers;

[ApiController]
[Route("api/nutrition")]
[Authorize]
public class NutritionController(INutritionService nutritionService) : ControllerBase
{
    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyLog([FromQuery] string? date)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var logDate = date != null
            ? DateOnly.Parse(date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var result = await nutritionService.GetDailyLogAsync(userId, logDate);
        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetWeeklyHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await nutritionService.GetWeeklyHistoryAsync(userId);
        return Ok(result);
    }

    [HttpPost("log")]
    [ValidateCsrf]
    public async Task<IActionResult> LogFood([FromBody] LogFoodRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        try
        {
            var log = await nutritionService.LogFoodAsync(userId, request);
            return CreatedAtAction(nameof(GetDailyLog), log);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (FormatException) { return BadRequest(new { error = "Invalid date format. Use yyyy-MM-dd." }); }
    }

    [HttpDelete("log/{id}")]
    [ValidateCsrf]
    public async Task<IActionResult> DeleteLog(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        try
        {
            await nutritionService.DeleteLogAsync(userId, id);
            return Ok(new { message = "Log entry deleted." });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}
