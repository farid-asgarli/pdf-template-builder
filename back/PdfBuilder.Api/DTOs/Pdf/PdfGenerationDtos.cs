namespace PdfBuilder.Api.DTOs.Pdf;

// ========================
// PDF Generation DTOs
// ========================

/// <summary>
/// Request to generate PDF preview from content (without saving).
/// </summary>
public record GeneratePdfPreviewRequest(string Content);
