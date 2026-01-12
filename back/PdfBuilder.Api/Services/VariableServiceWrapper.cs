using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Variables;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service implementation for variable processing and validation.
/// Wraps the static VariableService methods for dependency injection.
/// </summary>
public class VariableServiceWrapper : IVariableService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly ITemplateRepository _templateRepository;

    public VariableServiceWrapper(
        IDocumentRepository documentRepository,
        ITemplateRepository templateRepository
    )
    {
        _documentRepository = documentRepository;
        _templateRepository = templateRepository;
    }

    public List<VariableDefinition> GetVariableDefinitions(string jsonContent)
    {
        return VariableService.GetVariableDefinitions(jsonContent);
    }

    public VariableValidationResult ValidateVariables(
        List<VariableDefinition> definitions,
        Dictionary<string, object>? providedVariables
    )
    {
        return VariableService.ValidateVariables(definitions, providedVariables);
    }

    public Dictionary<string, string> MergeVariables(
        List<VariableDefinition> definitions,
        Dictionary<string, string> documentVariables,
        Dictionary<string, object>? providedVariables
    )
    {
        return VariableService.MergeVariables(definitions, documentVariables, providedVariables);
    }

    public VariableAnalysisResult AnalyzeVariables(string jsonContent)
    {
        return VariableService.AnalyzeVariables(jsonContent);
    }

    public List<VariableDefinitionDto> ToDtos(List<VariableDefinition> definitions)
    {
        return VariableService.ToDtos(definitions);
    }

    public async Task<VariableDefinitionsResponse?> GetDocumentVariablesAsync(
        Guid documentId,
        CancellationToken cancellationToken = default
    )
    {
        var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
        if (document is null)
            return null;

        var definitions = GetVariableDefinitions(document.Content);
        return new VariableDefinitionsResponse(document.Id, ToDtos(definitions));
    }

    public async Task<VariableDefinitionsResponse?> GetTemplateVariablesAsync(
        Guid templateId,
        CancellationToken cancellationToken = default
    )
    {
        var template = await _templateRepository.GetByIdAsync(templateId, cancellationToken);
        if (template is null)
            return null;

        var definitions = GetVariableDefinitions(template.Content);
        return new VariableDefinitionsResponse(template.Id, ToDtos(definitions));
    }
}
