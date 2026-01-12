namespace PdfBuilder.Api.DTOs.Variables;

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
