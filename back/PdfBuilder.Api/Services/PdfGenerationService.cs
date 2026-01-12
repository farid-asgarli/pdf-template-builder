using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Variables;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service implementation for PDF generation operations.
/// </summary>
public class PdfGenerationService : IPdfGenerationService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly ITemplateRepository _templateRepository;
    private readonly IVariableHistoryRepository _historyRepository;

    public PdfGenerationService(
        IDocumentRepository documentRepository,
        ITemplateRepository templateRepository,
        IVariableHistoryRepository historyRepository
    )
    {
        _documentRepository = documentRepository;
        _templateRepository = templateRepository;
        _historyRepository = historyRepository;
    }

    public byte[] GenerateFromContent(
        string jsonContent,
        Dictionary<string, object>? variables = null
    )
    {
        return PdfGenerator.Generate(jsonContent, null, variables);
    }

    public async Task<PdfGenerationResult> GenerateForDocumentAsync(
        Guid documentId,
        GeneratePdfWithVariablesRequest? request = null,
        CancellationToken cancellationToken = default
    )
    {
        var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
        if (document is null)
            return new PdfGenerationResult(false, ErrorMessage: "Document not found");

        return await GeneratePdfInternalAsync(
            document.Content,
            document.Title,
            document.Id,
            request,
            cancellationToken
        );
    }

    public async Task<PdfGenerationResult> GenerateForTemplateAsync(
        Guid templateId,
        GeneratePdfWithVariablesRequest? request = null,
        CancellationToken cancellationToken = default
    )
    {
        var template = await _templateRepository.GetByIdAsync(templateId, cancellationToken);
        if (template is null)
            return new PdfGenerationResult(false, ErrorMessage: "Template not found");

        return await GeneratePdfInternalAsync(
            template.Content,
            template.Name,
            null, // Templates don't have history
            request,
            cancellationToken
        );
    }

    public byte[] GenerateTestPdf()
    {
        return PdfGenerator.GenerateSimple();
    }

    private async Task<PdfGenerationResult> GeneratePdfInternalAsync(
        string content,
        string fileName,
        Guid? documentIdForHistory,
        GeneratePdfWithVariablesRequest? request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            // Get variable definitions for validation
            var definitions = VariableService.GetVariableDefinitions(content);

            // Validate provided variables
            if (definitions.Count > 0)
            {
                var validationResult = VariableService.ValidateVariables(
                    definitions,
                    request?.Variables
                );
                if (!validationResult.IsValid)
                {
                    return new PdfGenerationResult(
                        false,
                        ValidationErrors: validationResult.Errors
                    );
                }
            }

            // Generate PDF
            var pdfBytes = PdfGenerator.Generate(content, null, request?.Variables);

            // Save to history if requested
            if (request?.SaveToHistory == true && documentIdForHistory.HasValue)
            {
                await SaveToHistoryAsync(
                    documentIdForHistory.Value,
                    definitions,
                    request,
                    pdfBytes,
                    cancellationToken
                );
            }

            return new PdfGenerationResult(true, pdfBytes, $"{fileName}.pdf");
        }
        catch (Exception ex)
        {
            return new PdfGenerationResult(
                false,
                ErrorMessage: $"Error generating PDF: {ex.Message}"
            );
        }
    }

    private async Task SaveToHistoryAsync(
        Guid documentId,
        List<VariableDefinition> definitions,
        GeneratePdfWithVariablesRequest request,
        byte[] pdfBytes,
        CancellationToken cancellationToken
    )
    {
        var mergedVars = VariableService.MergeVariables(
            definitions,
            new Dictionary<string, string>(),
            request.Variables
        );

        var complexVars = VariableService.ExtractComplexVariables(request.Variables);

        var nextVersion = await _historyRepository.GetNextVersionAsync(
            documentId,
            cancellationToken
        );

        var history = VariableService.CreateHistoryRecord(
            documentId,
            mergedVars,
            complexVars,
            request.GeneratedBy,
            request.Notes
        );

        history.Version = nextVersion;
        history.PdfSizeBytes = pdfBytes.Length;
        history.PdfHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(pdfBytes)
        );

        await _historyRepository.CreateAsync(history, cancellationToken);
    }
}
