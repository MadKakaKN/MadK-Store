using MadK.Application.Common;
using FluentAssertions;

namespace MadK.Application.Tests;

public class ResultTests
{
    [Fact]
    public void Success_ShouldCreateSuccessfulResult()
    {
        var result = Result<string>.Success("test value");

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("test value");
        result.Error.Should().BeNull();
    }

    [Fact]
    public void Failure_ShouldCreateFailedResult()
    {
        var result = Result<string>.Failure("something went wrong");

        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Error.Should().Be("something went wrong");
    }

    [Fact]
    public void NonGenericSuccess_ShouldCreateSuccessfulResult()
    {
        var result = Result.Success();

        result.IsSuccess.Should().BeTrue();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void NonGenericFailure_ShouldCreateFailedResult()
    {
        var result = Result.Failure("error");

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("error");
    }
}
