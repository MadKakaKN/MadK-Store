using System.Text.Json;
using FluentAssertions;
using MadK.Domain.Entities;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MadK.Infrastructure.Tests;

public class CatalogConstraintTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static AppDbContext CreateNpgsqlDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=madkstore_dev;Username=madkstore;Password=madkstore_dev_pwd")
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public void ModelConfiguration_IndexesAndConstraints_ShouldBeConfiguredProperly()
    {
        using var context = CreateNpgsqlDbContext();
        var model = context.Model;

        // 1. Category
        var categoryEntity = model.FindEntityType(typeof(Category))!;
        var categorySlugIndex = categoryEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Category.Slug)));
        categorySlugIndex.Should().NotBeNull();
        categorySlugIndex!.IsUnique.Should().BeTrue();
        categorySlugIndex.GetDatabaseName().Should().Be("idx_categories_slug");

        var categoryParentIndex = categoryEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Category.ParentId)));
        categoryParentIndex.Should().NotBeNull();
        categoryParentIndex!.GetDatabaseName().Should().Be("idx_categories_parent_id");

        // 2. Brand
        var brandEntity = model.FindEntityType(typeof(Brand))!;
        var brandSlugIndex = brandEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Brand.Slug)));
        brandSlugIndex.Should().NotBeNull();
        brandSlugIndex!.IsUnique.Should().BeTrue();
        brandSlugIndex.GetDatabaseName().Should().Be("idx_brands_slug");

        // 3. Product
        var productEntity = model.FindEntityType(typeof(Product))!;
        var productSlugIndex = productEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Product.Slug)));
        productSlugIndex.Should().NotBeNull();
        productSlugIndex!.IsUnique.Should().BeTrue();
        productSlugIndex.GetDatabaseName().Should().Be("idx_products_slug");

        var model3DProperty = productEntity.FindProperty(nameof(Product.Model3DUrl))!;
        model3DProperty.IsNullable.Should().BeTrue();

        var specsIndex = productEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Product.Specifications)));
        specsIndex.Should().NotBeNull();
        specsIndex!.GetDatabaseName().Should().Be("idx_products_specifications_gin");

        var searchVectorIndex = productEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Product.SearchVector)));
        searchVectorIndex.Should().NotBeNull();
        searchVectorIndex!.GetDatabaseName().Should().Be("idx_products_search_vector_gin");

        // 4. ProductVariant
        var variantEntity = model.FindEntityType(typeof(ProductVariant))!;
        var variantSkuIndex = variantEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(ProductVariant.Sku)));
        variantSkuIndex.Should().NotBeNull();
        variantSkuIndex!.IsUnique.Should().BeTrue();
        variantSkuIndex.GetDatabaseName().Should().Be("idx_product_variants_sku");

        var attributesIndex = variantEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(ProductVariant.Attributes)));
        attributesIndex.Should().NotBeNull();
        attributesIndex!.GetDatabaseName().Should().Be("idx_product_variants_attributes_gin");

        // 5. CategorySpecTemplate
        var templateEntity = model.FindEntityType(typeof(CategorySpecTemplate))!;
        var categoryIdIndex = templateEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(CategorySpecTemplate.CategoryId)));
        categoryIdIndex.Should().NotBeNull();
        categoryIdIndex!.IsUnique.Should().BeTrue();
        categoryIdIndex.GetDatabaseName().Should().Be("idx_category_spec_templates_category_id");

        var schemaIndex = templateEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(CategorySpecTemplate.SchemaDefinition)));
        schemaIndex.Should().NotBeNull();
        schemaIndex!.GetDatabaseName().Should().Be("idx_category_spec_templates_schema_gin");
    }

    [Fact]
    public async Task CategoryTree_Hierarchy_ShouldSupportParentChildNavigation()
    {
        using var context = CreateInMemoryDbContext();

        // Arrange
        var rootCategory = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Điện thoại & Máy tính bảng",
            Slug = "dien-thoai-tablet",
            DisplayOrder = 1,
            IsActive = true
        };

        var subCategory = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Điện thoại thông minh",
            Slug = "smartphone",
            ParentId = rootCategory.Id,
            DisplayOrder = 1,
            IsActive = true
        };

        var leafCategory = new Category
        {
            Id = Guid.NewGuid(),
            Name = "iPhone",
            Slug = "iphone",
            ParentId = subCategory.Id,
            DisplayOrder = 1,
            IsActive = true
        };

        context.Categories.AddRange(rootCategory, subCategory, leafCategory);
        await context.SaveChangesAsync();

        // Act
        var queriedRoot = await context.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Slug == "dien-thoai-tablet");

        var queriedLeaf = await context.Categories
            .Include(c => c.Parent)
            .FirstOrDefaultAsync(c => c.Slug == "iphone");

        // Assert
        queriedRoot.Should().NotBeNull();
        queriedRoot!.Children.Should().HaveCount(1);
        queriedRoot.Children.First().Slug.Should().Be("smartphone");

        queriedLeaf.Should().NotBeNull();
        queriedLeaf!.Parent.Should().NotBeNull();
        queriedLeaf.Parent!.Slug.Should().Be("smartphone");
    }

    [Fact]
    public async Task Jsonb_ReadAndWrite_ShouldPreserveDynamicSpecificationsAndAttributes()
    {
        using var context = CreateInMemoryDbContext();

        // Arrange
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "Apple",
            Slug = "apple"
        };

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Laptop",
            Slug = "laptop"
        };

        var specTemplate = new CategorySpecTemplate
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            SchemaDefinition = JsonSerializer.Serialize(new
            {
                type = "object",
                properties = new
                {
                    cpu = new { type = "string" },
                    ram = new { type = "string" }
                }
            })
        };

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id,
            Name = "MacBook Pro 14 M3 Pro",
            Slug = "macbook-pro-14-m3-pro",
            BasePrice = 49990000m,
            Specifications = JsonSerializer.Serialize(new
            {
                cpu = "Apple M3 Pro 11-core",
                ram = "18GB",
                storage = "512GB SSD",
                screen = "14.2 Liquid Retina XDR"
            })
        };

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "MBP14-M3PRO-18-512-BLK",
            Name = "Đen Không Gian (Space Black) - 18GB/512GB",
            OriginalPrice = 49990000m,
            SalePrice = 47990000m,
            CostPrice = 42000000m,
            Attributes = JsonSerializer.Serialize(new
            {
                color = "Space Black",
                color_hex = "#2E2C2F",
                ram = "18GB",
                storage = "512GB"
            })
        };

        context.Brands.Add(brand);
        context.Categories.Add(category);
        context.CategorySpecTemplates.Add(specTemplate);
        context.Products.Add(product);
        context.ProductVariants.Add(variant);
        await context.SaveChangesAsync();

        // Act
        var savedProduct = await context.Products.FirstOrDefaultAsync(p => p.Slug == "macbook-pro-14-m3-pro");
        var savedVariant = await context.ProductVariants.FirstOrDefaultAsync(v => v.Sku == "MBP14-M3PRO-18-512-BLK");
        var savedTemplate = await context.CategorySpecTemplates.FirstOrDefaultAsync(t => t.CategoryId == category.Id);

        // Assert
        savedProduct.Should().NotBeNull();
        using var specDoc = JsonDocument.Parse(savedProduct!.Specifications);
        specDoc.RootElement.GetProperty("cpu").GetString().Should().Be("Apple M3 Pro 11-core");
        specDoc.RootElement.GetProperty("ram").GetString().Should().Be("18GB");

        savedVariant.Should().NotBeNull();
        using var attrDoc = JsonDocument.Parse(savedVariant!.Attributes);
        attrDoc.RootElement.GetProperty("color").GetString().Should().Be("Space Black");
        attrDoc.RootElement.GetProperty("color_hex").GetString().Should().Be("#2E2C2F");

        savedTemplate.Should().NotBeNull();
        using var templateDoc = JsonDocument.Parse(savedTemplate!.SchemaDefinition);
        templateDoc.RootElement.GetProperty("type").GetString().Should().Be("object");
    }

    [Fact]
    public async Task Product_Model3DUrl_CanBeNullOrSet()
    {
        using var context = CreateInMemoryDbContext();

        var brand = new Brand { Id = Guid.NewGuid(), Name = "Sony", Slug = "sony" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Tai nghe", Slug = "tai-nghe" };
        context.Brands.Add(brand);
        context.Categories.Add(category);

        var productWithout3D = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id,
            Name = "Tai nghe Sony WH-CH520",
            Slug = "sony-wh-ch520",
            BasePrice = 1290000m,
            Model3DUrl = null
        };

        var productWith3D = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            BrandId = brand.Id,
            Name = "Tai nghe Sony WH-1000XM5",
            Slug = "sony-wh-1000xm5",
            BasePrice = 7990000m,
            Model3DUrl = "https://models.madk.store/sony-wh-1000xm5.glb"
        };

        context.Products.AddRange(productWithout3D, productWith3D);
        await context.SaveChangesAsync();

        // Act & Assert
        var q1 = await context.Products.FirstOrDefaultAsync(p => p.Slug == "sony-wh-ch520");
        q1.Should().NotBeNull();
        q1!.Model3DUrl.Should().BeNull();

        var q2 = await context.Products.FirstOrDefaultAsync(p => p.Slug == "sony-wh-1000xm5");
        q2.Should().NotBeNull();
        q2!.Model3DUrl.Should().Be("https://models.madk.store/sony-wh-1000xm5.glb");
    }
}
