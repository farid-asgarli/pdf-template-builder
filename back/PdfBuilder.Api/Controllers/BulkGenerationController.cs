using Microsoft.AspNetCore.Mvc;
using PdfBuilder.Api.Data;
using PdfBuilder.Api.DTOs;
using PdfBuilder.Api.Models;
using PdfBuilder.Api.Services;

namespace PdfBuilder.Api.Controllers;

[ApiController]
[Route("api")]
public class BulkGenerationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BulkGenerationService _bulkService;
    private readonly BulkJobStore _jobStore;

    public BulkGenerationController(
        AppDbContext db,
        BulkGenerationService bulkService,
        BulkJobStore jobStore
    )
    {
        _db = db;
        _bulkService = bulkService;
        _jobStore = jobStore;
    }

    // POST /api/documents/{id}/bulk-generate - Create bulk generation job from CSV/Excel
    [HttpPost("documents/{id:guid}/bulk-generate")]
    [DisableRequestSizeLimit]
    public async Task<IResult> CreateBulkGenerationJob(Guid id, IFormFile file)
    {
        var document = await _db.Documents.FindAsync(id);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        if (file == null || file.Length == 0)
            return Results.BadRequest(new { error = "No file uploaded" });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv" && extension != ".xlsx" && extension != ".xls")
            return Results.BadRequest(
                new { error = "Invalid file type. Only CSV and Excel files are supported." }
            );

        try
        {
            using var stream = file.OpenReadStream();

            BulkGenerationJob job;
            if (extension == ".csv")
            {
                job = await _bulkService.CreateJobFromCsvAsync(id, stream, file.FileName);
            }
            else
            {
                job = await _bulkService.CreateJobFromExcelAsync(id, stream, file.FileName);
            }

            job.Id = _jobStore.GetNextId();
            _jobStore.AddJob(job);

            return Results.Ok(
                new BulkGenerationJobResponse(
                    job.Id,
                    job.DocumentId,
                    job.Status,
                    job.TotalItems,
                    job.ProcessedItems,
                    job.FailedItems,
                    job.CreatedAt,
                    job.StartedAt,
                    job.CompletedAt,
                    job.SourceFileName,
                    job.CreatedBy,
                    null
                )
            );
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating bulk job: {ex.Message}");
        }
    }

    // POST /api/bulk-jobs/{jobId}/start - Start processing a bulk generation job
    [HttpPost("bulk-jobs/{jobId:int}/start")]
    public IResult StartBulkGenerationJob(int jobId)
    {
        var job = _jobStore.GetJob(jobId);
        if (job == null)
            return Results.NotFound(new { error = "Job not found" });

        if (job.Status != "pending")
            return Results.BadRequest(new { error = $"Job is already {job.Status}" });

        // Process job asynchronously in background
        _ = Task.Run(async () =>
        {
            await _bulkService.ProcessJobAsync(job);
        });

        return Results.Ok(new { message = "Job started", jobId });
    }

    // GET /api/bulk-jobs/{jobId} - Get job status
    [HttpGet("bulk-jobs/{jobId:int}")]
    public IResult GetBulkGenerationJob(int jobId)
    {
        var job = _jobStore.GetJob(jobId);
        if (job == null)
            return Results.NotFound(new { error = "Job not found" });

        List<BulkGenerationErrorDto>? errors = null;
        if (!string.IsNullOrEmpty(job.ErrorsJson))
        {
            try
            {
                var errorList = System.Text.Json.JsonSerializer.Deserialize<
                    List<BulkGenerationError>
                >(job.ErrorsJson);
                errors = errorList
                    ?.Select(e => new BulkGenerationErrorDto(e.RowIndex, e.Message))
                    .ToList();
            }
            catch { }
        }

        return Results.Ok(
            new BulkGenerationJobResponse(
                job.Id,
                job.DocumentId,
                job.Status,
                job.TotalItems,
                job.ProcessedItems,
                job.FailedItems,
                job.CreatedAt,
                job.StartedAt,
                job.CompletedAt,
                job.SourceFileName,
                job.CreatedBy,
                errors
            )
        );
    }

    // GET /api/bulk-jobs/{jobId}/download - Download generated PDFs as ZIP
    [HttpGet("bulk-jobs/{jobId:int}/download")]
    public IResult DownloadBulkGenerationOutput(int jobId)
    {
        var job = _jobStore.GetJob(jobId);
        if (job == null)
            return Results.NotFound(new { error = "Job not found" });

        if (job.Status != "completed")
            return Results.BadRequest(
                new { error = $"Job is not completed. Status: {job.Status}" }
            );

        var stream = _bulkService.GetJobOutput(job);
        if (stream == null)
            return Results.NotFound(new { error = "Output file not found" });

        return Results.File(stream, "application/zip", $"bulk-{jobId}.zip");
    }

    // DELETE /api/bulk-jobs/{jobId} - Delete job and cleanup files
    [HttpDelete("bulk-jobs/{jobId:int}")]
    public IResult DeleteBulkGenerationJob(int jobId)
    {
        var job = _jobStore.GetJob(jobId);
        if (job == null)
            return Results.NotFound(new { error = "Job not found" });

        _bulkService.CleanupJob(job);
        _jobStore.RemoveJob(jobId);

        return Results.Ok(new { message = "Job deleted" });
    }
}

/// <summary>
/// In-memory store for bulk generation jobs.
/// In production, this should be replaced with database storage.
/// </summary>
public class BulkJobStore
{
    private readonly Dictionary<int, BulkGenerationJob> _jobs = new();
    private int _jobIdCounter = 0;
    private readonly object _lock = new();

    public int GetNextId()
    {
        lock (_lock)
        {
            return Interlocked.Increment(ref _jobIdCounter);
        }
    }

    public void AddJob(BulkGenerationJob job)
    {
        lock (_lock)
        {
            _jobs[job.Id] = job;
        }
    }

    public BulkGenerationJob? GetJob(int id)
    {
        lock (_lock)
        {
            return _jobs.TryGetValue(id, out var job) ? job : null;
        }
    }

    public void RemoveJob(int id)
    {
        lock (_lock)
        {
            _jobs.Remove(id);
        }
    }
}
