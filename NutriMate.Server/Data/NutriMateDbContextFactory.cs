using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace NutriMate.Server.Data;

// Used by `dotnet ef migrations add` so it can instantiate the DbContext
// at design time without running Program.cs or needing a live database.
public class NutriMateDbContextFactory : IDesignTimeDbContextFactory<NutriMateDbContext>
{
    public NutriMateDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<NutriMateDbContext>()
            .UseSqlServer(
                "Server=localhost,1433;Database=NutriMate;User Id=sa;Password=Dev@Passw0rd123;TrustServerCertificate=True;",
                sql => sql.EnableRetryOnFailure(3))
            .Options;

        return new NutriMateDbContext(options);
    }
}
