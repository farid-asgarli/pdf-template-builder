using PdfBuilder.Api.DTOs.Html;
using PdfBuilder.Api.DTOs.Variables;
using PdfBuilder.Api.Services;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for HTML generation operations.
/// </summary>
public interface IHtmlGenerationService
{
    /// <summary>
    /// Generate HTML from document JSON content.
    /// </summary>
    string GenerateFromContent(
        string jsonContent,
        HtmlGenerationSettings? settings = null,
        Dictionary<string, object>? variables = null
    );

    /// <summary>
    /// Generate HTML for a document by its ID.
    /// </summary>
    Task<HtmlGenerationResult> GenerateForDocumentAsync(
        Guid documentId,
        GenerateHtmlWithVariablesRequest? request = null,
        CancellationToken cancellationToken = default
    );
}

/// <summary>
/// Result of HTML generation operation.
/// </summary>
public record HtmlGenerationResult(
    bool Success,
    string? HtmlContent = null,
    string? FileName = null,
    string? ErrorMessage = null,
    List<VariableValidationError>? ValidationErrors = null
);
