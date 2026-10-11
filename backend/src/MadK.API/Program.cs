using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Serilog;
using MadK.API.Middleware;
using MadK.Application;
using MadK.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ──── Serilog ────
builder.Host.UseSerilog((context, loggerConfig) =>
{
    loggerConfig
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "MadK.API");
});

// ──── Application & Infrastructure ────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ──── Controllers & Routing ────
builder.Services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
builder.Services.AddControllers();

// ──── Swagger ────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "MadK Store API",
        Version = "v1",
        Description = "API for MadK tech store"
    });
});

// ──── Health Checks (PostgreSQL + Redis) ────
var dbConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=madkstore_dev;Username=madkstore;Password=madkstore_dev_pwd";
var redisConnectionString = builder.Configuration.GetConnectionString("Redis")
    ?? "localhost:6379";

builder.Services.AddHealthChecks()
    .AddNpgSql(
        dbConnectionString,
        name: "postgresql",
        tags: new[] { "db", "ready" })
    .AddRedis(
        redisConnectionString,
        name: "redis",
        tags: new[] { "cache", "ready" });

// ──── CORS ────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ──── Custom Middleware ────
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

// ──── Middleware Pipeline ────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MadK Store API v1");
    });

    // Automatically apply pending migrations in development
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<MadK.Infrastructure.Data.AppDbContext>();
    try
    {
        if (dbContext.Database.IsRelational())
        {
            dbContext.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not apply database migrations on startup. Please ensure database is running.");
    }
}

app.UseSerilogRequestLogging();

app.UseCors("AllowFrontend");

// Auth middleware will be added in Phase 2
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

// ──── Health Check Endpoint ────
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var payload = new
        {
            status = report.Status.ToString(),
            totalDuration = report.TotalDuration.ToString(),
            entries = report.Entries.ToDictionary(
                e => e.Key,
                e => new
                {
                    status = e.Value.Status.ToString(),
                    duration = e.Value.Duration.ToString(),
                    description = e.Value.Description,
                    error = e.Value.Exception?.Message
                })
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        await context.Response.WriteAsync(json);
    }
});

app.Run();

public partial class Program { }
