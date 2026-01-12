namespace PdfBuilder.Api.DTOs.Documents;

// ========================
// Document DTOs
// ========================

public record CreateDocumentRequest(string Title, string? Content = null);

public record UpdateDocumentRequest(string? Title = null, string? Content = null);

public record DocumentResponse(
    Guid Id,
    string Title,
    string Content,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateDocumentFromTemplateRequest(string TemplateId, string Title);
