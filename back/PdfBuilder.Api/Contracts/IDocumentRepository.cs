using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Repository contract for Document entities.
/// </summary>
public interface IDocumentRepository
{
    Task<IEnumerable<Document>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Document?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Document> CreateAsync(Document document, CancellationToken cancellationToken = default);
    Task<Document> UpdateAsync(Document document, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}
