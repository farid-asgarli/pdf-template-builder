using PdfBuilder.Api.DTOs.BulkGeneration;

namespace PdfBuilder.Api.Contracts;

/// <summary>
/// Service contract for bulk PDF generation operations.
/// </summary>
public interface IBulkGenerationService
{
    /// <summary>
    /// Create a bulk generation job from an uploaded file.
    /// </summary>
    Task<BulkGenerationJobResponse> CreateJobAsync(
        Guid documentId,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Start processing a bulk generation job.
    /// </summary>
    Task<bool> StartJobAsync(int jobId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get job status and details.
    /// </summary>
    BulkGenerationJobResponse? GetJob(int jobId);

    /// <summary>
    /// Get the output ZIP file for a completed job.
    /// </summary>
    Stream? GetJobOutput(int jobId);

    /// <summary>
    /// Delete a job and cleanup associated files.
    /// </summary>
    bool DeleteJob(int jobId);
}
