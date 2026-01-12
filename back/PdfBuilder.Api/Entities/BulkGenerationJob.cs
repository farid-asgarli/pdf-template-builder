namespace PdfBuilder.Api.Entities;

/// <summary>
/// Represents a bulk PDF generation job.
/// </summary>
public class BulkGenerationJob
{
    public int Id { get; set; }

    /// <summary>
    /// The document/template ID to use for generation.
    /// </summary>
    public Guid DocumentId { get; set; }

    /// <summary>
    /// Job status: pending, processing, completed, failed, cancelled
    /// </summary>
    public string Status { get; set; } = BulkJobStatus.Pending;

    /// <summary>
    /// Total number of items to process.
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Number of items successfully processed.
    /// </summary>
    public int ProcessedItems { get; set; }

    /// <summary>
    /// Number of items that failed.
    /// </summary>
    public int FailedItems { get; set; }

    /// <summary>
    /// When the job was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the job started processing.
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the job completed.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Path to the output ZIP file containing all generated PDFs.
    /// </summary>
    public string? OutputPath { get; set; }

    /// <summary>
    /// Error messages for failed items (JSON array).
    /// </summary>
    public string? ErrorsJson { get; set; }

    /// <summary>
    /// Original filename of the uploaded data file.
    /// </summary>
    public string? SourceFileName { get; set; }

    /// <summary>
    /// User who initiated the bulk generation.
    /// </summary>
    public string? CreatedBy { get; set; }
}

/// <summary>
/// Bulk generation job status constants.
/// </summary>
public static class BulkJobStatus
{
    public const string Pending = "pending";
    public const string Processing = "processing";
    public const string Completed = "completed";
    public const string Failed = "failed";
    public const string Cancelled = "cancelled";
}

/// <summary>
/// Represents an error that occurred during bulk generation.
/// </summary>
public record BulkGenerationError(int RowIndex, string Message);
