using Microsoft.EntityFrameworkCore;
using NutriMate.Server.Models;

namespace NutriMate.Server.Data;

public class NutriMateDbContext(DbContextOptions<NutriMateDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Food> Foods => Set<Food>();
    public DbSet<UserNutrition> UserNutritions => Set<UserNutrition>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.UserId);
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Gender).HasConversion<string>();
        });

        modelBuilder.Entity<Food>(e =>
        {
            e.HasKey(f => f.FoodId);
        });

        modelBuilder.Entity<UserNutrition>(e =>
        {
            e.HasKey(un => un.Id);
            e.HasOne(un => un.User)
                .WithMany(u => u.NutritionLogs)
                .HasForeignKey(un => un.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(un => un.Food)
                .WithMany(f => f.NutritionLogs)
                .HasForeignKey(un => un.FoodId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
