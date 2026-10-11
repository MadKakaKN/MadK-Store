using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MadK.Infrastructure.Tests;

public class CatalogApiTestFixture : WebApplicationFactory<Program>
{
    public string DbName { get; } = "CatalogTestDb_" + Guid.NewGuid();

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

            // Seed initial catalog data
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            SeedData(context);
        });
    }

    private static void SeedData(AppDbContext context)
    {
        context.Database.EnsureDeleted();
        context.Database.EnsureCreated();

        // 1. Categories
        var rootCat = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Gaming Gear",
            Slug = "gaming-gear",
            Description = "Phụ kiện gaming chuyên nghiệp",
            DisplayOrder = 1,
            IsActive = true
        };

        var keyboardCat = new Category
        {
            Id = Guid.NewGuid(),
            ParentId = rootCat.Id,
            Name = "Bàn phím cơ",
            Slug = "ban-phim-co",
            Description = "Bàn phím cơ custom & prebuilt",
            DisplayOrder = 1,
            IsActive = true
        };

        var mouseCat = new Category
        {
            Id = Guid.NewGuid(),
            ParentId = rootCat.Id,
            Name = "Chuột Gaming",
            Slug = "chuot-gaming",
            Description = "Chuột gaming siêu nhẹ",
            DisplayOrder = 2,
            IsActive = true
        };

        context.Categories.AddRange(rootCat, keyboardCat, mouseCat);

        var seedJsonOpts = new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

        // Spec Templates
        var keyboardSpecTemplate = new CategorySpecTemplate
        {
            Id = Guid.NewGuid(),
            CategoryId = keyboardCat.Id,
            SchemaDefinition = JsonSerializer.Serialize(new
            {
                properties = new
                {
                    @switch = new { title = "Loại Switch", @enum = new[] { "Linear", "Tactile", "Clicky" } },
                    layout = new { title = "Kích thước", @enum = new[] { "Fullsize", "TKL", "75%", "60%" } }
                }
            }, seedJsonOpts)
        };

        var mouseSpecTemplate = new CategorySpecTemplate
        {
            Id = Guid.NewGuid(),
            CategoryId = mouseCat.Id,
            SchemaDefinition = JsonSerializer.Serialize(new
            {
                properties = new
                {
                    sensor = new { title = "Cảm biến", @enum = new[] { "Optical", "Laser" } },
                    connectivity = new { title = "Kết nối", @enum = new[] { "Có dây", "Không dây 2.4GHz" } }
                }
            }, seedJsonOpts)
        };

        context.CategorySpecTemplates.AddRange(keyboardSpecTemplate, mouseSpecTemplate);

        // 2. Brands
        var keychronBrand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "Keychron",
            Slug = "keychron",
            LogoUrl = "https://example.com/keychron.png",
            IsActive = true
        };

        var logitechBrand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "Logitech",
            Slug = "logitech",
            LogoUrl = "https://example.com/logitech.png",
            IsActive = true
        };

        var akkoBrand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "Akko",
            Slug = "akko",
            LogoUrl = "https://example.com/akko.png",
            IsActive = false // Inactive
        };

        context.Brands.AddRange(keychronBrand, logitechBrand, akkoBrand);

        // 3. Products
        var product1 = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = keyboardCat.Id,
            BrandId = keychronBrand.Id,
            Name = "Bàn phím cơ Keychron Q1 Pro Wireless",
            Slug = "ban-phim-co-keychron-q1-pro-wireless",
            ShortDescription = "Bàn phím nhôm CNC 75% không dây cao cấp",
            Description = "Keychron Q1 Pro trang bị kết nối Bluetooth 5.1 và keycap PBT doubleshot.",
            Specifications = JsonSerializer.Serialize(new Dictionary<string, string>
            {
                { "switch", "Tactile" },
                { "layout", "75%" },
                { "connectivity", "Bluetooth" }
            }),
            BasePrice = 4500000m,
            Model3DUrl = "https://models.madkstore.vn/keychron-q1.glb",
            ThumbnailUrl = "https://images.madkstore.vn/q1-thumb.jpg",
            IsFeatured = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var v1 = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product1.Id,
            Sku = "KC-Q1P-RED",
            Name = "Keychron Q1 Pro Red Switch",
            OriginalPrice = 4800000m,
            SalePrice = 4500000m,
            CostPrice = 3500000m,
            IsActive = true
        };

        var v2 = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product1.Id,
            Sku = "KC-Q1P-BRN",
            Name = "Keychron Q1 Pro Brown Switch",
            OriginalPrice = 5000000m,
            SalePrice = 4700000m,
            CostPrice = 3600000m,
            IsActive = true
        };

        var img1 = new ProductImage
        {
            Id = Guid.NewGuid(),
            ProductId = product1.Id,
            ImageUrl = "https://images.madkstore.vn/q1-main.jpg",
            AltText = "Keychron Q1 Pro Main View",
            IsPrimary = true,
            DisplayOrder = 1
        };

        var product2 = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = keyboardCat.Id,
            BrandId = keychronBrand.Id,
            Name = "Bàn phím cơ Keychron K2 V2 Hot-swap",
            Slug = "ban-phim-co-keychron-k2-v2",
            ShortDescription = "Bàn phím cơ Bluetooth layout 75%",
            Description = "Keychron K2 V2 hỗ trợ cả Mac và Windows.",
            Specifications = JsonSerializer.Serialize(new Dictionary<string, string>
            {
                { "switch", "Linear" },
                { "layout", "75%" }
            }),
            BasePrice = 1800000m,
            ThumbnailUrl = "https://images.madkstore.vn/k2-thumb.jpg",
            IsFeatured = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        var v3 = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product2.Id,
            Sku = "KC-K2V2-RED",
            Name = "Keychron K2 Red Switch",
            OriginalPrice = 1900000m,
            SalePrice = 1800000m,
            CostPrice = 1400000m,
            IsActive = true
        };

        var product3 = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = mouseCat.Id,
            BrandId = logitechBrand.Id,
            Name = "Chuột gaming Logitech G Pro X Superlight",
            Slug = "chuot-gaming-logitech-g-pro-x-superlight",
            ShortDescription = "Chuột gaming không dây siêu nhẹ 63g",
            Description = "Cảm biến HERO 25K độ chính xác sub-micron.",
            Specifications = JsonSerializer.Serialize(new Dictionary<string, string>
            {
                { "sensor", "Optical" },
                { "connectivity", "Không dây 2.4GHz" }
            }),
            BasePrice = 2990000m,
            ThumbnailUrl = "https://images.madkstore.vn/gpx-thumb.jpg",
            IsFeatured = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        };

        var product4 = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = mouseCat.Id,
            BrandId = logitechBrand.Id,
            Name = "Chuột gaming Logitech G502 HERO High Performance",
            Slug = "chuot-gaming-logitech-g502-hero",
            ShortDescription = "Chuột gaming có dây cảm biến HERO 25K",
            Description = "Chuột gaming huyền thoại với 11 nút lập trình.",
            Specifications = JsonSerializer.Serialize(new Dictionary<string, string>
            {
                { "sensor", "Optical" },
                { "connectivity", "Có dây" }
            }),
            BasePrice = 990000m,
            ThumbnailUrl = "https://images.madkstore.vn/g502-thumb.jpg",
            IsFeatured = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-4)
        };

        context.Products.AddRange(product1, product2, product3, product4);
        context.ProductVariants.AddRange(v1, v2, v3);
        context.ProductImages.Add(img1);

        context.SaveChanges();
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

        // Root category: Gaming Gear
        var root = envelope.Data!.FirstOrDefault(c => c.Slug == "gaming-gear");
        root.Should().NotBeNull();
        root!.Children.Should().HaveCount(2);
        root.Children.Select(c => c.Slug).Should().Contain(new[] { "ban-phim-co", "chuot-gaming" });
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
        filters.Brands.Should().ContainSingle(b => b.Slug == "keychron");
        filters.Brands.First(b => b.Slug == "keychron").ProductCount.Should().Be(2);

        filters.PriceRange.MinPrice.Should().Be(1800000m);
        filters.PriceRange.MaxPrice.Should().Be(4500000m);

        filters.SpecFilters.Should().HaveCount(2);
        filters.SpecFilters.Select(s => s.Key).Should().Contain(new[] { "switch", "layout" });
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
        envelope.Data!.Select(b => b.Slug).Should().Contain(new[] { "keychron", "logitech" });
        envelope.Data!.Select(b => b.Slug).Should().NotContain("akko");
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
        paged.TotalItems.Should().Be(4);
        paged.Items.Should().HaveCount(4);
        paged.Page.Should().Be(1);
        paged.PageSize.Should().Be(20);
        paged.TotalPages.Should().Be(1);
    }

    [Fact]
    public async Task GetProducts_Pagination_ShouldReturnCorrectSlice()
    {
        // Act - Page 1 with pageSize 2
        var response1 = await _client.GetAsync("/api/v1/products?page=1&pageSize=2");
        var envelope1 = await response1.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions);

        // Act - Page 2 with pageSize 2
        var response2 = await _client.GetAsync("/api/v1/products?page=2&pageSize=2");
        var envelope2 = await response2.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions);

        // Assert
        envelope1!.Data!.Items.Should().HaveCount(2);
        envelope1.Data.TotalItems.Should().Be(4);
        envelope1.Data.TotalPages.Should().Be(2);

        envelope2!.Data!.Items.Should().HaveCount(2);
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
        var resAsc = await _client.GetAsync("/api/v1/products?sort=price_asc");
        var dataAsc = (await resAsc.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        dataAsc.Items.First().BasePrice.Should().Be(990000m);
        dataAsc.Items.Last().BasePrice.Should().Be(4500000m);

        // Descending
        var resDesc = await _client.GetAsync("/api/v1/products?sort=price_desc");
        var dataDesc = (await resDesc.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        dataDesc.Items.First().BasePrice.Should().Be(4500000m);
        dataDesc.Items.Last().BasePrice.Should().Be(990000m);
    }

    [Fact]
    public async Task GetProducts_SearchVietnameseWithAccents_ShouldReturnMatchingProducts()
    {
        // Search "Bàn phím cơ"
        var res1 = await _client.GetAsync("/api/v1/products?search=" + Uri.EscapeDataString("Bàn phím cơ"));
        var data1 = (await res1.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        data1.Items.Should().HaveCount(2);
        data1.Items.All(p => p.Name.Contains("Bàn phím cơ")).Should().BeTrue();

        // Search "Chuột gaming"
        var res2 = await _client.GetAsync("/api/v1/products?search=" + Uri.EscapeDataString("Chuột gaming"));
        var data2 = (await res2.Content.ReadFromJsonAsync<Result<PagedResult<ProductListDto>>>(_jsonOptions))!.Data!;
        data2.Items.Should().HaveCount(2);
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
        matchedProduct.Model3DUrl.Should().Be("https://models.madkstore.vn/keychron-q1.glb");
        matchedProduct.MinPrice.Should().Be(4500000m);
        matchedProduct.MaxPrice.Should().Be(4700000m);
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
        detail.Model3DUrl.Should().Be("https://models.madkstore.vn/keychron-q1.glb");
        detail.Category.Slug.Should().Be("ban-phim-co");
        detail.Brand.Slug.Should().Be("keychron");
        detail.Variants.Should().HaveCount(2);
        detail.Variants.Select(v => v.Sku).Should().Contain(new[] { "KC-Q1P-RED", "KC-Q1P-BRN" });
        detail.Images.Should().ContainSingle(i => i.IsPrimary);
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
