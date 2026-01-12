namespace PdfBuilder.Api.DTOs.BulkGeneration;

// ========================
// Bulk Generation DTOs
// ========================

/// <summary>
/// Response for bulk generation job creation.
/// </summary>
public record BulkGenerationJobResponse(
    int Id,
    Guid DocumentId,
    string Status,
    int TotalItems,
    int ProcessedItems,
    int FailedItems,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string? SourceFileName,
    string? CreatedBy,
    List<BulkGenerationErrorDto>? Errors
);

/// <summary>
/// Error details for a failed row in bulk generation.
/// </summary>
public record BulkGenerationErrorDto(int RowIndex, string Message);

/// <summary>
/// Request to start bulk generation with optional column mappings.
/// </summary>
public record BulkGenerationOptionsRequest(
    /// <summary>
    /// Optional custom column mappings: variable name -> column header.
    /// </summary>
    Dictionary<string, string>? ColumnMappings = null,
    /// <summary>
    /// For Excel files: worksheet name to use (defaults to first worksheet).
    /// </summary>
    string? WorksheetName = null
);

/// <summary>
/// Preview of data parsed from uploaded file.
/// </summary>
public record BulkDataPreviewResponse(
    /// <summary>
    /// Column headers found in the file.
    /// </summary>
    List<string> Headers,
    /// <summary>
    /// First few rows of data.
    /// </summary>
    List<Dictionary<string, string>> SampleRows,
    /// <summary>
    /// Total number of rows (excluding header).
    /// </summary>
    int TotalRows,
    /// <summary>
    /// Suggested column mappings based on variable definitions.
    /// </summary>
    Dictionary<string, string> SuggestedMappings
);
