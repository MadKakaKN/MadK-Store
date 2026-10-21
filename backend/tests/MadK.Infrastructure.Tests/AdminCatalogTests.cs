using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Admin;
using MadK.Application.DTOs.Audit;
using MadK.Application.DTOs.Catalog;
using MadK.Domain.Constants;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class AdminCatalogTests : IClassFixture<AuthMatrixTestFixture>, IAsyncLifetime
{
    private readonly AuthMatrixTestFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AdminCatalogTests(AuthMatrixTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        await _fixture.EnsureInitializedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private HttpClient CreateRoleClient(string role)
    {
        var client = _fixture.CreateClient();
        var token = role switch
        {
            "Admin" => _fixture.AdminToken,
            "Sales" => _fixture.SalesToken,
            "Warehouse" => _fixture.WarehouseToken,
            "Customer" => _fixture.CustomerToken,
            _ => null
        };

        if (!string.IsNullOrEmpty(token))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return client;
    }

    private static byte[] GenerateSamplePngBytes(int width = 100, int height = 100)
    {
        using var image = new Image<Rgba32>(width, height);
        using var ms = new MemoryStream();
        image.SaveAsPng(ms);
        return ms.ToArray();
    }

    #region Role Authorization Matrix for Catalog Admin
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Catalog_GetProducts_Requires_CatalogManage_Policy(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/catalog/products");
        response.StatusCode.Should().Be(expectedStatus);
    }

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Catalog_GetCategories_Requires_CatalogManage_Policy(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/catalog/categories");
        response.StatusCode.Should().Be(expectedStatus);
    }

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Catalog_GetBrands_Requires_CatalogManage_Policy(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/catalog/brands");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Image & 3D Model Upload Validation
    [Fact]
    public async Task UploadImage_WithValidPng_ShouldCompressToWebP_AndReturnThumbnail()
    {
        using var client = CreateRoleClient("Admin");

        var pngBytes = GenerateSamplePngBytes(300, 200);
        using var form = new MultipartFormDataContent();
        using var byteContent = new ByteArrayContent(pngBytes);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(byteContent, "file", "sample-device.png");

        var response = await client.PostAsync("/api/v1/admin/catalog/upload-image", form);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<Result<FileUploadResultDto>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data!.Url.Should().EndWith(".webp");
        content.Data.ThumbnailUrl.Should().Contain("_thumb.webp");
        content.Data.ContentType.Should().Be("image/webp");
        content.Data.Width.Should().Be(300);
        content.Data.Height.Should().Be(200);
    }

    [Fact]
    public async Task UploadImage_WithForbiddenExtension_ShouldBeRejected()
    {
        using var client = CreateRoleClient("Admin");

        var fakeExeBytes = Encoding.UTF8.GetBytes("MZ fake executable content");
        using var form = new MultipartFormDataContent();
        using var byteContent = new ByteArrayContent(fakeExeBytes);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        form.Add(byteContent, "file", "malicious_payload.exe");

        var response = await client.PostAsync("/api/v1/admin/catalog/upload-image", form);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadFromJsonAsync<Result<FileUploadResultDto>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeFalse();
        content.Error.Should().Contain("Loại tệp không được hỗ trợ");
    }

    [Fact]
    public async Task UploadImage_WithOversizedFile_ShouldBeRejected()
    {
        using var client = CreateRoleClient("Admin");

        // 6MB dummy bytes (Limit is 5MB)
        var oversizedBytes = new byte[6 * 1024 * 1024];
        using var form = new MultipartFormDataContent();
        using var byteContent = new ByteArrayContent(oversizedBytes);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(byteContent, "file", "huge_wallpaper.jpg");

        var response = await client.PostAsync("/api/v1/admin/catalog/upload-image", form);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadFromJsonAsync<Result<FileUploadResultDto>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeFalse();
        content.Error.Should().Contain("vượt quá giới hạn cho phép");
    }

    [Fact]
    public async Task UploadModel3D_WithGlbFile_ShouldSucceed()
    {
        using var client = CreateRoleClient("Admin");

        var dummyGlbBytes = Encoding.UTF8.GetBytes("glTF dummy binary header");
        using var form = new MultipartFormDataContent();
        using var byteContent = new ByteArrayContent(dummyGlbBytes);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("model/gltf-binary");
        form.Add(byteContent, "file", "keyboard_3d_model.glb");

        var response = await client.PostAsync("/api/v1/admin/catalog/upload-model3d", form);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<Result<FileUploadResultDto>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data!.Url.Should().EndWith(".glb");
    }
    #endregion

    #region Full Lifecycle: Category, Brand, Product, Variants, Soft Delete, Visibility & AuditLog
    [Fact]
    public async Task FullCatalogLifecycle_CreateEditProduct_SoftDelete_ToggleVisibility_AuditLogRecorded()
    {
        using var adminClient = CreateRoleClient("Admin");

        // 1. Create Category with Specification Schema
        var schemaJson = "{\"type\":\"object\",\"properties\":{\"switch_type\":{\"type\":\"string\",\"title\":\"Loại Switch\",\"enum\":[\"Linear\",\"Tactile\",\"Clicky\"]}}}";
        var catRequest = new CreateCategoryRequestDto(
            Name: "Bàn phím cơ Custom",
            Slug: "ban-phim-co-custom",
            ParentId: null,
            Description: "Bàn phím cơ cao cấp cho lập trình viên và game thủ",
            IconUrl: "/icons/keyboard.svg",
            DisplayOrder: 1,
            IsActive: true,
            SchemaDefinition: schemaJson
        );

        var catRes = await adminClient.PostAsJsonAsync("/api/v1/admin/catalog/categories", catRequest);
        catRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var catCreated = await catRes.Content.ReadFromJsonAsync<Result<AdminCategoryDetailDto>>(_jsonOptions);
        catCreated.Should().NotBeNull();
        catCreated!.IsSuccess.Should().BeTrue();
        var categoryId = catCreated.Data!.Id;

        // 2. Create Brand
        var brandRequest = new CreateBrandRequestDto(
            Name: "Keychron Tech",
            Slug: "keychron-tech",
            LogoUrl: "/logos/keychron.png",
            Description: "Thương hiệu bàn phím cơ nổi tiếng",
            IsActive: true
        );
        var brandRes = await adminClient.PostAsJsonAsync("/api/v1/admin/catalog/brands", brandRequest);
        brandRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var brandCreated = await brandRes.Content.ReadFromJsonAsync<Result<AdminBrandDetailDto>>(_jsonOptions);
        brandCreated.Should().NotBeNull();
        brandCreated!.IsSuccess.Should().BeTrue();
        var brandId = brandCreated.Data!.Id;

        // 3. Create Product with 3D model, custom specs, variant and images
        var prodRequest = new CreateProductRequestDto(
            Name: "Keychron Q1 Pro Wireless",
            Slug: "keychron-q1-pro-wireless",
            CategoryId: categoryId,
            BrandId: brandId,
            ShortDescription: "Bàn phím cơ nhôm CNC 75% không dây",
            Description: "Hỗ trợ QMK/VIA, Bluetooth 5.1 và đệm tiêu âm cao cấp",
            BasePrice: 4500000m,
            Specifications: "{\"switch_type\":\"Tactile\",\"connection\":\"Bluetooth 5.1, Type-C\",\"weight\":\"1.8kg\"}",
            Model3DUrl: "/uploads/models3d/keychron-q1.glb",
            ThumbnailUrl: "/uploads/products/keychron-thumb.webp",
            IsFeatured: true,
            IsActive: true,
            Variants: new List<CreateProductVariantRequestDto>
            {
                new(
                    Sku: "KC-Q1P-BANANA",
                    Name: "Keychron Q1 Pro - Banana Switch (Carbon Black)",
                    Attributes: "{\"color\":\"Carbon Black\",\"switch\":\"Banana Tactile\"}",
                    OriginalPrice: 4700000m,
                    SalePrice: 4500000m,
                    CostPrice: 3500000m,
                    StockQuantity: 25,
                    IsActive: true
                ),
                new(
                    Sku: "KC-Q1P-RED",
                    Name: "Keychron Q1 Pro - Red Switch (Silver White)",
                    Attributes: "{\"color\":\"Silver White\",\"switch\":\"Red Linear\"}",
                    OriginalPrice: 4700000m,
                    SalePrice: 4500000m,
                    CostPrice: 3500000m,
                    StockQuantity: 15,
                    IsActive: true
                )
            },
            Images: new List<CreateProductImageRequestDto>
            {
                new(null, "/uploads/products/q1_front.webp", "Mặt trước bàn phím", 0, true),
                new(null, "/uploads/products/q1_side.webp", "Góc nghiêng bàn phím", 1, false)
            }
        );

        var prodRes = await adminClient.PostAsJsonAsync("/api/v1/admin/catalog/products", prodRequest);
        prodRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var prodCreated = await prodRes.Content.ReadFromJsonAsync<Result<AdminProductDetailDto>>(_jsonOptions);
        prodCreated.Should().NotBeNull();
        prodCreated!.IsSuccess.Should().BeTrue();
        var productId = prodCreated.Data!.Id;
        prodCreated.Data.Variants.Should().HaveCount(2);
        prodCreated.Data.Model3DUrl.Should().Be("/uploads/models3d/keychron-q1.glb");
        prodCreated.Data.IsActive.Should().BeTrue();
        prodCreated.Data.IsDeleted.Should().BeFalse();

        // 4. Update Product
        var updateProdReq = new UpdateProductRequestDto(
            Name: "Keychron Q1 Pro Wireless (V2 2026)",
            Slug: "keychron-q1-pro-wireless-v2",
            CategoryId: categoryId,
            BrandId: brandId,
            ShortDescription: "Bản nâng cấp 2026",
            Description: "Mô tả cập nhật mới",
            BasePrice: 4600000m,
            Specifications: "{\"switch_type\":\"Tactile\",\"connection\":\"Tri-mode\"}",
            Model3DUrl: "/uploads/models3d/keychron-q1.glb",
            ThumbnailUrl: "/uploads/products/keychron-thumb.webp",
            IsFeatured: true,
            IsActive: true
        );
        var updateRes = await adminClient.PutAsJsonAsync($"/api/v1/admin/catalog/products/{productId}", updateProdReq);
        updateRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedProduct = await updateRes.Content.ReadFromJsonAsync<Result<AdminProductDetailDto>>(_jsonOptions);
        updatedProduct!.Data!.Name.Should().Be("Keychron Q1 Pro Wireless (V2 2026)");
        updatedProduct.Data.BasePrice.Should().Be(4600000m);

        // 5. Toggle Visibility (Ẩn / Hiện)
        var toggleRes = await adminClient.PutAsync($"/api/v1/admin/catalog/products/{productId}/visibility", null);
        toggleRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var toggleResult = await toggleRes.Content.ReadFromJsonAsync<Result<bool>>(_jsonOptions);
        toggleResult!.Data.Should().BeFalse(); // Now hidden

        // 6. Soft Delete Product (Xóa mềm)
        var deleteRes = await adminClient.DeleteAsync($"/api/v1/admin/catalog/products/{productId}");
        deleteRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify product is not returned in regular active admin query
        var listRes = await adminClient.GetAsync("/api/v1/admin/catalog/products?isDeleted=false");
        var listData = await listRes.Content.ReadFromJsonAsync<Result<PagedResult<AdminProductListDto>>>(_jsonOptions);
        listData!.Data!.Items.Should().NotContain(p => p.Id == productId);

        // Verify product IS returned in trash/deleted query
        var deletedListRes = await adminClient.GetAsync("/api/v1/admin/catalog/products?isDeleted=true");
        var deletedListData = await deletedListRes.Content.ReadFromJsonAsync<Result<PagedResult<AdminProductListDto>>>(_jsonOptions);
        deletedListData!.Data!.Items.Should().Contain(p => p.Id == productId);

        // 7. Restore product from trash
        var restoreRes = await adminClient.PostAsync($"/api/v1/admin/catalog/products/{productId}/restore", null);
        restoreRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify it's back in normal list
        var restoredListRes = await adminClient.GetAsync("/api/v1/admin/catalog/products?isDeleted=false");
        var restoredListData = await restoredListRes.Content.ReadFromJsonAsync<Result<PagedResult<AdminProductListDto>>>(_jsonOptions);
        restoredListData!.Data!.Items.Should().Contain(p => p.Id == productId);

        // 8. Verify AuditLogs recorded for these operations
        var auditRes = await adminClient.GetAsync($"/api/v1/admin/audit-logs?entityName=Product&entityId={productId}");
        auditRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var auditData = await auditRes.Content.ReadFromJsonAsync<Result<PagedResult<AuditLogDto>>>(_jsonOptions);
        auditData.Should().NotBeNull();
        auditData!.Data!.Items.Should().NotBeEmpty();

        var actions = auditData.Data.Items.Select(x => x.Action).ToList();
        actions.Should().Contain("PRODUCT_CREATED");
        actions.Should().Contain("PRODUCT_UPDATED");
        actions.Should().Contain("PRODUCT_VISIBILITY_TOGGLED");
        actions.Should().Contain("PRODUCT_DELETED");
        actions.Should().Contain("PRODUCT_RESTORED");
    }
    #endregion
}
