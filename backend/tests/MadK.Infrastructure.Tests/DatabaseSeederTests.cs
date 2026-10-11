using System.Text.Json;
using FluentAssertions;
using MadK.Application.DTOs.Catalog;
using MadK.Application.Services;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MadK.Infrastructure.Tests;

public class DatabaseSeederTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task SeedAsync_WhenRunFirstTime_ShouldSeedDiverseData()
    {
        // Arrange
        var dbName = "SeederTestDb_FirstRun_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);

        // Act
        await DatabaseSeeder.SeedAsync(context);

        // Assert
        var categories = await context.Categories.ToListAsync();
        categories.Should().HaveCount(15); // 4 root + 11 subcategories

        var rootCategories = categories.Where(c => c.ParentId == null).ToList();
        rootCategories.Should().HaveCount(4);
        rootCategories.Select(c => c.Slug).Should().Contain(new[] { "dien-thoai", "laptop", "phu-kien", "linh-kien" });

        var specTemplates = await context.CategorySpecTemplates.ToListAsync();
        specTemplates.Should().HaveCount(11); // 11 leaf categories each have a spec template

        var brands = await context.Brands.ToListAsync();
        brands.Should().HaveCount(15);
        brands.Select(b => b.Slug).Should().Contain(new[] { "apple", "samsung", "asus", "dell", "lenovo", "logitech", "razer", "keychron", "sony", "intel", "amd", "nvidia", "corsair", "kingston" });

        var products = await context.Products.Include(p => p.Variants).Include(p => p.Images).ToListAsync();
        products.Count.Should().BeInRange(50, 100);
        products.Should().HaveCount(75);

        // Verify variants and images
        var variants = await context.ProductVariants.ToListAsync();
        variants.Count.Should().BeGreaterThanOrEqualTo(75);

        var images = await context.ProductImages.ToListAsync();
        images.Count.Should().BeGreaterThanOrEqualTo(75);

        // Verify 3D models exist on featured items
        var productsWith3D = products.Where(p => !string.IsNullOrEmpty(p.Model3DUrl)).ToList();
        productsWith3D.Should().HaveCountGreaterOrEqualTo(5);
        productsWith3D.All(p => p.Model3DUrl!.EndsWith(".glb")).Should().BeTrue();

        // Verify valid image URLs
        products.All(p => !string.IsNullOrEmpty(p.ThumbnailUrl) && p.ThumbnailUrl.StartsWith("https://")).Should().BeTrue();
    }

    [Fact]
    public async Task SeedAsync_WhenRunTwice_ShouldBeIdempotentAndProduceNoDuplicates()
    {
        // Arrange
        var dbName = "SeederTestDb_Idempotent_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);

        // Act - Run 1
        await DatabaseSeeder.SeedAsync(context);

        var countCategories1 = await context.Categories.CountAsync();
        var countBrands1 = await context.Brands.CountAsync();
        var countProducts1 = await context.Products.CountAsync();
        var countVariants1 = await context.ProductVariants.CountAsync();
        var countImages1 = await context.ProductImages.CountAsync();
        var countTemplates1 = await context.CategorySpecTemplates.CountAsync();

        // Act - Run 2 (on the same database)
        await DatabaseSeeder.SeedAsync(context);

        var countCategories2 = await context.Categories.CountAsync();
        var countBrands2 = await context.Brands.CountAsync();
        var countProducts2 = await context.Products.CountAsync();
        var countVariants2 = await context.ProductVariants.CountAsync();
        var countImages2 = await context.ProductImages.CountAsync();
        var countTemplates2 = await context.CategorySpecTemplates.CountAsync();

        // Assert - Identical counts, no duplicates, no exceptions
        countCategories2.Should().Be(countCategories1);
        countBrands2.Should().Be(countBrands1);
        countProducts2.Should().Be(countProducts1);
        countVariants2.Should().Be(countVariants1);
        countImages2.Should().Be(countImages1);
        countTemplates2.Should().Be(countTemplates1);
    }

    [Fact]
    public async Task SeededData_Specifications_ShouldMatchCategorySchema()
    {
        // Arrange
        var dbName = "SeederTestDb_SchemaMatch_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);
        await DatabaseSeeder.SeedAsync(context);

        var products = await context.Products.Include(p => p.Category).ToListAsync();
        var templates = await context.CategorySpecTemplates.ToDictionaryAsync(t => t.CategoryId);

        // Assert
        foreach (var product in products)
        {
            product.Specifications.Should().NotBeNullOrWhiteSpace();

            // Must be valid JSON
            var specsDoc = JsonDocument.Parse(product.Specifications);
            specsDoc.RootElement.ValueKind.Should().Be(JsonValueKind.Object);

            // Category must have a spec template
            templates.Should().ContainKey(product.CategoryId);
            var templateDoc = JsonDocument.Parse(templates[product.CategoryId].SchemaDefinition);
            var schemaProperties = templateDoc.RootElement.GetProperty("properties");

            // At least one schema property must match product specifications
            var matchingPropCount = 0;
            foreach (var prop in specsDoc.RootElement.EnumerateObject())
            {
                if (schemaProperties.TryGetProperty(prop.Name, out var schemaProp))
                {
                    matchingPropCount++;
                    // If schema defines enum values, product value should belong to the enum
                    if (schemaProp.TryGetProperty("enum", out var enumArr))
                    {
                        var enumValues = enumArr.EnumerateArray().Select(e => e.GetString()).ToList();
                        enumValues.Should().Contain(prop.Value.GetString());
                    }
                }
            }

            matchingPropCount.Should().BeGreaterThan(0, because: $"Product {product.Name} should have valid specs according to category {product.Category.Name}");
        }
    }

    [Fact]
    public async Task SeededData_CatalogServiceQueries_ShouldSupportDiverseFiltering()
    {
        // Arrange
        var dbName = "SeederTestDb_Queries_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);
        await DatabaseSeeder.SeedAsync(context);

        var service = new CatalogService(context);

        // 1. Query Phones
        var phoneResult = await service.GetProductsAsync(new ProductQueryParams
        {
            CategorySlug = "dien-thoai-thong-minh",
            PageSize = 50
        });
        phoneResult.IsSuccess.Should().BeTrue();
        phoneResult.Data!.Items.Should().HaveCount(10);
        phoneResult.Data.Items.All(p => p.CategorySlug == "dien-thoai-thong-minh").Should().BeTrue();

        // 2. Query Gaming Laptops with price filter
        var laptopResult = await service.GetProductsAsync(new ProductQueryParams
        {
            CategorySlug = "laptop-gaming",
            MinPrice = 40000000m,
            PageSize = 50
        });
        laptopResult.IsSuccess.Should().BeTrue();
        laptopResult.Data!.Items.Should().NotBeEmpty();
        laptopResult.Data.Items.All(p => p.BasePrice >= 40000000m).Should().BeTrue();

        // 3. Query Keyboards with Tactile switch JSONB filter
        var keyboardResult = await service.GetProductsAsync(new ProductQueryParams
        {
            CategorySlug = "ban-phim-co",
            Specs = new() { { "switch", "Tactile" } }
        });
        keyboardResult.IsSuccess.Should().BeTrue();
        keyboardResult.Data!.Items.Should().NotBeEmpty();
        keyboardResult.Data.Items.Select(p => p.Name).Should().Contain("Bàn phím cơ Keychron Q1 Pro Wireless");

        // 4. Query by Brand Apple
        var appleResult = await service.GetProductsAsync(new ProductQueryParams
        {
            BrandSlug = "apple",
            PageSize = 50
        });
        appleResult.IsSuccess.Should().BeTrue();
        appleResult.Data!.Items.Count.Should().BeGreaterThanOrEqualTo(8);
        appleResult.Data.Items.All(p => p.BrandSlug == "apple").Should().BeTrue();

        // 5. Query 3D Model product details
        var q1Detail = await service.GetProductBySlugAsync("ban-phim-co-keychron-q1-pro-wireless");
        q1Detail.IsSuccess.Should().BeTrue();
        q1Detail.Data!.Model3DUrl.Should().Be("https://models.madkstore.vn/keychron-q1-pro.glb");
        q1Detail.Data.Variants.Should().HaveCount(2);

        var iphoneDetail = await service.GetProductBySlugAsync("dien-thoai-iphone-15-pro-max");
        iphoneDetail.IsSuccess.Should().BeTrue();
        iphoneDetail.Data!.Model3DUrl.Should().Be("https://models.madkstore.vn/iphone-15-pro-max.glb");
        iphoneDetail.Data.Variants.Should().HaveCount(3);
    }
}
