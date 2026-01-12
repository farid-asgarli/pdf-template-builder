using PdfBuilder.Api.DTOs.Variables;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for PDF generation operations.
/// </summary>
public interface IPdfGenerationService
{
    /// <summary>
    /// Generate PDF from document JSON content.
    /// </summary>
    byte[] GenerateFromContent(string jsonContent, Dictionary<string, object>? variables = null);

    /// <summary>
    /// Generate PDF for a document by its ID.
    /// </summary>
    Task<PdfGenerationResult> GenerateForDocumentAsync(
        Guid documentId,
        GeneratePdfWithVariablesRequest? request = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Generate PDF for a template by its ID.
    /// </summary>
    Task<PdfGenerationResult> GenerateForTemplateAsync(
        Guid templateId,
        GeneratePdfWithVariablesRequest? request = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Generate a simple test PDF.
    /// </summary>
    byte[] GenerateTestPdf();
}

/// <summary>
/// Result of PDF generation operation.
/// </summary>
public record PdfGenerationResult(
    bool Success,
    byte[]? PdfBytes = null,
    string? FileName = null,
    string? ErrorMessage = null,
    List<VariableValidationError>? ValidationErrors = null
);
