using System.IO;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using MadK.API.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MadK.Infrastructure.Tests;

public class MiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CorrelationIdMiddleware_ShouldGenerateId_WhenHeaderMissing()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/ping");

        // Assert
        response.Headers.Contains("X-Correlation-Id").Should().BeTrue();
        var correlationId = response.Headers.GetValues("X-Correlation-Id").FirstOrDefault();
        correlationId.Should().NotBeNullOrWhiteSpace();
        Guid.TryParse(correlationId, out _).Should().BeTrue();
    }

    [Fact]
    public async Task CorrelationIdMiddleware_ShouldPreserveId_WhenHeaderProvided()
    {
        // Arrange
        const string customCorrelationId = "custom-test-correlation-12345";
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/ping");
        request.Headers.Add("X-Correlation-Id", customCorrelationId);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.Headers.Contains("X-Correlation-Id").Should().BeTrue();
        var correlationId = response.Headers.GetValues("X-Correlation-Id").FirstOrDefault();
        correlationId.Should().Be(customCorrelationId);
    }

    [Fact]
    public async Task GlobalExceptionMiddleware_ShouldReturn500WithUniformJson_WhenExceptionThrown()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.Items["CorrelationId"] = "test-error-trace-id";

        var logger = NullLogger<GlobalExceptionMiddleware>.Instance;
        var middleware = new GlobalExceptionMiddleware(
            _ => throw new InvalidOperationException("Something unexpected failed"),
            logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        context.Response.ContentType.Should().Contain("application/json");

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;

        root.GetProperty("isSuccess").GetBoolean().Should().BeFalse();
        root.GetProperty("error").GetString().Should().Be("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
        root.GetProperty("traceId").GetString().Should().Be("test-error-trace-id");
    }

    [Fact]
    public async Task HealthEndpoint_ShouldReturnJsonWithHealthEntries()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;

        root.TryGetProperty("status", out var statusProp).Should().BeTrue();
        statusProp.GetString().Should().NotBeNullOrWhiteSpace();

        root.TryGetProperty("entries", out var entriesProp).Should().BeTrue();
        entriesProp.TryGetProperty("postgresql", out _).Should().BeTrue();
        entriesProp.TryGetProperty("redis", out _).Should().BeTrue();
    }
}
