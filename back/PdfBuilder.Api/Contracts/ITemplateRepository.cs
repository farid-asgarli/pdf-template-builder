using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Repository contract for Template entities.
/// </summary>
public interface ITemplateRepository
{
    Task<IEnumerable<Template>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Template?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Template> CreateAsync(Template template, CancellationToken cancellationToken = default);
    Task<Template> UpdateAsync(Template template, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}
