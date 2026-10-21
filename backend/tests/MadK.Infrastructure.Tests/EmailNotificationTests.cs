using System.Text.Json;
using FluentAssertions;
using MadK.Application.DTOs.Auth;
using MadK.Application.DTOs.Notifications;
using MadK.Application.DTOs.Order;
using MadK.Application.Interfaces;
using MadK.Application.Services;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using MadK.Infrastructure.Services.Notifications;
using MadK.Infrastructure.Workers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class EmailNotificationTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    #region 1. Template Rendering Tests

    [Fact]
    public void EmailTemplateService_RenderOrderConfirmation_ShouldContainDetailsAndFormatting()
    {
        var renderer = new EmailTemplateService();
        var dto = new OrderConfirmationEmailDto(
            OrderNumber: "ORD-20261021-0001",
            RecipientEmail: "customer@example.com",
            RecipientName: "Nguyễn Văn A",
            RecipientPhone: "0987654321",
            ShippingAddress: "123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
            PaymentMethod: "Thanh toán khi nhận hàng (COD)",
            SubtotalAmount: 1_200_000m,
            ShippingFee: 30_000m,
            DiscountAmount: 100_000m,
            TotalAmount: 1_130_000m,
            CouponCode: "MADKDISCOUNT",
            CustomerNote: "Giao vào giờ hành chính",
            CreatedAt: DateTime.UtcNow,
            Items: new List<OrderItemEmailDto>
            {
                new("Bàn phím MadK Pro", "Switch Red - Black", "MK-PRO-RED", 1, 1_200_000m, 1_200_000m, "https://example.com/thumb.jpg")
            }
        );

        var html = renderer.RenderOrderConfirmation(dto);

        html.Should().NotBeNullOrWhiteSpace();
        html.Should().Contain("ORD-20261021-0001");
        html.Should().Contain("Nguyễn Văn A");
        html.Should().Contain("MadK Pro");
        html.Should().Contain("MADKDISCOUNT");
        html.Should().Contain("1,130,000");
        System.Net.WebUtility.HtmlDecode(html).Should().Contain("hành chính");
    }

    [Fact]
    public void EmailTemplateService_RenderPasswordReset_ShouldContainTokenAndWarning()
    {
        var renderer = new EmailTemplateService();
        var html = renderer.RenderPasswordReset("Trần Văn B", "RESET-TOKEN-XYZ-789", 30);

        html.Should().NotBeNullOrWhiteSpace();
        html.Should().Contain("RESET-TOKEN-XYZ-789");
        html.Should().Contain("30 phút");
        html.Should().Contain("Trần Văn B");
    }

    [Fact]
    public void EmailTemplateService_RenderOrderStatusChanged_ShouldContainStatusTransition()
    {
        var renderer = new EmailTemplateService();
        var dto = new OrderStatusChangedEmailDto(
            OrderNumber: "ORD-9999",
            RecipientEmail: "user@example.com",
            RecipientName: "Lê Thị C",
            OldStatus: "Processing",
            NewStatus: "Shipping",
            Reason: "Đã bàn giao cho đơn vị vận chuyển Viettel Post",
            Note: "Mã vận đơn: VTP123456",
            ChangedAt: DateTime.UtcNow,
            TotalAmount: 850_000m
        );

        var html = renderer.RenderOrderStatusChanged(dto);

        html.Should().NotBeNullOrWhiteSpace();
        html.Should().Contain("ORD-9999");
        html.Should().Contain("Đang giao");
        html.Should().Contain("Viettel Post");
        html.Should().Contain("850,000");
    }

    #endregion

    #region 2. Worker Retry Logic Tests

    private class MockFailingTransport : ISmtpTransport
    {
        private readonly int _failCountBeforeSuccess;
        public int AttemptCount { get; private set; } = 0;

        public MockFailingTransport(int failCountBeforeSuccess)
        {
            _failCountBeforeSuccess = failCountBeforeSuccess;
        }

        public Task SendAsync(QueuedEmailMessage message, CancellationToken cancellationToken = default)
        {
            AttemptCount++;
            if (AttemptCount <= _failCountBeforeSuccess)
            {
                throw new System.Net.Sockets.SocketException(10061); // Connection refused
            }

            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task EmailNotificationWorker_WhenTransientFailure_ShouldRetryAndSucceed()
    {
        // Arrange: fails 2 times, succeeds on 3rd attempt
        var mockTransport = new MockFailingTransport(failCountBeforeSuccess: 2);
        var queue = new ChannelEmailQueue(NullLogger<ChannelEmailQueue>.Instance);
        var settings = Options.Create(new EmailSettings
        {
            MaxRetries = 3,
            RetryBaseDelayMs = 10 // Fast retry for tests
        });

        var worker = new EmailNotificationWorker(queue, mockTransport, settings, NullLogger<EmailNotificationWorker>.Instance);

        var msg = new QueuedEmailMessage
        {
            ToEmail = "test@example.com",
            Subject = "Test Transient",
            HtmlBody = "<p>Test</p>"
        };

        // Act
        var result = await worker.ProcessEmailWithRetryAsync(msg, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        mockTransport.AttemptCount.Should().Be(3);
    }

    [Fact]
    public async Task EmailNotificationWorker_WhenPersistentFailure_ShouldStopAtMaxRetries_AndNotThrow()
    {
        // Arrange: fails all attempts
        var mockTransport = new MockFailingTransport(failCountBeforeSuccess: 100);
        var queue = new ChannelEmailQueue(NullLogger<ChannelEmailQueue>.Instance);
        var settings = Options.Create(new EmailSettings
        {
            MaxRetries = 3,
            RetryBaseDelayMs = 10
        });

        var worker = new EmailNotificationWorker(queue, mockTransport, settings, NullLogger<EmailNotificationWorker>.Instance);

        var msg = new QueuedEmailMessage
        {
            ToEmail = "fail@example.com",
            Subject = "Test Persistent",
            HtmlBody = "<p>Test</p>"
        };

        // Act
        var result = await worker.ProcessEmailWithRetryAsync(msg, CancellationToken.None);

        // Assert: limited retries respected, no unhandled exception
        result.Should().BeFalse();
        mockTransport.AttemptCount.Should().Be(3);
    }

    #endregion

    #region 3. Order Checkout & Non-blocking Guarantee Tests

    private class ThrowingEmailSender : IEmailSender
    {
        public Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("SMTP / Queue network down");

        public Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("SMTP / Queue network down");

        public Task SendOrderConfirmationAsync(OrderConfirmationEmailDto dto, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("SMTP / Queue network down");

        public Task SendOrderStatusChangedAsync(OrderStatusChangedEmailDto dto, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("SMTP / Queue network down");

        public Task SendRawEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("SMTP / Queue network down");
    }

    private class RecordingEmailSender : IEmailSender
    {
        public List<OrderConfirmationEmailDto> SentConfirmations { get; } = new();
        public List<OrderStatusChangedEmailDto> SentStatusChanges { get; } = new();
        public List<(string To, string Token)> SentPasswordResets { get; } = new();

        public Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken cancellationToken = default)
        {
            SentPasswordResets.Add((toEmail, token));
            return Task.CompletedTask;
        }

        public Task SendOrderConfirmationAsync(OrderConfirmationEmailDto dto, CancellationToken cancellationToken = default)
        {
            SentConfirmations.Add(dto);
            return Task.CompletedTask;
        }

        public Task SendOrderStatusChangedAsync(OrderStatusChangedEmailDto dto, CancellationToken cancellationToken = default)
        {
            SentStatusChanges.Add(dto);
            return Task.CompletedTask;
        }

        public Task SendRawEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    [Fact]
    public async Task CheckoutCod_WhenEmailSenderThrows_ShouldNotBreakOrderCheckoutFlow()
    {
        // CRITICAL REQUIREMENT TEST: "lỗi gửi email không làm hỏng luồng đặt hàng"
        var dbName = "EmailFaultTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        // Seed product & variant
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím cơ MadK Test",
            Slug = "madk-test-" + Guid.NewGuid(),
            BasePrice = 500_000m,
            IsActive = true
        };
        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "MK-TEST-01",
            Name = "Variant Test 1",
            SalePrice = 500_000m,
            OriginalPrice = 500_000m,
            IsActive = true
        };
        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = 50,
            ReservedQuantity = 0
        };

        db.Products.Add(product);
        db.ProductVariants.Add(variant);
        db.Inventories.Add(inventory);
        await db.SaveChangesAsync();

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var throwingEmailSender = new ThrowingEmailSender();

        var orderService = new OrderService(
            db,
            inventoryService,
            pricingService: null,
            couponService: null,
            shippingFeeService: null,
            emailSender: throwingEmailSender,
            logger: NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: "Khách Hàng Lỗi Email",
                PhoneNumber: "0901234567",
                ProvinceCode: "01",
                ProvinceName: "Hà Nội",
                DistrictCode: "001",
                DistrictName: "Ba Đình",
                WardCode: "00001",
                WardName: "Phúc Xá",
                DetailedAddress: "Số 1 Phố Hàng Cỏ",
                Email: "fail-email@madkstore.local"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                new(variant.Id, 2)
            },
            CustomerNote: "Kiểm tra lỗi email không làm sập checkout",
            CustomerEmail: "fail-email@madkstore.local"
        );

        // Act
        var result = await orderService.CheckoutCodAsync(null, null, request);

        // Assert: Đơn hàng PHẢI thành công và được lưu vào CSDL, không bị văng Exception
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.CustomerEmail.Should().Be("fail-email@madkstore.local");
        result.Data!.TotalAmount.Should().Be(1_000_000m);

        var savedOrder = await db.Orders.FirstOrDefaultAsync(o => o.OrderNumber == result.Data.OrderNumber);
        savedOrder.Should().NotBeNull();
        savedOrder!.Status.Should().Be(OrderStatus.Pending);
    }

    [Fact]
    public async Task CheckoutCod_WhenEmailSenderConfigured_ShouldEnqueueOrderConfirmation()
    {
        var dbName = "EmailSuccessTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Bàn phím cơ MadK Success",
            Slug = "madk-success-" + Guid.NewGuid(),
            BasePrice = 750_000m,
            IsActive = true
        };
        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            Sku = "MK-SUCCESS-01",
            Name = "Variant Success 1",
            SalePrice = 750_000m,
            OriginalPrice = 750_000m,
            IsActive = true
        };
        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = 10,
            ReservedQuantity = 0
        };

        db.Products.Add(product);
        db.ProductVariants.Add(variant);
        db.Inventories.Add(inventory);
        await db.SaveChangesAsync();

        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);
        var recordingSender = new RecordingEmailSender();

        var orderService = new OrderService(
            db,
            inventoryService,
            pricingService: null,
            couponService: null,
            shippingFeeService: null,
            emailSender: recordingSender,
            logger: NullLogger<OrderService>.Instance);

        var request = new CheckoutCodRequestDto(
            ShippingAddress: new ShippingAddressInputDto(
                RecipientName: "Phạm Minh D",
                PhoneNumber: "0912345678",
                ProvinceCode: "79",
                ProvinceName: "TP. Hồ Chí Minh",
                DistrictCode: "760",
                DistrictName: "Quận 1",
                WardCode: "26734",
                WardName: "Phường Bến Nghé",
                DetailedAddress: "123 Lê Lợi",
                Email: "minhd@example.com"
            ),
            Items: new List<CheckoutItemInputDto>
            {
                new(variant.Id, 1)
            },
            CustomerNote: "Vui lòng gọi trước khi giao",
            CustomerEmail: "minhd@example.com"
        );

        // Act
        var result = await orderService.CheckoutCodAsync(null, null, request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        recordingSender.SentConfirmations.Should().HaveCount(1);

        var sentEmail = recordingSender.SentConfirmations[0];
        sentEmail.OrderNumber.Should().Be(result.Data!.OrderNumber);
        sentEmail.RecipientEmail.Should().Be("minhd@example.com");
        sentEmail.RecipientName.Should().Be("Phạm Minh D");
        sentEmail.TotalAmount.Should().Be(750_000m);
        sentEmail.Items.Should().HaveCount(1);
        sentEmail.Items[0].ProductName.Should().Be("Bàn phím cơ MadK Success");
    }

    [Fact]
    public async Task UpdateOrderStatus_ShouldEnqueueOrderStatusChangedEmail()
    {
        var dbName = "StatusEmailTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-STATUS-TEST-01",
            CustomerEmail = "orderuser@example.com",
            CustomerPhone = "0988776655",
            Status = OrderStatus.Processing,
            PaymentStatus = PaymentStatus.Pending,
            PaymentMethod = PaymentMethod.COD,
            SubtotalAmount = 600_000m,
            TotalAmount = 600_000m,
            ShippingAddressSnapshot = JsonSerializer.Serialize(new { recipientName = "Khách Đang Chờ", fullAddress = "123 Phố Huế" }),
            CreatedAt = DateTime.UtcNow,
            Items = new List<OrderItem>()
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var recordingSender = new RecordingEmailSender();
        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);

        var orderService = new OrderService(
            db,
            inventoryService,
            pricingService: null,
            couponService: null,
            shippingFeeService: null,
            emailSender: recordingSender,
            logger: NullLogger<OrderService>.Instance);

        // Act: chuyển sang Shipping
        var result = await orderService.UpdateOrderStatusAsync(
            order.OrderNumber,
            staffUserId: Guid.NewGuid(),
            staffName: "Nhân viên Kho",
            request: new UpdateOrderStatusRequestDto(OrderStatus.Shipping, Reason: "Đã đóng gói và giao shipper"));

        // Assert
        result.IsSuccess.Should().BeTrue();
        recordingSender.SentStatusChanges.Should().HaveCount(1);

        var email = recordingSender.SentStatusChanges[0];
        email.OrderNumber.Should().Be("ORD-STATUS-TEST-01");
        email.RecipientEmail.Should().Be("orderuser@example.com");
        email.OldStatus.Should().Be("Processing");
        email.NewStatus.Should().Be("Shipping");
        email.Reason.Should().Be("Đã đóng gói và giao shipper");
    }

    [Fact]
    public async Task CancelOrder_ShouldEnqueueCancellationEmail()
    {
        var dbName = "CancelEmailTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var customerId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = customerId,
            OrderNumber = "ORD-CANCEL-TEST-01",
            CustomerEmail = "cancelleduser@example.com",
            CustomerPhone = "0988112233",
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            PaymentMethod = PaymentMethod.COD,
            SubtotalAmount = 500_000m,
            TotalAmount = 500_000m,
            ShippingAddressSnapshot = JsonSerializer.Serialize(new { recipientName = "Khách Hủy Đơn", fullAddress = "456 Giải Phóng" }),
            CreatedAt = DateTime.UtcNow,
            Items = new List<OrderItem>()
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var recordingSender = new RecordingEmailSender();
        var inventoryService = new InventoryService(db, NullLogger<InventoryService>.Instance);

        var orderService = new OrderService(
            db,
            inventoryService,
            pricingService: null,
            couponService: null,
            shippingFeeService: null,
            emailSender: recordingSender,
            logger: NullLogger<OrderService>.Instance);

        // Act: hủy đơn
        var result = await orderService.CancelOrderAsync(
            order.OrderNumber,
            userId: customerId,
            request: new CancelOrderRequestDto("Khách đổi ý muốn mua màu khác"));

        // Assert
        result.IsSuccess.Should().BeTrue();
        recordingSender.SentStatusChanges.Should().HaveCount(1);

        var email = recordingSender.SentStatusChanges[0];
        email.OrderNumber.Should().Be("ORD-CANCEL-TEST-01");
        email.RecipientEmail.Should().Be("cancelleduser@example.com");
        email.NewStatus.Should().Be("Cancelled");
        email.Reason.Should().Be("Khách đổi ý muốn mua màu khác");
    }

    #endregion

    #region 4. Identity Service Real Email Integration Tests

    [Fact]
    public async Task IdentityService_ForgotPassword_WithQueuedEmailSender_ShouldEnqueueEmail()
    {
        var dbName = "IdentityEmailTest_" + Guid.NewGuid();
        await using var db = CreateInMemoryDbContext(dbName);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "forgotuser@example.com",
            FullName = "Người Dùng Quên Mật Khẩu",
            PasswordHash = "hashed_pw",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var queue = new ChannelEmailQueue(NullLogger<ChannelEmailQueue>.Instance);
        var templateService = new EmailTemplateService();
        var emailSender = new QueuedEmailSender(queue, templateService, NullLogger<QueuedEmailSender>.Instance);

        var passwordHasher = new PasswordHasher();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "Jwt:Key", "SuperSecretKeyForTestingPurposesOnly1234567890!@#$" },
            { "Jwt:Issuer", "MadKTest" },
            { "Jwt:Audience", "MadKTestClient" },
            { "Jwt:ExpiryMinutes", "15" },
            { "Jwt:RefreshTokenExpiryDays", "7" }
        }).Build();
        var jwtGenerator = new JwtTokenGenerator(config);

        var identityService = new IdentityService(
            db,
            passwordHasher,
            jwtGenerator,
            emailSender,
            NullLogger<IdentityService>.Instance);

        // Act
        var result = await identityService.ForgotPasswordAsync(new ForgotPasswordRequestDto("forgotuser@example.com"));

        // Assert
        result.IsSuccess.Should().BeTrue();

        // Kiểm tra trong hàng đợi có message đặt lại mật khẩu
        var queuedMessages = new List<QueuedEmailMessage>();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
        await foreach (var msg in queue.DequeueAllAsync(cts.Token))
        {
            queuedMessages.Add(msg);
            break; // Read one
        }

        queuedMessages.Should().HaveCount(1);
        var queued = queuedMessages[0];
        queued.ToEmail.Should().Be("forgotuser@example.com");
        queued.Subject.Should().Contain("Yêu cầu đặt lại mật khẩu");
        queued.MessageType.Should().Be("PasswordReset");
        queued.HtmlBody.Should().Contain("Mã khôi phục mật khẩu");
    }

    #endregion

    #region 5. Dependency Injection Registration Tests

    [Fact]
    public void AddInfrastructure_ShouldRegisterEmailNotificationServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        var inMemorySettings = new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", "Host=localhost;Database=test;Username=test;Password=test" },
            { "EmailSettings:Host", "mailpit" },
            { "EmailSettings:Port", "1025" },
            { "RabbitMq:Enabled", "false" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddInfrastructure(configuration);
        var provider = services.BuildServiceProvider();

        // Assert
        provider.GetService<IEmailQueue>().Should().NotBeNull();
        provider.GetService<IEmailTemplateService>().Should().NotBeNull();
        provider.GetService<ISmtpTransport>().Should().NotBeNull();
        provider.GetService<IEmailSender>().Should().NotBeNull();
        provider.GetService<IEmailSender>().Should().BeOfType<QueuedEmailSender>();
    }

    #endregion
}
