namespace PdfBuilder.Api.DTOs;

public record CreateDocumentRequest(string Title, string? Content = null);

public record UpdateDocumentRequest(string? Title = null, string? Content = null);

public record DocumentResponse(
    Guid Id,
    string Title,
    string Content,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

// Template DTOs
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

// Create document from template
public record CreateDocumentFromTemplateRequest(string TemplateId, string Title);

// ========================
// Variable DTOs
// ========================

/// <summary>
/// Request to generate a PDF with runtime variables.
/// </summary>
public record GeneratePdfWithVariablesRequest(
    /// <summary>
    /// Variable values to substitute in the document.
    /// Key is the variable name, value is the variable value.
    /// Supports primitive types (string, number, bool) and complex types (arrays, objects).
    /// </summary>
    Dictionary<string, object>? Variables = null,
    /// <summary>
    /// If true, saves the variable values to history for auditing and regeneration.
    /// </summary>
    bool SaveToHistory = false,
    /// <summary>
    /// Optional user identifier for history tracking.
    /// </summary>
    string? GeneratedBy = null,
    /// <summary>
    /// Optional notes to attach to the history record.
    /// </summary>
    string? Notes = null
);

/// <summary>
/// Response containing variable definitions for a document/template.
/// </summary>
public record VariableDefinitionsResponse(
    /// <summary>
    /// The document or template ID.
    /// </summary>
    Guid Id,
    /// <summary>
    /// List of variable definitions.
    /// </summary>
    List<VariableDefinitionDto> Variables
);

/// <summary>
/// Result of analyzing variables in a document/template.
/// </summary>
public record VariableAnalysisResult(
    /// <summary>
    /// Defined variable definitions in the document.
    /// </summary>
    List<VariableDefinitionDto> Definitions,
    /// <summary>
    /// All variable placeholders detected in the content ({{variableName}}).
    /// </summary>
    List<string> DetectedPlaceholders,
    /// <summary>
    /// Variables used in content but not defined in variableDefinitions.
    /// </summary>
    List<string> UndefinedVariables,
    /// <summary>
    /// Variables defined but not used in the content.
    /// </summary>
    List<string> UnusedDefinitions
);

/// <summary>
/// DTO for variable definition.
/// </summary>
public record VariableDefinitionDto(
    string Name,
    string Type,
    string Label,
    string? Description,
    bool Required,
    string? DefaultValue,
    string? Pattern,
    string? Format,
    string? Category,
    int Order,
    // Array type properties
    List<VariableDefinitionDto>? ItemSchema,
    int? MinItems,
    int? MaxItems,
    // Object type properties
    List<VariableDefinitionDto>? Properties,
    // Computed variable properties
    bool IsComputed,
    string? Expression,
    List<string>? DependsOn
);

/// <summary>
/// Result of variable validation.
/// </summary>
public record VariableValidationResult(bool IsValid, List<VariableValidationError> Errors);

/// <summary>
/// Individual variable validation error.
/// </summary>
public record VariableValidationError(string VariableName, string ErrorType, string Message);

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

// ========================
// Variable History DTOs
// ========================

/// <summary>
/// Response for variable history record.
/// </summary>
public record VariableHistoryResponse(
    int Id,
    Guid DocumentId,
    int Version,
    DateTime CreatedAt,
    string? GeneratedBy,
    string? Notes,
    string? PdfHash,
    long? PdfSizeBytes,
    Dictionary<string, object> Variables
);

// ========================
// HTML Generation DTOs
// ========================

/// <summary>
/// Request to generate HTML with runtime variables.
/// </summary>
public record GenerateHtmlWithVariablesRequest(
    /// <summary>
    /// Variable values to substitute in the document.
    /// </summary>
    Dictionary<string, object>? Variables = null,
    /// <summary>
    /// If true, return HTML as a file download. Otherwise returns inline content.
    /// </summary>
    bool AsDownload = false,
    /// <summary>
    /// If true, includes print-optimized CSS styles.
    /// </summary>
    bool IncludePrintStyles = true,
    /// <summary>
    /// If true, inlines all CSS styles (useful for email compatibility).
    /// </summary>
    bool InlineStyles = false,
    /// <summary>
    /// Whether to include Google Fonts links. Defaults to true.
    /// </summary>
    bool IncludeFontLinks = true,
    /// <summary>
    /// Additional font families to include from Google Fonts.
    /// Example: ["Inter", "Roboto", "Open Sans"]
    /// </summary>
    List<string>? FontFamilies = null,
    /// <summary>
    /// Whether to auto-detect fonts used in the document. Defaults to true.
    /// </summary>
    bool AutoDetectFonts = true
);

/// <summary>
/// Request to generate HTML preview from content (without saving).
/// </summary>
public record GenerateHtmlPreviewRequest(
    /// <summary>
    /// The document JSON content.
    /// </summary>
    string Content,
    /// <summary>
    /// Optional document title for the HTML head.
    /// </summary>
    string? Title = null,
    /// <summary>
    /// Variable values to substitute.
    /// </summary>
    Dictionary<string, object>? Variables = null,
    /// <summary>
    /// If true, includes print-optimized CSS styles.
    /// </summary>
    bool? IncludePrintStyles = true,
    /// <summary>
    /// If true, inlines all CSS styles.
    /// </summary>
    bool? InlineStyles = false,
    /// <summary>
    /// Whether to include Google Fonts links. Defaults to true.
    /// </summary>
    bool? IncludeFontLinks = true,
    /// <summary>
    /// Additional font families to include from Google Fonts.
    /// </summary>
    List<string>? FontFamilies = null,
    /// <summary>
    /// Whether to auto-detect fonts used in the document. Defaults to true.
    /// </summary>
    bool? AutoDetectFonts = true
);
