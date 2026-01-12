using PdfBuilder.Api.DTOs.Variables;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for variable processing and validation.
/// </summary>
public interface IVariableService
{
    /// <summary>
    /// Parse variable definitions from document JSON content.
    /// </summary>
    List<VariableDefinition> GetVariableDefinitions(string jsonContent);

    /// <summary>
    /// Validate provided variables against definitions.
    /// </summary>
    VariableValidationResult ValidateVariables(
        List<VariableDefinition> definitions,
        Dictionary<string, object>? providedVariables
    );

    /// <summary>
    /// Merge provided variables with defaults.
    /// </summary>
    Dictionary<string, string> MergeVariables(
        List<VariableDefinition> definitions,
        Dictionary<string, string> documentVariables,
        Dictionary<string, object>? providedVariables
    );

    /// <summary>
    /// Analyze variables in a document/template content.
    /// </summary>
    VariableAnalysisResult AnalyzeVariables(string jsonContent);

    /// <summary>
    /// Convert variable definitions to DTOs.
    /// </summary>
    List<VariableDefinitionDto> ToDtos(List<VariableDefinition> definitions);

    /// <summary>
    /// Get variable definitions for a document.
    /// </summary>
    Task<VariableDefinitionsResponse?> GetDocumentVariablesAsync(
        Guid documentId,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Get variable definitions for a template.
    /// </summary>
    Task<VariableDefinitionsResponse?> GetTemplateVariablesAsync(
        Guid templateId,
        CancellationToken cancellationToken = default
    );
}
