namespace PdfBuilder.Api.DTOs.Templates;

// ========================
// Template DTOs
// ========================

public record CreateTemplateRequest(
    string Name,
    string Description,
    string Category,
    string Content
);

public record UpdateTemplateRequest(
    string? Name = null,
    string? Description = null,
    string? Category = null,
    string? Content = null
);

public record TemplateResponse(
    Guid Id,
    string Name,
    string Description,
    string Category,
    string Content,
    bool IsBuiltIn,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
