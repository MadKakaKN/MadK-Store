using FluentAssertions;
using MadK.Application.DTOs.Notifications;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Services.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class TelegramNotificationTests
{
    [Fact]
    public async Task SendMessageAsync_WhenUnconfigured_ReturnsFalseWithoutThrowing()
    {
        // Arrange
        var settings = Options.Create(new TelegramSettings
        {
            Enabled = true,
            BotToken = null,
            ChatId = null
        });
        var config = new ConfigurationBuilder().Build();
        var service = new TelegramNotificationService(
            settings,
            config,
            NullLogger<TelegramNotificationService>.Instance);

        // Act
        var result = await service.SendMessageAsync("Test message");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task SendMessageAsync_WhenDisabled_ReturnsFalseWithoutCallingNetwork()
    {
        // Arrange
        var settings = Options.Create(new TelegramSettings
        {
            Enabled = false,
            BotToken = "fake-token",
            ChatId = "123456"
        });
        var config = new ConfigurationBuilder().Build();
        var service = new TelegramNotificationService(
            settings,
            config,
            NullLogger<TelegramNotificationService>.Instance);

        // Act
        var result = await service.SendMessageAsync("Test message");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task SendNewOrderAlertAsync_WhenOrderValid_ExecutesWithoutException()
    {
        // Arrange
        var settings = Options.Create(new TelegramSettings
        {
            Enabled = true,
            BotToken = null, // unconfigured mock
            ChatId = null
        });
        var config = new ConfigurationBuilder().Build();
        var service = new TelegramNotificationService(
            settings,
            config,
            NullLogger<TelegramNotificationService>.Instance);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "MK-20261105-TG01",
            TotalAmount = 550000m,
            SubtotalAmount = 500000m,
            ShippingFee = 50000m,
            PaymentMethod = PaymentMethod.BankTransfer,
            ShippingAddressSnapshot = "{\"recipientName\":\"Nguyen Van A\",\"phoneNumber\":\"0912345678\",\"fullAddress\":\"123 Le Loi, Q1, TP.HCM\"}",
            CustomerNote = "Giao giờ hành chính",
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductNameSnapshot = "Áo Thun MadK Oversize",
                    VariantNameSnapshot = "Size L / Đen",
                    SkuSnapshot = "MK-TSHIRT-BLK-L",
                    Quantity = 2,
                    UnitPriceSnapshot = 250000m,
                    TotalPrice = 500000m
                }
            }
        };

        // Act & Assert
        var act = async () => await service.SendNewOrderAlertAsync(order);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SendPaymentReceivedAlertAsync_ExecutesWithoutException()
    {
        // Arrange
        var settings = Options.Create(new TelegramSettings());
        var config = new ConfigurationBuilder().Build();
        var service = new TelegramNotificationService(
            settings,
            config,
            NullLogger<TelegramNotificationService>.Instance);

        // Act & Assert
        var act = async () => await service.SendPaymentReceivedAlertAsync(
            "MK-20261105-TG02",
            850000m,
            "Techcombank",
            "REF123456");

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SendLowStockAlertAsync_ExecutesWithoutException()
    {
        // Arrange
        var settings = Options.Create(new TelegramSettings());
        var config = new ConfigurationBuilder().Build();
        var service = new TelegramNotificationService(
            settings,
            config,
            NullLogger<TelegramNotificationService>.Instance);

        // Act & Assert
        var act = async () => await service.SendLowStockAlertAsync(
            "Quần Jean MadK Slim Fit",
            "MK-JEAN-01-32",
            2);

        await act.Should().NotThrowAsync();
    }
}
