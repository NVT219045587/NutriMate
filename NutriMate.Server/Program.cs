using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NutriMate.Server.Data;
using NutriMate.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
// In production the connection string comes from the environment variable
// ConnectionStrings__DefaultConnection (set in docker-compose / Jenkins).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

builder.Services.AddDbContext<NutriMateDbContext>(options =>
    options.UseSqlServer(connectionString,
        sql => sql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null)));

// ── JWT authentication ────────────────────────────────────────────────────────
// Token is written to an httpOnly cookie by AuthController and read back here.
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies["nutrimate_jwt"];
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── Application services ──────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INutritionService, NutritionService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In the Docker setup the nginx reverse-proxy forwards all /api/* traffic to
// this container so the browser never sees a cross-origin request.  The CORS
// policy below is kept for local Vite-proxy development and direct API access.
builder.Services.AddCors(options =>
    options.AddPolicy("SpaPolicy", policy =>
        policy
            .WithOrigins(
                builder.Configuration["AllowedOrigins"] ?? "https://localhost:52812",
                "http://localhost:52812",
                "https://localhost:52812",
                "http://localhost:8090")
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod()));

// ── Forwarded-headers support for nginx reverse proxy ────────────────────────
// Allows HttpContext.Request.IsHttps to reflect the original scheme so that
// the Secure flag on cookies is set correctly behind TLS termination.
builder.Services.Configure<ForwardedHeadersOptions>(opts =>
{
    opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    opts.KnownNetworks.Clear();
    opts.KnownProxies.Clear();
});

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Apply pending migrations with startup retry ───────────────────────────────
// MSSQL inside Docker typically takes 20–40 s before it accepts connections.
// We retry here so the API container can start before the DB is fully ready.
await MigrateWithRetryAsync(app);

app.UseForwardedHeaders();

// Static files are only relevant when the .NET app also serves the frontend
// (single-container mode). In the separate-container setup the UI is served
// by nginx; these calls are harmless no-ops in that case.
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("SpaPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapFallbackToFile("/index.html");

app.Run();

// ── Helpers ───────────────────────────────────────────────────────────────────
static async Task MigrateWithRetryAsync(WebApplication app)
{
    const int maxAttempts = 12;
    var logger = app.Services.GetRequiredService<ILogger<Program>>();

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<NutriMateDbContext>();
            await db.Database.MigrateAsync();

            if (!db.Foods.Any())
            {
                SeedData.SeedFoods(db);
                logger.LogInformation("Food data seeded.");
            }

            logger.LogInformation("Database migration applied successfully.");
            return;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(ex,
                "Database not ready — attempt {Attempt}/{Max}. Retrying in 10 s…",
                attempt, maxAttempts);
            await Task.Delay(TimeSpan.FromSeconds(10));
        }
    }
}
