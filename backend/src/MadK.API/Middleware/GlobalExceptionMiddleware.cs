using System.Net;
using System.Text.Json;

namespace MadK.API.Middleware;

public record ErrorResponse(bool IsSuccess, string Error, string TraceId);

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var traceId = context.Items["CorrelationId"]?.ToString()
                ?? context.TraceIdentifier
                ?? Guid.NewGuid().ToString();

            _logger.LogError(ex, "Unhandled exception occurred. TraceId: {TraceId}, Path: {Path}, Message: {ErrorMessage}",
                traceId, context.Request.Path, ex.Message);

            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";

                var response = new ErrorResponse(
                    IsSuccess: false,
                    Error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
                    TraceId: traceId
                );

                var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                await context.Response.WriteAsync(json);
            }
        }
    }
}
