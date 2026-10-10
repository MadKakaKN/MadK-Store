using Serilog;
using MadK.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ──── Serilog ────
builder.Host.UseSerilog((context, loggerConfig) =>
{
    loggerConfig.ReadFrom.Configuration(context.Configuration);
});

// ──── Infrastructure (EF Core, Repositories, etc.) ────
builder.Services.AddInfrastructure(builder.Configuration);

// ──── Controllers ────
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

// ──── Health Checks ────
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        tags: new[] { "db", "ready" });

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

// ──── Middleware Pipeline ────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MadK Store API v1");
    });
}

app.UseSerilogRequestLogging();

app.UseCors("AllowFrontend");

// Auth middleware will be added in Phase 2
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

app.Run();

public partial class Program { }
