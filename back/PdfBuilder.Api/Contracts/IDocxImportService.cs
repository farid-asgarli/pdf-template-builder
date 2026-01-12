using PdfBuilder.Api.DTOs.Documents;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for DOCX import operations.
/// </summary>
public interface IDocxImportService
{
    /// <summary>
    /// Import a DOCX file and convert it to editor-compatible JSON format.
    /// </summary>
    /// <param name="fileStream">The DOCX file stream.</param>
    /// <param name="fileName">Original file name.</param>
    /// <param name="title">Document title (defaults to file name if not provided).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Import result with created document or error.</returns>
    Task<DocxImportResponse> ImportAsync(
        Stream fileStream,
        string fileName,
        string? title = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Parse a DOCX file without saving to database (preview).
    /// </summary>
    /// <param name="fileStream">The DOCX file stream.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Parsed content structure.</returns>
    Task<ParsedDocxContent> ParseAsync(
        Stream fileStream,
        CancellationToken cancellationToken = default
    );
}
