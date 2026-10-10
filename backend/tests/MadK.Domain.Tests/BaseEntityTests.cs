using MadK.Domain.Entities;
using FluentAssertions;

namespace MadK.Domain.Tests;

public class BaseEntityTests
{
    [Fact]
    public void NewEntity_ShouldHaveCreatedAtSet()
    {
        // Arrange & Act
        var before = DateTime.UtcNow;
        var entity = new TestEntity();
        var after = DateTime.UtcNow;

        // Assert
        entity.CreatedAt.Should().BeOnOrAfter(before);
        entity.CreatedAt.Should().BeOnOrBefore(after);
    }

    [Fact]
    public void NewEntity_ShouldHaveNullUpdatedAt()
    {
        var entity = new TestEntity();
        entity.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public void NewEntity_ShouldHaveDefaultGuidId()
    {
        var entity = new TestEntity();
        entity.Id.Should().Be(Guid.Empty);
    }

    /// <summary>
    /// Concrete implementation for testing the abstract BaseEntity.
    /// </summary>
    private class TestEntity : BaseEntity { }
}
