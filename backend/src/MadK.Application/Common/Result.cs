namespace MadK.Application.Common;

/// <summary>
/// Generic result wrapper for service operations.
/// Avoids throwing exceptions for expected business failures.
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool isSuccess, T? value, string? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}

/// <summary>
/// Non-generic result for operations that don't return a value.
/// </summary>
public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }

    private Result(bool isSuccess, string? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, null);
    public static Result Failure(string error) => new(false, error);
}
