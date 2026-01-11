namespace PdfBuilder.Api.Models;

/// <summary>
/// Defines a variable that can be used in a document or template.
/// Variables are placeholders like {{insuredName}} that get replaced with actual values.
/// </summary>
public class VariableDefinition
{
    /// <summary>
    /// The variable name (used in placeholders like {{name}}).
    /// Must be alphanumeric with optional underscores/hyphens.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The data type of the variable.
    /// Supported types: string, number, date, boolean, currency, array, object
    /// </summary>
    public string Type { get; set; } = "string";

    /// <summary>
    /// Human-readable label for the variable (shown in UI).
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Description of what the variable is used for.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Whether the variable must be provided when generating a PDF.
    /// </summary>
    public bool Required { get; set; } = false;

    /// <summary>
    /// Default value to use if the variable is not provided.
    /// </summary>
    public string? DefaultValue { get; set; }

    /// <summary>
    /// For string variables: regex pattern for validation.
    /// </summary>
    public string? Pattern { get; set; }

    /// <summary>
    /// For date variables: format string (e.g., "MMMM dd, yyyy").
    /// For number variables: format string (e.g., "N2", "P0").
    /// For currency variables: currency code (e.g., "USD", "EUR").
    /// </summary>
    public string? Format { get; set; }

    /// <summary>
    /// Category for grouping variables in the UI (e.g., "Policy Info", "Insured Details").
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// Display order within the category.
    /// </summary>
    public int Order { get; set; } = 0;

    /// <summary>
    /// For array types: defines the structure of each item in the array.
    /// </summary>
    public List<VariableDefinition>? ItemSchema { get; set; }

    /// <summary>
    /// For object types: defines the properties of the object.
    /// </summary>
    public List<VariableDefinition>? Properties { get; set; }

    /// <summary>
    /// For array types: minimum number of items required.
    /// </summary>
    public int? MinItems { get; set; }

    /// <summary>
    /// For array types: maximum number of items allowed.
    /// </summary>
    public int? MaxItems { get; set; }

    /// <summary>
    /// For computed variables: the expression to evaluate.
    /// Examples: "subtotal + tax", "items | sum:amount", "firstName + ' ' + lastName"
    /// </summary>
    public string? Expression { get; set; }

    /// <summary>
    /// Whether this is a computed variable (derived from other variables).
    /// Computed variables cannot be set directly - they are calculated from their expression.
    /// </summary>
    public bool IsComputed { get; set; } = false;

    /// <summary>
    /// List of variable names this computed variable depends on.
    /// Used to determine evaluation order and detect circular dependencies.
    /// </summary>
    public List<string>? DependsOn { get; set; }
}

/// <summary>
/// Supported variable types.
/// </summary>
public static class VariableTypes
{
    public const string String = "string";
    public const string Number = "number";
    public const string Date = "date";
    public const string Boolean = "boolean";
    public const string Currency = "currency";
    public const string Array = "array";
    public const string Object = "object";

    public static readonly string[] All = [String, Number, Date, Boolean, Currency, Array, Object];

    public static bool IsValid(string type) => All.Contains(type, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Check if a type represents a simple/primitive value.
    /// </summary>
    public static bool IsPrimitive(string type) =>
        type.ToLowerInvariant() is String or Number or Date or Boolean or Currency;

    /// <summary>
    /// Check if a type represents a complex/nested value.
    /// </summary>
    public static bool IsComplex(string type) => type.ToLowerInvariant() is Array or Object;
}

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
    public string Status { get; set; } = "pending";

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
