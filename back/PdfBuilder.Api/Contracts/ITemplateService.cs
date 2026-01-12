using PdfBuilder.Api.DTOs.Templates;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for template operations.
/// </summary>
public interface ITemplateService
{
    Task<IEnumerable<TemplateResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TemplateResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TemplateResponse> CreateAsync(
        CreateTemplateRequest request,
        CancellationToken cancellationToken = default
    );
    Task<TemplateResponse?> UpdateAsync(
        Guid id,
        UpdateTemplateRequest request,
        CancellationToken cancellationToken = default
    );
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
