using PdfBuilder.Api.DTOs.Variables;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for variable history operations.
/// </summary>
public interface IVariableHistoryService
{
    Task<VariableHistoryListResponse> GetHistoryAsync(
        Guid documentId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default
    );

    Task<VariableHistoryResponse?> GetHistoryVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    );

    Task<bool> DeleteHistoryVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    );

    Task<PdfGenerationResult> RegeneratePdfFromHistoryAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    );
}

/// <summary>
/// Response containing paginated history records.
/// </summary>
public record VariableHistoryListResponse(
    IEnumerable<VariableHistoryResponse> Records,
    int TotalCount
);
