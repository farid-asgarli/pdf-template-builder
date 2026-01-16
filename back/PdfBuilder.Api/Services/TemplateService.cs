using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Templates;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service implementation for template operations.
/// </summary>
public class TemplateService(ITemplateRepository templateRepository) : ITemplateService
{
    private readonly ITemplateRepository _templateRepository = templateRepository;

    public async Task<IEnumerable<TemplateResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var templates = await _templateRepository.GetAllAsync(cancellationToken);
        return templates.Select(ToResponse);
    }

    public async Task<TemplateResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        var template = await _templateRepository.GetByIdAsync(id, cancellationToken);
        return template is null ? null : ToResponse(template);
    }

    public async Task<TemplateResponse> CreateAsync(
        CreateTemplateRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var template = new Template
        {
            Name = request.Name,
            Description = request.Description,
            Category = request.Category,
            Content = request.Content,
            IsBuiltIn = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _templateRepository.CreateAsync(template, cancellationToken);
        return ToResponse(template);
    }

    public async Task<TemplateResponse?> UpdateAsync(
        Guid id,
        UpdateTemplateRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var template = await _templateRepository.GetByIdAsync(id, cancellationToken);
        if (template is null)
            return null;

        // Prevent editing built-in templates
        if (template.IsBuiltIn)
            return null;

        if (request.Name is not null)
            template.Name = request.Name;

        if (request.Description is not null)
            template.Description = request.Description;

        if (request.Category is not null)
            template.Category = request.Category;

        if (request.Content is not null)
            template.Content = request.Content;

        template.UpdatedAt = DateTime.UtcNow;

        await _templateRepository.UpdateAsync(template, cancellationToken);
        return ToResponse(template);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var template = await _templateRepository.GetByIdAsync(id, cancellationToken);
        if (template is null || template.IsBuiltIn)
            return false;

        return await _templateRepository.DeleteAsync(id, cancellationToken);
    }

    private static TemplateResponse ToResponse(Template template) =>
        new(
            template.Id,
            template.Name,
            template.Description,
            template.Category,
            template.Content,
            template.IsBuiltIn,
            template.CreatedAt,
            template.UpdatedAt
        );
}
