using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Repository contract for VariableHistory entities.
/// </summary>
public interface IVariableHistoryRepository
{
    Task<IEnumerable<VariableHistory>> GetByDocumentIdAsync(
        Guid documentId,
        int skip = 0,
        int take = 20,
        CancellationToken cancellationToken = default
    );

    Task<int> GetCountByDocumentIdAsync(
        Guid documentId,
        CancellationToken cancellationToken = default
    );

    Task<VariableHistory?> GetByDocumentIdAndVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    );

    Task<int> GetNextVersionAsync(Guid documentId, CancellationToken cancellationToken = default);

    Task<VariableHistory> CreateAsync(
        VariableHistory history,
        CancellationToken cancellationToken = default
    );

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> DeleteByDocumentIdAndVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    );
}
