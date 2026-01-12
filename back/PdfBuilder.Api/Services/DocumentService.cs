using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Documents;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service implementation for document operations.
/// </summary>
public class DocumentService : IDocumentService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly ITemplateRepository _templateRepository;

    public DocumentService(
        IDocumentRepository documentRepository,
        ITemplateRepository templateRepository
    )
    {
        _documentRepository = documentRepository;
        _templateRepository = templateRepository;
    }

    public async Task<IEnumerable<DocumentResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var documents = await _documentRepository.GetAllAsync(cancellationToken);
        return documents.Select(ToResponse);
    }

    public async Task<DocumentResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken);
        return document is null ? null : ToResponse(document);
    }

    public async Task<DocumentResponse> CreateAsync(
        CreateDocumentRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var document = new Document
        {
            Title = request.Title,
            Content = request.Content ?? "{}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _documentRepository.CreateAsync(document, cancellationToken);
        return ToResponse(document);
    }

    public async Task<DocumentResponse?> UpdateAsync(
        Guid id,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return null;

        if (request.Title is not null)
            document.Title = request.Title;

        if (request.Content is not null)
            document.Content = request.Content;

        document.UpdatedAt = DateTime.UtcNow;

        await _documentRepository.UpdateAsync(document, cancellationToken);
        return ToResponse(document);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _documentRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task<DocumentResponse?> CreateFromTemplateAsync(
        CreateDocumentFromTemplateRequest request,
        CancellationToken cancellationToken = default
    )
    {
        string content;

        // Check if it's a user-created template (GUID format)
        if (Guid.TryParse(request.TemplateId, out var templateId))
        {
            var template = await _templateRepository.GetByIdAsync(templateId, cancellationToken);
            if (template is null)
                return null;
            content = template.Content;
        }
        else
        {
            // It's a built-in template ID (string like "auto-insurance-basic")
            // The frontend will handle built-in templates by sending the content directly
            content = "{}";
        }

        var document = new Document
        {
            Title = request.Title,
            Content = content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _documentRepository.CreateAsync(document, cancellationToken);
        return ToResponse(document);
    }

    private static DocumentResponse ToResponse(Document document) =>
        new(document.Id, document.Title, document.Content, document.CreatedAt, document.UpdatedAt);
}
