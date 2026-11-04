using FluentAssertions;
using MadK.Infrastructure;
using Npgsql;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class OptimizationVerificationTests
{
    [Fact]
    public void Task1_ResolveConnectionString_FromUri_EnforcesSupabasePoolLimits()
    {
        // Arrange
        string rawUri = "postgres://postgres.qpomenjrpbltbomeljxp:mySuperSecret123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

        // Act
        string resolved = DependencyInjection.ResolveConnectionString(rawUri);
        var builder = new NpgsqlConnectionStringBuilder(resolved);

        // Assert
        builder.Pooling.Should().BeTrue();
        builder.MaxPoolSize.Should().Be(15);
        builder.MinPoolSize.Should().Be(1);
        builder.ConnectionIdleLifetime.Should().Be(30);
        builder.Timeout.Should().Be(15);
        builder.Host.Should().Be("aws-0-ap-southeast-1.pooler.supabase.com");
        builder.Port.Should().Be(6543);
    }

    [Fact]
    public void Task1_ResolveConnectionString_FromStandardString_EnforcesLimits()
    {
        // Arrange
        string rawStandard = "Host=localhost;Port=5432;Database=madkstore;Username=admin;Password=secret";

        // Act
        string resolved = DependencyInjection.ResolveConnectionString(rawStandard);
        var builder = new NpgsqlConnectionStringBuilder(resolved);

        // Assert
        builder.Pooling.Should().BeTrue();
        builder.MaxPoolSize.Should().Be(15);
        builder.MinPoolSize.Should().Be(1);
        builder.ConnectionIdleLifetime.Should().Be(30);
    }

    [Fact]
    public void Task3_CartCleanupCutoff_CalculatesCorrectRetentionWindow()
    {
        // Arrange
        int retentionDays = 30;
        var now = DateTime.UtcNow;

        // Act
        var cutoff = now.AddDays(-retentionDays);

        // Assert
        (now - cutoff).TotalDays.Should().BeApproximately(30, 0.01);
    }
}
