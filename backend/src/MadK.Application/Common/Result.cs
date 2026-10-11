namespace MadK.Application.Common;

/// <summary>
/// Generic result wrapper for service operations.
/// Conforms to Result Envelope specification: { isSuccess, data, message, error }.
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; }
    [System.Text.Json.Serialization.JsonIgnore]
    public T? Value { get; }
    public T? Data => Value;
    public string? Message { get; }
    public string? Error { get; }

    [System.Text.Json.Serialization.JsonConstructor]
    public Result(bool isSuccess, T? data, string? message, string? error)
    {
        IsSuccess = isSuccess;
        Value = data;
        Message = message;
        Error = error;
    }

    public static Result<T> Success(T value, string? message = null) => new(true, value, message, null);
    public static Result<T> Failure(string error) => new(false, default, null, error);
}

/// <summary>
/// Non-generic result for operations that don't return a value.
/// </summary>
public class Result
{
    public bool IsSuccess { get; }
    public string? Message { get; }
    public string? Error { get; }

    [System.Text.Json.Serialization.JsonConstructor]
    public Result(bool isSuccess, string? message, string? error)
    {
        IsSuccess = isSuccess;
        Message = message;
        Error = error;
    }

    public static Result Success(string? message = null) => new(true, message, null);
    public static Result Failure(string error) => new(false, null, error);
}
