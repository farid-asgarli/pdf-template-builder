namespace PdfBuilder.Api.Entities;

/// <summary>
/// Represents a PDF document in the system.
/// </summary>
public class Document
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = "{}"; // JSON content
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
