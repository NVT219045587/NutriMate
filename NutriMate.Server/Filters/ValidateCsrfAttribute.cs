using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace NutriMate.Server.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class ValidateCsrfAttribute : TypeFilterAttribute
{
    public ValidateCsrfAttribute() : base(typeof(ValidateCsrfFilter)) { }
}

public class ValidateCsrfFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var csrfHeader = context.HttpContext.Request.Headers["X-Csrf-Token"].FirstOrDefault();
        var csrfClaim = context.HttpContext.User.FindFirst("csrf_token")?.Value;

        if (string.IsNullOrEmpty(csrfHeader) || csrfHeader != csrfClaim)
        {
            context.Result = new ObjectResult(new { error = "Invalid CSRF token" })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
