namespace PdfBuilder.Api.Entities;

/// <summary>
/// Represents a historical snapshot of variable values used for PDF generation.
/// </summary>
public class VariableHistory
{
    public int Id { get; set; }

    /// <summary>
    /// The document ID this history belongs to.
    /// </summary>
    public Guid DocumentId { get; set; }

    /// <summary>
    /// When this version of variables was used.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User or system that triggered the generation.
    /// </summary>
    public string? GeneratedBy { get; set; }

    /// <summary>
    /// The variable values as JSON.
    /// </summary>
    public string VariablesJson { get; set; } = "{}";

    /// <summary>
    /// Optional: Hash of the generated PDF for verification.
    /// </summary>
    public string? PdfHash { get; set; }

    /// <summary>
    /// Optional: Size of the generated PDF in bytes.
    /// </summary>
    public long? PdfSizeBytes { get; set; }

    /// <summary>
    /// Version number (auto-incremented per document).
    /// </summary>
    public int Version { get; set; }

    /// <summary>
    /// Optional notes about this generation.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Navigation property to the document.
    /// </summary>
    public Document? Document { get; set; }
}
