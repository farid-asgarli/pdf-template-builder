using Microsoft.AspNetCore.Mvc;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.BulkGeneration;

namespace PdfBuilder.Api.Controllers;

/// <summary>
/// Controller for bulk PDF generation from CSV/Excel data.
/// </summary>
[ApiController]
[Route("api")]
public class BulkGenerationController : ControllerBase
{
    private readonly IBulkGenerationService _bulkService;
    private readonly IDocumentService _documentService;

    public BulkGenerationController(
        IBulkGenerationService bulkService,
        IDocumentService documentService)
    {
        _bulkService = bulkService;
        _documentService = documentService;
    }

    /// <summary>
    /// Create a bulk generation job from CSV/Excel file.
    /// </summary>
    [HttpPost("documents/{id:guid}/bulk-generate")]
    [DisableRequestSizeLimit]
    [ProducesResponseType(typeof(BulkGenerationJobResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBulkGenerationJob(Guid id, IFormFile file, CancellationToken cancellationToken)
    {
        var document = await _documentService.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return NotFound(new { error = "Document not found" });

        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not ".csv" and not ".xlsx" and not ".xls")
            return BadRequest(new { error = "Invalid file type. Only CSV and Excel files are supported." });

        try
        {
            using var stream = file.OpenReadStream();
            var job = await _bulkService.CreateJobAsync(id, stream, file.FileName, cancellationToken);
            return Ok(job);
        }
        catch (Exception ex)
        {
            return Problem($"Error creating bulk job: {ex.Message}");
        }
    }

    /// <summary>
    /// Start processing a bulk generation job.
    /// </summary>
    [HttpPost("bulk-jobs/{jobId:int}/start")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartBulkGenerationJob(int jobId, CancellationToken cancellationToken)
    {
        var job = _bulkService.GetJob(jobId);
        if (job is null)
            return NotFound(new { error = "Job not found" });

        if (job.Status != "pending")
            return BadRequest(new { error = $"Job is already {job.Status}" });

        var started = await _bulkService.StartJobAsync(jobId, cancellationToken);
        if (!started)
            return Problem("Failed to start job");

        return Ok(new { message = "Job started", jobId });
    }

    /// <summary>
    /// Get bulk generation job status.
    /// </summary>
    [HttpGet("bulk-jobs/{jobId:int}")]
    [ProducesResponseType(typeof(BulkGenerationJobResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetBulkGenerationJob(int jobId)
    {
        var job = _bulkService.GetJob(jobId);
        if (job is null)
            return NotFound(new { error = "Job not found" });

        return Ok(job);
    }

    /// <summary>
    /// Download generated PDFs as ZIP.
    /// </summary>
    [HttpGet("bulk-jobs/{jobId:int}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult DownloadBulkGenerationOutput(int jobId)
    {
        var job = _bulkService.GetJob(jobId);
        if (job is null)
            return NotFound(new { error = "Job not found" });

        if (job.Status != "completed")
            return BadRequest(new { error = $"Job is not completed. Status: {job.Status}" });

        var stream = _bulkService.GetJobOutput(jobId);
        if (stream is null)
            return NotFound(new { error = "Output file not found" });

        return File(stream, "application/zip", $"bulk-{jobId}.zip");
    }

    /// <summary>
    /// Delete a bulk generation job.
    /// </summary>
    [HttpDelete("bulk-jobs/{jobId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DeleteBulkGenerationJob(int jobId)
    {
        var deleted = _bulkService.DeleteJob(jobId);
        if (!deleted)
            return NotFound(new { error = "Job not found" });

        return Ok(new { message = "Job deleted" });
    }
}
