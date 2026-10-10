using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MadK.Infrastructure.Tests;

public class PingEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public PingEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Ping_ShouldReturn200OkWithExpectedPayload()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/ping");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;

        root.GetProperty("status").GetString().Should().Be("Healthy");
        root.GetProperty("message").GetString().Should().Be("MadK Store API is running");
        root.TryGetProperty("timestamp", out _).Should().BeTrue();
    }
}
