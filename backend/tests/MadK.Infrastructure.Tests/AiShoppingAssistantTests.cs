using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using MadK.Application.DTOs.Ai;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class AiShoppingAssistantTests
{
    private static async Task<AppDbContext> CreateSeededInMemoryDbContextAsync(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new AppDbContext(options);
        await DatabaseSeeder.SeedAsync(context);
        return context;
    }

    private static AiShoppingAssistantService CreateAssistantService(AppDbContext context)
    {
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["Gemini:ApiKey"] = "", // Empty to test deterministic recommendation engine
            ["Gemini:ModelName"] = "gemini-1.5-flash"
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemoryConfig)
            .Build();

        var httpClientFactory = new MockHttpClientFactory();
        var logger = NullLogger<AiShoppingAssistantService>.Instance;

        return new AiShoppingAssistantService(context, configuration, logger, httpClientFactory);
    }

    private class MockHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new HttpClient();
    }

    [Fact]
    public void VietnameseTextNormalizer_NormalizeTelex_ShouldCorrectCommonTypos()
    {
        // 1. Lỗi gõ dính phím Telex điện thoại
        VietnameseTextNormalizer.NormalizeTelex("cho tôi xem tất cả mẫu ddieeneenj thoại")
            .Should().Contain("điện thoại");

        VietnameseTextNormalizer.NormalizeTelex("ddieenj thoaij")
            .Should().Contain("điện thoại");

        VietnameseTextNormalizer.NormalizeTelex("dienthoai")
            .Should().Contain("điện thoại");

        // 2. Viết tắt
        VietnameseTextNormalizer.NormalizeTelex("xem các mẫu đt")
            .Should().Contain("điện thoại");

        VietnameseTextNormalizer.NormalizeTelex("tìm dt giá rẻ")
            .Should().Contain("điện thoại");

        // 3. Phụ kiện
        VietnameseTextNormalizer.NormalizeTelex("banf phims cow")
            .Should().Contain("bàn phím cơ");

        VietnameseTextNormalizer.NormalizeTelex("chuoojt gaming")
            .Should().Contain("chuột");
    }

    [Fact]
    public void VietnameseTextNormalizer_RemoveDiacritics_ShouldReturnCleanAscii()
    {
        VietnameseTextNormalizer.RemoveDiacritics("điện thoại")
            .Should().Be("dien thoai");

        VietnameseTextNormalizer.RemoveDiacritics("bàn phím cơ")
            .Should().Be("ban phim co");
    }

    [Fact]
    public async Task ChatAsync_WithTelexTypo_ReturnsOnlyPhonesAndNeverKeyboardsOrLaptops()
    {
        // Arrange: Đúng với câu hỏi lỗi thực tế của user trong ảnh chụp đính kèm
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("cho tôi xem tất cả mẫu ddieeneenj thoại");

        // Act
        var result = await service.ChatAsync(request);

        // Assert:
        // 1. Phải trả về danh sách sản phẩm gợi ý
        result.RecommendedProducts.Should().NotBeNullOrEmpty();

        // 2. TẤT CẢ sản phẩm trả về BẮT BUỘC phải là Điện thoại (iPhone, Samsung Galaxy)
        result.RecommendedProducts.Should().OnlyContain(p =>
            p.CategoryName.Contains("Điện thoại") ||
            p.Name.Contains("iPhone") ||
            p.Name.Contains("Galaxy"));

        // 3. TUYỆT ĐỐI KHÔNG ĐƯỢC chứa bàn phím cơ hay laptop
        result.RecommendedProducts.Should().NotContain(p =>
            p.Name.Contains("Keychron") ||
            p.Name.Contains("BlackWidow") ||
            p.Name.Contains("SCAR") ||
            p.Name.Contains("Bàn phím"));

        // 4. Nội dung phản hồi phải nhắc đến Điện thoại và không được nhắc đến Bàn phím cơ
        result.Reply.Should().Contain("Điện thoại");
        result.Reply.Should().NotContain("Bàn phím cơ");
        result.Reply.Should().NotContain("Switch cơ học");
    }

    [Fact]
    public async Task ChatAsync_WithUnaccentedDienThoai_ReturnsOnlyPhones()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("cho xem dien thoai");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        result.RecommendedProducts.Should().OnlyContain(p =>
            p.CategoryName.Contains("Điện thoại") ||
            p.Name.Contains("iPhone") ||
            p.Name.Contains("Galaxy"));
        result.RecommendedProducts.Should().NotContain(p => p.Name.Contains("Keychron"));
    }

    [Fact]
    public async Task ChatAsync_WithDtAbbreviation_ReturnsOnlyPhones()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("tôi muốn xem mẫu đt");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        result.RecommendedProducts.Should().OnlyContain(p =>
            p.CategoryName.Contains("Điện thoại") ||
            p.Name.Contains("iPhone") ||
            p.Name.Contains("Galaxy"));
    }

    [Fact]
    public async Task ChatAsync_WithIPhoneSpecificQuery_ReturnsOnlyAppleIPhones()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("cho tôi xem tất cả mẫu iphone");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        result.RecommendedProducts.Should().OnlyContain(p => p.Name.Contains("iPhone"));
        result.RecommendedProducts.Should().NotContain(p => p.Name.Contains("Galaxy"));
    }

    [Fact]
    public async Task ChatAsync_WithSamsungGalaxyQuery_ReturnsOnlySamsungPhones()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("tôi cần mua điện thoại samsung galaxy");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        result.RecommendedProducts.Should().OnlyContain(p => p.Name.Contains("Galaxy") || p.BrandName == "Samsung");
        result.RecommendedProducts.Should().NotContain(p => p.Name.Contains("iPhone"));
    }

    [Fact]
    public async Task ChatAsync_WithKeyboardQuery_ReturnsOnlyKeyboardsAndNeverPhones()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("tư vấn bàn phím cơ gõ văn phòng");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        result.RecommendedProducts.Should().OnlyContain(p =>
            p.CategoryName.Contains("Bàn phím") ||
            p.Name.Contains("Keychron") ||
            p.Name.Contains("BlackWidow"));
        result.RecommendedProducts.Should().NotContain(p =>
            p.Name.Contains("iPhone") ||
            p.Name.Contains("Galaxy"));
    }

    [Fact]
    public async Task ChatAsync_WithLaptopQuery_ReturnsOnlyLaptopsAndNeverPhonesOrKeyboards()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("tư vấn laptop gaming");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        result.RecommendedProducts.Should().OnlyContain(p =>
            p.CategoryName.Contains("Laptop") ||
            p.Name.Contains("Laptop") ||
            p.Name.Contains("SCAR"));
        result.RecommendedProducts.Should().NotContain(p =>
            p.Name.Contains("iPhone") ||
            p.Name.Contains("Galaxy") ||
            p.Name.Contains("Keychron"));
    }

    [Fact]
    public async Task ChatAsync_WithPhoneBudget_FiltersByBudgetProperly()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("tư vấn điện thoại dưới 20 triệu");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        // Không vượt quá 20tr (+20% tolerance = 24tr)
        result.RecommendedProducts.Should().OnlyContain(p => p.BasePrice <= 24_000_000m);
        // Không chứa iPhone 15 Pro Max (34.99m) hay S24 Ultra (31.99m)
        result.RecommendedProducts.Should().NotContain(p => p.Name.Contains("Pro Max") || p.Name.Contains("S24 Ultra"));
    }

    [Fact]
    public async Task ChatAsync_WithChaoGreeting_ShouldGreetBackNaturallyWithoutProducts()
    {
        // Kiểm tra đúng trường hợp người dùng nhắn "chào"
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("chào");

        var result = await service.ChatAsync(request);

        // 1. Tuyệt đối KHÔNG ĐƯỢC tự ý ném sản phẩm ra khi khách chỉ chào hỏi
        result.RecommendedProducts.Should().BeEmpty();

        // 2. Phải chào lại tự nhiên, lịch sự
        result.Reply.Should().Contain("xin chào");
        result.Reply.Should().NotContain("ASUS ROG Strix SCAR");
        result.Reply.Should().NotContain("Bàn phím cơ Keychron");
    }

    [Fact]
    public async Task ChatAsync_WithXinChaoGreeting_ShouldGreetBackNaturallyWithoutProducts()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("xin chào shop");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().BeEmpty();
        result.Reply.Should().Contain("xin chào");
    }

    [Fact]
    public async Task ChatAsync_WithThanks_ShouldAcknowledgeWithoutProducts()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("cảm ơn shop nhé");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().BeEmpty();
        result.Reply.Should().Contain("không có gì");
    }

    [Fact]
    public async Task ChatAsync_WithStoreAddress_ShouldReturnAddressWithoutProducts()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("shop ở đâu vậy");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().BeEmpty();
        result.Reply.Should().Contain("123 Đường Công Nghệ");
    }

    [Fact]
    public async Task ChatAsync_WithWarrantyPolicy_ShouldReturnWarrantyWithoutProducts()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("chính sách bảo hành ra sao");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().BeEmpty();
        result.Reply.Should().Contain("bảo hành");
    }

    [Fact]
    public async Task ChatAsync_WithInstallment_ShouldReturnInstallmentWithoutProducts()
    {
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("shop có hỗ trợ trả góp không");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().BeEmpty();
        result.Reply.Should().Contain("Trả góp 0%");
    }

    [Fact]
    public async Task ChatAsync_WithCombinedGreetingAndCategory_ShouldGreetAndRecommendCategory()
    {
        // Khi người dùng vừa chào vừa hỏi sản phẩm: "chào shop, tư vấn cho tôi vài mẫu bàn phím"
        var dbName = "AiTestDb_" + Guid.NewGuid();
        using var context = await CreateSeededInMemoryDbContextAsync(dbName);
        var service = CreateAssistantService(context);

        var request = new AiChatRequestDto("chào shop, tư vấn cho tôi vài mẫu bàn phím");

        var result = await service.ChatAsync(request);

        result.RecommendedProducts.Should().NotBeNullOrEmpty();
        result.RecommendedProducts.Should().OnlyContain(p =>
            p.CategoryName.Contains("Bàn phím") ||
            p.Name.Contains("Keychron") ||
            p.Name.Contains("BlackWidow"));
        result.Reply.Should().Contain("xin chào");
        result.Reply.Should().Contain("Bàn phím");
    }
}
