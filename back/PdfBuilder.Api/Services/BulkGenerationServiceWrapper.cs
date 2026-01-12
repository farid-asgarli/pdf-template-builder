using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using CsvHelper;
using CsvHelper.Configuration;
using OfficeOpenXml;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.BulkGeneration;
using PdfBuilder.Api.Entities;
using PdfBuilder.Api.Infrastructure;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service implementation for bulk PDF generation.
/// </summary>
public class BulkGenerationServiceWrapper : IBulkGenerationService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly BulkJobStore _jobStore;
    private readonly ILogger<BulkGenerationServiceWrapper> _logger;
    private readonly string _outputDirectory;

    public BulkGenerationServiceWrapper(
        IDocumentRepository documentRepository,
        BulkJobStore jobStore,
        ILogger<BulkGenerationServiceWrapper> logger,
        IConfiguration configuration
    )
    {
        _documentRepository = documentRepository;
        _jobStore = jobStore;
        _logger = logger;
        _outputDirectory =
            configuration["BulkGeneration:OutputDirectory"]
            ?? Path.Combine(Path.GetTempPath(), "PdfBulkGeneration");

        Directory.CreateDirectory(_outputDirectory);
        ExcelPackage.License.SetNonCommercialPersonal("PDF Template Builder");
    }

    public async Task<BulkGenerationJobResponse> CreateJobAsync(
        Guid documentId,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default
    )
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        var job = new BulkGenerationJob
        {
            DocumentId = documentId,
            SourceFileName = fileName,
            Status = BulkJobStatus.Pending,
        };

        try
        {
            if (extension == ".csv")
            {
                await ParseCsvAsync(job, fileStream, cancellationToken);
            }
            else
            {
                await ParseExcelAsync(job, fileStream, cancellationToken);
            }

            job.Id = _jobStore.GetNextId();
            _jobStore.AddJob(job);

            var jobDir = GetJobDirectory(job.Id);
            Directory.CreateDirectory(jobDir);

            var dataPath = Path.Combine(jobDir, $"data{extension}");
            fileStream.Position = 0;
            await using var fileOutput = File.Create(dataPath);
            await fileStream.CopyToAsync(fileOutput, cancellationToken);
        }
        catch (Exception ex)
        {
            job.Status = BulkJobStatus.Failed;
            job.ErrorsJson = JsonSerializer.Serialize(new[] { ex.Message });
            _logger.LogError(ex, "Failed to parse file for bulk generation");
        }

        return ToResponse(job);
    }

    public Task<bool> StartJobAsync(int jobId, CancellationToken cancellationToken = default)
    {
        var job = _jobStore.GetJob(jobId);
        if (job is null || job.Status != BulkJobStatus.Pending)
            return Task.FromResult(false);

        _ = Task.Run(async () => await ProcessJobAsync(job), cancellationToken);
        return Task.FromResult(true);
    }

    public BulkGenerationJobResponse? GetJob(int jobId)
    {
        var job = _jobStore.GetJob(jobId);
        return job is null ? null : ToResponse(job);
    }

    public Stream? GetJobOutput(int jobId)
    {
        var job = _jobStore.GetJob(jobId);
        if (job?.OutputPath is null || !File.Exists(job.OutputPath))
            return null;

        return File.OpenRead(job.OutputPath);
    }

    public bool DeleteJob(int jobId)
    {
        var job = _jobStore.GetJob(jobId);
        if (job is null)
            return false;

        CleanupJob(job);
        _jobStore.RemoveJob(jobId);
        return true;
    }

    private async Task ProcessJobAsync(BulkGenerationJob job)
    {
        job.Status = BulkJobStatus.Processing;
        job.StartedAt = DateTime.UtcNow;
        _jobStore.UpdateJob(job);

        var errors = new List<Entities.BulkGenerationError>();

        try
        {
            var document = await _documentRepository.GetByIdAsync(job.DocumentId);
            if (document is null)
            {
                job.Status = BulkJobStatus.Failed;
                job.ErrorsJson = JsonSerializer.Serialize(new[] { "Document not found" });
                _jobStore.UpdateJob(job);
                return;
            }

            var definitions = VariableService.GetVariableDefinitions(document.Content);
            var records = await ParseDataSourceAsync(job);

            var jobDir = GetJobDirectory(job.Id);
            var pdfDir = Path.Combine(jobDir, "pdfs");
            Directory.CreateDirectory(pdfDir);

            int index = 0;
            foreach (var record in records)
            {
                try
                {
                    var variables = ConvertRecordToVariables(record, definitions);
                    var pdfBytes = PdfGenerator.Generate(document.Content, null, variables);

                    var fileName = $"{document.Title}_{index + 1}.pdf";
                    var filePath = Path.Combine(pdfDir, fileName);
                    await File.WriteAllBytesAsync(filePath, pdfBytes);

                    job.ProcessedItems++;
                }
                catch (Exception ex)
                {
                    errors.Add(new Entities.BulkGenerationError(index + 1, ex.Message));
                    job.FailedItems++;
                }

                index++;
                _jobStore.UpdateJob(job);
            }

            // Create ZIP file
            var zipPath = Path.Combine(jobDir, $"bulk-{job.Id}.zip");
            ZipFile.CreateFromDirectory(pdfDir, zipPath);
            job.OutputPath = zipPath;

            job.Status =
                errors.Count == job.TotalItems ? BulkJobStatus.Failed : BulkJobStatus.Completed;
            job.ErrorsJson = errors.Count > 0 ? JsonSerializer.Serialize(errors) : null;
        }
        catch (Exception ex)
        {
            job.Status = BulkJobStatus.Failed;
            job.ErrorsJson = JsonSerializer.Serialize(new[] { ex.Message });
            _logger.LogError(ex, "Failed to process bulk generation job {JobId}", job.Id);
        }

        job.CompletedAt = DateTime.UtcNow;
        _jobStore.UpdateJob(job);
    }

    private Task ParseCsvAsync(
        BulkGenerationJob job,
        Stream stream,
        CancellationToken cancellationToken
    )
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);
        using var csv = new CsvReader(
            reader,
            new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
            }
        );

        var records = csv.GetRecords<dynamic>().ToList();
        job.TotalItems = records.Count;
        return Task.CompletedTask;
    }

    private Task ParseExcelAsync(
        BulkGenerationJob job,
        Stream stream,
        CancellationToken cancellationToken
    )
    {
        using var package = new ExcelPackage(stream);
        var worksheet =
            package.Workbook.Worksheets.FirstOrDefault()
            ?? throw new InvalidOperationException("No worksheet found in Excel file.");

        var rowCount = worksheet.Dimension?.Rows ?? 0;
        job.TotalItems = Math.Max(0, rowCount - 1);
        return Task.CompletedTask;
    }

    private async Task<List<Dictionary<string, string>>> ParseDataSourceAsync(BulkGenerationJob job)
    {
        var jobDir = GetJobDirectory(job.Id);
        var csvPath = Path.Combine(jobDir, "data.csv");
        var excelPath = Path.Combine(jobDir, "data.xlsx");

        if (File.Exists(csvPath))
        {
            return await ParseCsvRecordsAsync(csvPath);
        }
        else if (File.Exists(excelPath))
        {
            return ParseExcelRecords(excelPath);
        }

        return [];
    }

    private async Task<List<Dictionary<string, string>>> ParseCsvRecordsAsync(string path)
    {
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(
            reader,
            new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true }
        );

        var records = new List<Dictionary<string, string>>();
        await csv.ReadAsync();
        csv.ReadHeader();
        var headers = csv.HeaderRecord ?? [];

        while (await csv.ReadAsync())
        {
            var record = new Dictionary<string, string>();
            foreach (var header in headers)
            {
                record[header] = csv.GetField(header) ?? "";
            }
            records.Add(record);
        }

        return records;
    }

    private List<Dictionary<string, string>> ParseExcelRecords(string path)
    {
        using var package = new ExcelPackage(new FileInfo(path));
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
        if (worksheet is null)
            return [];

        var records = new List<Dictionary<string, string>>();
        var dimension = worksheet.Dimension;
        if (dimension is null)
            return records;

        var headers = new List<string>();
        for (int col = 1; col <= dimension.Columns; col++)
        {
            headers.Add(worksheet.Cells[1, col].Text);
        }

        for (int row = 2; row <= dimension.Rows; row++)
        {
            var record = new Dictionary<string, string>();
            for (int col = 1; col <= dimension.Columns; col++)
            {
                record[headers[col - 1]] = worksheet.Cells[row, col].Text;
            }
            records.Add(record);
        }

        return records;
    }

    private Dictionary<string, object> ConvertRecordToVariables(
        Dictionary<string, string> record,
        List<VariableDefinition> definitions
    )
    {
        var variables = new Dictionary<string, object>();

        foreach (var definition in definitions)
        {
            if (record.TryGetValue(definition.Name, out var value))
            {
                variables[definition.Name] = value;
            }
            else if (!string.IsNullOrEmpty(definition.DefaultValue))
            {
                variables[definition.Name] = definition.DefaultValue;
            }
        }

        // Include any columns not in definitions
        foreach (var kvp in record)
        {
            if (!variables.ContainsKey(kvp.Key))
            {
                variables[kvp.Key] = kvp.Value;
            }
        }

        return variables;
    }

    private string GetJobDirectory(int jobId) => Path.Combine(_outputDirectory, $"job-{jobId}");

    private void CleanupJob(BulkGenerationJob job)
    {
        var jobDir = GetJobDirectory(job.Id);
        if (Directory.Exists(jobDir))
        {
            try
            {
                Directory.Delete(jobDir, true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup job directory for job {JobId}", job.Id);
            }
        }
    }

    private static BulkGenerationJobResponse ToResponse(BulkGenerationJob job)
    {
        List<BulkGenerationErrorDto>? errors = null;
        if (!string.IsNullOrEmpty(job.ErrorsJson))
        {
            try
            {
                var errorList = JsonSerializer.Deserialize<List<BulkGenerationError>>(
                    job.ErrorsJson
                );
                errors = errorList
                    ?.Select(e => new BulkGenerationErrorDto(e.RowIndex, e.Message))
                    .ToList();
            }
            catch { }
        }

        return new BulkGenerationJobResponse(
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
        );
    }
}
