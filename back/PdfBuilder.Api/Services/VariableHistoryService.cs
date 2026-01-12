using System.Text.Json;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Variables;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service implementation for variable history operations.
/// </summary>
public class VariableHistoryService : IVariableHistoryService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IVariableHistoryRepository _historyRepository;

    public VariableHistoryService(
        IDocumentRepository documentRepository,
        IVariableHistoryRepository historyRepository
    )
    {
        _documentRepository = documentRepository;
        _historyRepository = historyRepository;
    }

    public async Task<VariableHistoryListResponse> GetHistoryAsync(
        Guid documentId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default
    )
    {
        var skip = (page - 1) * pageSize;
        var histories = await _historyRepository.GetByDocumentIdAsync(
            documentId,
            skip,
            pageSize,
            cancellationToken
        );
        var totalCount = await _historyRepository.GetCountByDocumentIdAsync(
            documentId,
            cancellationToken
        );

        var records = histories.Select(ToResponse);
        return new VariableHistoryListResponse(records, totalCount);
    }

    public async Task<VariableHistoryResponse?> GetHistoryVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    )
    {
        var history = await _historyRepository.GetByDocumentIdAndVersionAsync(
            documentId,
            version,
            cancellationToken
        );
        return history is null ? null : ToResponse(history);
    }

    public async Task<bool> DeleteHistoryVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    )
    {
        return await _historyRepository.DeleteByDocumentIdAndVersionAsync(
            documentId,
            version,
            cancellationToken
        );
    }

    public async Task<PdfGenerationResult> RegeneratePdfFromHistoryAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    )
    {
        var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
        if (document is null)
            return new PdfGenerationResult(false, ErrorMessage: "Document not found");

        var history = await _historyRepository.GetByDocumentIdAndVersionAsync(
            documentId,
            version,
            cancellationToken
        );
        if (history is null)
            return new PdfGenerationResult(false, ErrorMessage: "History version not found");

        try
        {
            var (simpleVars, complexVars) = VariableService.ParseHistoryVariables(history);

            var runtimeVariables = new Dictionary<string, object>();
            foreach (var kvp in simpleVars)
                runtimeVariables[kvp.Key] = kvp.Value;
            foreach (var kvp in complexVars)
                runtimeVariables[kvp.Key] = kvp.Value;

            var pdfBytes = PdfGenerator.Generate(document.Content, null, runtimeVariables);
            return new PdfGenerationResult(true, pdfBytes, $"{document.Title}-v{version}.pdf");
        }
        catch (Exception ex)
        {
            return new PdfGenerationResult(
                false,
                ErrorMessage: $"Error regenerating PDF: {ex.Message}"
            );
        }
    }

    private static VariableHistoryResponse ToResponse(VariableHistory history)
    {
        var variables = new Dictionary<string, object>();
        try
        {
            variables =
                JsonSerializer.Deserialize<Dictionary<string, object>>(history.VariablesJson) ?? [];
        }
        catch { }

        return new VariableHistoryResponse(
            history.Id,
            history.DocumentId,
            history.Version,
            history.CreatedAt,
            history.GeneratedBy,
            history.Notes,
            history.PdfHash,
            history.PdfSizeBytes,
            variables
        );
    }
}
