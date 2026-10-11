using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadK.Infrastructure.Tests;

public class CatalogApiTestFixture : WebApplicationFactory<Program>
{
    public string DbName { get; } = "CatalogApiTestDb_" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove real DbContext registrations
            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(AppDbContext) ||
                d.ServiceType == typeof(Application.Interfaces.IAppDbContext)).ToList();

            foreach (var d in descriptors)
            {
                services.Remove(d);
            }

            // Register InMemory database for test isolation
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(DbName);
            });
            services.AddScoped<Application.Interfaces.IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        });
    }
}

public class CatalogApiTests : IClassFixture<CatalogApiTestFixture>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public CatalogApiTests(CatalogApiTestFixture fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task GetCategoryTree_ShouldReturnNestedHierarchy()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/categories");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var envelope = await response.Content.ReadFromJsonAsync<Result<List<CategoryTreeDto>>>(_jsonOptions);

        envelope.Should().NotBeNull();
        envelope!.IsSuccess.Should().BeTrue();
        envelope.Data.Should().NotBeNull();

        // Root category: Phụ kiện & Gaming Gear
        var phuKien = envelope.Data!.FirstOrDefault(c => c.Slug == "phu-kien");
        phuKien.Should().NotBeNull();
        phuKien!.Children.Should().HaveCount(3);
        phuKien.Children.Select(c => c.Slug).Should().Contain(new[] { "ban-phim-co", "chuot-gaming", "tai-nghe" });

        // Root category: Laptop
        var laptop = envelope.Data!.FirstOrDefault(c => c.Slug == "laptop");
        laptop.Should().NotBeNull();
        laptop!.Children.Select(c => c.Slug).Should().Contain(new[] { "laptop-gaming", "laptop-van-phong" });
    }

    [Fact]
    public async Task GetCategoryBySlug_ExistingSlug_ShouldReturnCategoryWithSpecTemplate()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/categories/ban-phim-co");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var envelope = await response.Content.ReadFromJsonAsync<Result<CategoryDetailDto>>(_jsonOptions);

        envelope.Should().NotBeNull();
        envelope!.IsSuccess.Should().BeTrue();
        envelope.Data!.Slug.Should().Be("ban-phim-co");
        envelope.Data.SchemaDefinition.Should().NotBeNullOrWhiteSpace();
        envelope.Data.SchemaDefinition.Should().Contain("switch");
        envelope.Data.SchemaDefinition.Should().Contain("Loại Switch");
    }

    [Fact]
    public async Task GetCategoryBySlug_NonExistentSlug_ShouldReturn404NotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/categories/non-existent-category-slug");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var envelope = await response.Content.ReadFromJsonAsync<Result<CategoryDetailDto>>(_jsonOptions);
        envelope!.IsSuccess.Should().BeFalse();
        envelope.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GetCategoryFilters_ShouldReturnDynamicBrandsPriceRangeAndSpecFilters()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/categories/ban-phim-co/filters");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var envelope = await response.Content.ReadFromJsonAsync<Result<CategoryFiltersDto>>(_jsonOptions);

        envelope.Should().NotBeNull();
        envelope!.IsSuccess.Should().BeTrue();

        var filters = envelope.Data!;
        filters.CategorySlug.Should().Be("ban-phim-co");
        filters.Brands.Should().Contain(b => b.Slug == "keychron");
        filters.Brands.First(b => b.Slug == "keychron").ProductCount.Should().Be(4);

        filters.PriceRange.MinPrice.Should().Be(2190000m);
        filters.PriceRange.MaxPrice.Should().Be(5490000m);

        filters.SpecFilters.Should().NotBeEmpty();
        filters.SpecFilters.Select(s => s.Key).Should().Contain(new[] { "switch", "layout", "connectivity", "hotswap" });
        filters.SpecFilters.First(s => s.Key == "switch").Options.Should().Contain(new[] { "Linear", "Tactile", "Clicky" });
    }

    [Fact]
    public async Task GetBrands_ActiveOnly_ShouldExcludeInactiveBrands()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/brands?isActive=true");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var envelope = await response.Content.ReadFromJsonAsync<Result<List<BrandDto>>>(_jsonOptions);

        envelope.Should().NotBeNull();
        envelope!.IsSuccess.Should().BeTrue();
        envelope.Data!.Select(b => b.Slug).Should().Contain(new[] { "apple", "samsung", "asus", "keychron", "logitech" });
    }

    [Fact]
    public async Task GetProducts_DefaultPagination_ShouldReturnAllProductsWithCorrectEnvelope()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/products");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var envelope = await response.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions);

        envelope.Should().NotBeNull();
        envelope!.IsSuccess.Should().BeTrue();
        var paged = envelope.Data!;
        paged.TotalItems.Should().Be(75);
        paged.Items.Should().HaveCount(20);
        paged.Page.Should().Be(1);
        paged.PageSize.Should().Be(20);
        paged.TotalPages.Should().Be(4);
    }

    [Fact]
    public async Task GetProducts_Pagination_ShouldReturnCorrectSlice()
    {
        // Act - Page 1 with pageSize 10
        var response1 = await _client.GetAsync("/api/v1/products?page=1&pageSize=10");
        var envelope1 = await response1.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions);

        // Act - Page 2 with pageSize 10
        var response2 = await _client.GetAsync("/api/v1/products?page=2&pageSize=10");
        var envelope2 = await response2.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions);

        // Assert
        envelope1!.Data!.Items.Should().HaveCount(10);
        envelope1.Data.TotalItems.Should().Be(75);
        envelope1.Data.TotalPages.Should().Be(8);

        envelope2!.Data!.Items.Should().HaveCount(10);
        envelope2.Data.Page.Should().Be(2);

        // Ensure distinct items across pages
        var page1Ids = envelope1.Data.Items.Select(x => x.Id).ToList();
        var page2Ids = envelope2.Data.Items.Select(x => x.Id).ToList();
        page1Ids.Intersect(page2Ids).Should().BeEmpty();
    }

    [Fact]
    public async Task GetProducts_Sorting_PriceAscendingAndDescending_ShouldOrderCorrectly()
    {
        // Ascending
        var resAsc = await _client.GetAsync("/api/v1/products?sort=price_asc&pageSize=50");
        var dataAsc = (await resAsc.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        for (int i = 0; i < dataAsc.Items.Count - 1; i++)
        {
            dataAsc.Items[i].BasePrice.Should().BeLessThanOrEqualTo(dataAsc.Items[i + 1].BasePrice);
        }

        // Descending
        var resDesc = await _client.GetAsync("/api/v1/products?sort=price_desc&pageSize=50");
        var dataDesc = (await resDesc.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        for (int i = 0; i < dataDesc.Items.Count - 1; i++)
        {
            dataDesc.Items[i].BasePrice.Should().BeGreaterThanOrEqualTo(dataDesc.Items[i + 1].BasePrice);
        }
    }

    [Fact]
    public async Task GetProducts_SearchVietnameseWithAccents_ShouldReturnMatchingProducts()
    {
        // Search "Bàn phím cơ"
        var res1 = await _client.GetAsync("/api/v1/products?search=" + Uri.EscapeDataString("Bàn phím cơ") + "&pageSize=50");
        var data1 = (await res1.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        data1.Items.Should().NotBeEmpty();
        data1.Items.All(p => p.Name.Contains("Bàn phím cơ")).Should().BeTrue();

        // Search "Chuột gaming"
        var res2 = await _client.GetAsync("/api/v1/products?search=" + Uri.EscapeDataString("Chuột gaming") + "&pageSize=50");
        var data2 = (await res2.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        data2.Items.Should().NotBeEmpty();
        data2.Items.All(p => p.Name.Contains("Chuột gaming")).Should().BeTrue();
    }

    [Fact]
    public async Task GetProducts_FilterCombined_CategoryBrandPriceAndSpecs_ShouldReturnExpectedProduct()
    {
        // Filter category ban-phim-co + brand keychron + minPrice 4000000 + specs[switch]=Tactile
        var url = "/api/v1/products?categorySlug=ban-phim-co&brandSlug=keychron&minPrice=4000000&specs[switch]=Tactile";
        var response = await _client.GetAsync(url);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var envelope = await response.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions);

        envelope.Should().NotBeNull();
        envelope!.Data!.Items.Should().ContainSingle();

        var matchedProduct = envelope.Data.Items.Single();
        matchedProduct.Slug.Should().Be("ban-phim-co-keychron-q1-pro-wireless");
        matchedProduct.Model3DUrl.Should().Be("https://models.madkstore.vn/keychron-q1-pro.glb");
        matchedProduct.MinPrice.Should().Be(4500000m);
    }

    [Fact]
    public async Task GetProductBySlug_ExistingProduct_ShouldIncludeVariantsImagesAnd3DModel()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/products/ban-phim-co-keychron-q1-pro-wireless");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var envelope = await response.Content.ReadFromJsonAsync<Result<ProductDetailDto>>(_jsonOptions);

        envelope.Should().NotBeNull();
        envelope!.IsSuccess.Should().BeTrue();

        var detail = envelope.Data!;
        detail.Slug.Should().Be("ban-phim-co-keychron-q1-pro-wireless");
        detail.Model3DUrl.Should().Be("https://models.madkstore.vn/keychron-q1-pro.glb");
        detail.Category.Slug.Should().Be("ban-phim-co");
        detail.Brand.Slug.Should().Be("keychron");
        detail.Variants.Should().HaveCount(2);
        detail.Variants.Select(v => v.Sku).Should().Contain(new[] { "KQ1P-RED", "KQ1P-BRN" });
        detail.Images.Should().Contain(i => i.IsPrimary);
    }

    [Fact]
    public async Task GetProductBySlug_NonExistent_ShouldReturn404NotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/products/san-pham-khong-ton-tai");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var envelope = await response.Content.ReadFromJsonAsync<Result<ProductDetailDto>>(_jsonOptions);
        envelope!.IsSuccess.Should().BeFalse();
        envelope.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task SwaggerDoc_ShouldExposeAllCatalogEndpoints()
    {
        // Act
        var response = await _client.GetAsync("/swagger/v1/swagger.json");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var paths = doc.RootElement.GetProperty("paths");

        // All catalog endpoints must be present
        paths.TryGetProperty("/api/v1/categories", out _).Should().BeTrue();
        paths.TryGetProperty("/api/v1/categories/{slug}", out _).Should().BeTrue();
        paths.TryGetProperty("/api/v1/categories/{slug}/filters", out _).Should().BeTrue();
        paths.TryGetProperty("/api/v1/brands", out _).Should().BeTrue();
        paths.TryGetProperty("/api/v1/products", out _).Should().BeTrue();
        paths.TryGetProperty("/api/v1/products/{slug}", out _).Should().BeTrue();
    }
}
