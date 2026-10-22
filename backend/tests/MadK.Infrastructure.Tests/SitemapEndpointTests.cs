using System.Net;
using System.Xml.Linq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MadK.Infrastructure.Tests;

public class SitemapEndpointTests : IClassFixture<CatalogApiTestFixture>
{
    private readonly HttpClient _client;

    public SitemapEndpointTests(CatalogApiTestFixture factory)
    {
        _client = factory.CreateClient();
    }

    [Theory]
    [InlineData("/sitemap.xml")]
    [InlineData("/api/v1/sitemap.xml")]
    public async Task Sitemap_ShouldReturn200OkWithValidXml(string endpoint)
    {
        // Act
        var response = await _client.GetAsync(endpoint);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/xml");

        var xmlContent = await response.Content.ReadAsStringAsync();
        xmlContent.Should().NotBeNullOrWhiteSpace();

        // Parse XML to ensure well-formed standard XML document
        var doc = XDocument.Parse(xmlContent);
        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var root = doc.Element(ns + "urlset");
        root.Should().NotBeNull();

        var urls = root!.Elements(ns + "url").ToList();
        urls.Should().NotBeEmpty();

        var locs = urls.Select(u => u.Element(ns + "loc")?.Value).Where(v => v != null).ToList();

        // Must contain homepage
        locs.Should().Contain(l => l!.EndsWith("/"));

        // Must contain policies
        locs.Should().Contain(l => l!.Contains("/policies/warranty"));
        locs.Should().Contain(l => l!.Contains("/policies/returns"));
        locs.Should().Contain(l => l!.Contains("/policies/shipping"));
        locs.Should().Contain(l => l!.Contains("/policies/privacy"));
    }
}
