using FluentAssertions;
using MadK.Application.DTOs.Payment;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using MadK.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class BankTransferWebhookTests
{
    private static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task ProcessSepayWebhook_WhenValidTransfer_AutoConfirmsOrder()
    {
        // Arrange
        var db = CreateInMemoryDbContext("BankTransferTest_Valid");
        var orderId = Guid.NewGuid();
        var orderNumber = "MK-20261105-TEST01";

        var order = new Order
        {
            Id = orderId,
            OrderNumber = orderNumber,
            Status = OrderStatus.PendingPayment,
            PaymentStatus = PaymentStatus.Pending,
            PaymentMethod = PaymentMethod.BankTransfer,
            TotalAmount = 1500000m,
            SubtotalAmount = 1500000m,
            ShippingAddressSnapshot = "{}",
            CreatedAt = DateTime.UtcNow
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var settings = Options.Create(new BankTransferSettings
        {
            AccountNumber = "19050430057012",
            BankName = "Techcombank",
            ApiKey = null // No API key required for test
        });

        var config = new ConfigurationBuilder().Build();
        var service = new BankTransferService(
            db,
            settings,
            config,
            NullLogger<BankTransferService>.Instance,
            emailSender: null);

        var webhookDto = new SepayWebhookDto
        {
            Id = 999123,
            Gateway = "Techcombank",
            TransferType = "in",
            TransferAmount = 1500000m,
            Content = $"MADK {orderNumber} CHUYEN KHOAN TECHCOMBANK",
            ReferenceCode = "FT2611059999"
        };

        // Act
        var result = await service.ProcessSepayWebhookAsync(webhookDto);

        // Assert
        result.Success.Should().BeTrue();
        result.OrderNumber.Should().Be(orderNumber);

        var updatedOrder = await db.Orders.FirstAsync(o => o.Id == orderId);
        updatedOrder.PaymentStatus.Should().Be(PaymentStatus.Paid);
        updatedOrder.Status.Should().Be(OrderStatus.Processing);

        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
        payment.Should().NotBeNull();
        payment!.Amount.Should().Be(1500000m);
        payment.Status.Should().Be(PaymentStatus.Paid);
        payment.PaymentMethod.Should().Be(PaymentMethod.BankTransfer);

        var history = await db.OrderStatusHistories.FirstOrDefaultAsync(h => h.OrderId == orderId && h.ToStatus == OrderStatus.Processing);
        history.Should().NotBeNull();
        history!.ChangedByName.Should().Be("VietQR Bank Webhook");
    }

    [Fact]
    public async Task ProcessSepayWebhook_WhenAmountInsufficient_DoesNotMarkAsPaid()
    {
        // Arrange
        var db = CreateInMemoryDbContext("BankTransferTest_Underpaid");
        var orderId = Guid.NewGuid();
        var orderNumber = "MK-20261105-TEST02";

        var order = new Order
        {
            Id = orderId,
            OrderNumber = orderNumber,
            Status = OrderStatus.PendingPayment,
            PaymentStatus = PaymentStatus.Pending,
            PaymentMethod = PaymentMethod.BankTransfer,
            TotalAmount = 2000000m,
            SubtotalAmount = 2000000m,
            ShippingAddressSnapshot = "{}",
            CreatedAt = DateTime.UtcNow
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var settings = Options.Create(new BankTransferSettings());
        var config = new ConfigurationBuilder().Build();
        var service = new BankTransferService(
            db,
            settings,
            config,
            NullLogger<BankTransferService>.Instance,
            emailSender: null);

        var webhookDto = new SepayWebhookDto
        {
            Id = 999124,
            Gateway = "Techcombank",
            TransferType = "in",
            TransferAmount = 1000000m, // Only paid 1M out of 2M
            Content = $"MADK {orderNumber}",
            ReferenceCode = "FT2611058888"
        };

        // Act
        var result = await service.ProcessSepayWebhookAsync(webhookDto);

        // Assert
        result.Success.Should().BeFalse();
        var updatedOrder = await db.Orders.FirstAsync(o => o.Id == orderId);
        updatedOrder.PaymentStatus.Should().Be(PaymentStatus.Pending);
        updatedOrder.AdminNote.Should().Contain("[VietQR Cảnh báo]");
    }
}
