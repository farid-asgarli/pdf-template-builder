using PdfBuilder.Api.DTOs.Documents;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for document operations.
/// </summary>
public interface IDocumentService
{
    Task<IEnumerable<DocumentResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<DocumentResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DocumentResponse> CreateAsync(
        CreateDocumentRequest request,
        CancellationToken cancellationToken = default
    );
    Task<DocumentResponse?> UpdateAsync(
        Guid id,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default
    );
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DocumentResponse?> CreateFromTemplateAsync(
        CreateDocumentFromTemplateRequest request,
        CancellationToken cancellationToken = default
    );
}
