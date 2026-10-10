namespace MadK.Domain.Interfaces;

/// <summary>
/// Unit of Work pattern interface for coordinating multiple repository operations
/// within a single transaction.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
