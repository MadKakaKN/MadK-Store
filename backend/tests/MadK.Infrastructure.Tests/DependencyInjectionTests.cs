using FluentAssertions;
using MadK.Domain.Interfaces;
using MadK.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MadK.Infrastructure.Tests;

public class DependencyInjectionTests
{
    [Fact]
    public void AddInfrastructure_ShouldRegisterDbContextAndUnitOfWork()
    {
        // Arrange
        var services = new ServiceCollection();
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", "Host=localhost;Database=test;Username=test;Password=test" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        // Act
        services.AddInfrastructure(configuration);
        var provider = services.BuildServiceProvider();

        // Assert
        var dbContext = provider.GetService<AppDbContext>();
        dbContext.Should().NotBeNull();

        var unitOfWork = provider.GetService<IUnitOfWork>();
        unitOfWork.Should().NotBeNull();
    }
}
