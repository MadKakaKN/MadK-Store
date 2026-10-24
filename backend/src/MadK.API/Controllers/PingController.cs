using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class PingController : ControllerBase
{
    [HttpGet]
    public IActionResult Ping()
    {
        return Ok(new
        {
            status = "Healthy",
            message = "MadK Store API is running",
            timestamp = DateTime.UtcNow
        });
    }

    [HttpGet("db-check")]
    public async Task<IActionResult> CheckDb(
        [FromServices] MadK.Infrastructure.Data.AppDbContext dbContext,
        [FromServices] ILogger<PingController> logger)
    {
        try
        {
            var canConnect = await dbContext.Database.CanConnectAsync();
            var pendingMigrations = (await dbContext.Database.GetPendingMigrationsAsync()).ToList();
            var appliedMigrations = (await dbContext.Database.GetAppliedMigrationsAsync()).ToList();

            string? tableError = null;
            int categoryCount = -1;
            int userCount = -1;

            try
            {
                categoryCount = await dbContext.Categories.CountAsync();
                userCount = await dbContext.Users.CountAsync();
            }
            catch (Exception ex)
            {
                tableError = $"{ex.GetType().Name}: {ex.Message}";
                if (ex.InnerException != null)
                {
                    tableError += $" | Inner: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}";
                }
            }

            return Ok(new
            {
                canConnect,
                pendingMigrations,
                appliedMigrations,
                categoryCount,
                userCount,
                tableError
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                canConnect = false,
                error = $"{ex.GetType().Name}: {ex.Message}",
                inner = ex.InnerException != null ? $"{ex.InnerException.GetType().Name}: {ex.InnerException.Message}" : null
            });
        }
    }

    [HttpPost("db-migrate")]
    public async Task<IActionResult> RunMigrate(
        [FromServices] MadK.Infrastructure.Data.AppDbContext dbContext,
        [FromServices] ILogger<PingController> logger)
    {
        try
        {
            await dbContext.Database.MigrateAsync();
            await MadK.Infrastructure.Data.DatabaseSeeder.SeedAsync(dbContext, logger);
            return Ok(new
            {
                success = true,
                message = "Migration and seeding completed successfully."
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                success = false,
                error = $"{ex.GetType().Name}: {ex.Message}",
                inner = ex.InnerException != null ? $"{ex.InnerException.GetType().Name}: {ex.InnerException.Message}" : null,
                stack = ex.StackTrace
            });
        }
    }
}
