using System.Globalization;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using PdfBuilder.Api.Data;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service for bulk PDF generation from CSV/Excel data sources.
/// </summary>
public class BulkGenerationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<BulkGenerationService> _logger;
    private readonly string _outputDirectory;

    public BulkGenerationService(
        AppDbContext context,
        ILogger<BulkGenerationService> logger,
        IConfiguration configuration
    )
    {
        _context = context;
        _logger = logger;
        _outputDirectory =
            configuration["BulkGeneration:OutputDirectory"]
            ?? Path.Combine(Path.GetTempPath(), "PdfBulkGeneration");

        // Ensure output directory exists
        Directory.CreateDirectory(_outputDirectory);

        // Set EPPlus license for non-commercial use (EPPlus 8+)
        ExcelPackage.License.SetNonCommercialPersonal("PDF Template Builder");
    }

    /// <summary>
    /// Create a new bulk generation job from a CSV file.
    /// </summary>
    public async Task<BulkGenerationJob> CreateJobFromCsvAsync(
        Guid documentId,
        Stream csvStream,
        string fileName,
        string? createdBy = null,
        CsvConfiguration? config = null
    )
    {
        var job = new BulkGenerationJob
        {
            DocumentId = documentId,
            SourceFileName = fileName,
            CreatedBy = createdBy,
            Status = "pending",
        };

        try
        {
            // Parse CSV to get row count
            using var reader = new StreamReader(csvStream, Encoding.UTF8, leaveOpen: true);
            using var csv = new CsvReader(
                reader,
                config
                    ?? new CsvConfiguration(CultureInfo.InvariantCulture)
                    {
                        HasHeaderRecord = true,
                        MissingFieldFound = null,
                    }
            );

            var records = csv.GetRecords<dynamic>().ToList();
            job.TotalItems = records.Count;

            // Reset stream for later processing
            csvStream.Position = 0;

            // Store the data for later processing
            var jobDir = GetJobDirectory(job.Id);
            Directory.CreateDirectory(jobDir);

            var dataPath = Path.Combine(jobDir, "data.csv");
            using var fileStream = File.Create(dataPath);
            await csvStream.CopyToAsync(fileStream);
        }
        catch (Exception ex)
        {
            job.Status = "failed";
            job.ErrorsJson = JsonSerializer.Serialize(new[] { ex.Message });
            _logger.LogError(ex, "Failed to parse CSV file for bulk generation");
        }

        return job;
    }

    /// <summary>
    /// Create a new bulk generation job from an Excel file.
    /// </summary>
    public async Task<BulkGenerationJob> CreateJobFromExcelAsync(
        Guid documentId,
        Stream excelStream,
        string fileName,
        string? worksheetName = null,
        string? createdBy = null
    )
    {
        var job = new BulkGenerationJob
        {
            DocumentId = documentId,
            SourceFileName = fileName,
            CreatedBy = createdBy,
            Status = "pending",
        };

        try
        {
            using var package = new ExcelPackage(excelStream);
            var worksheet =
                worksheetName != null
                    ? package.Workbook.Worksheets[worksheetName]
                    : package.Workbook.Worksheets.FirstOrDefault();

            if (worksheet == null)
            {
                throw new InvalidOperationException("No worksheet found in Excel file.");
            }

            // Count rows (excluding header)
            var rowCount = worksheet.Dimension?.Rows ?? 0;
            job.TotalItems = Math.Max(0, rowCount - 1);

            // Store the data for later processing
            var jobDir = GetJobDirectory(job.Id);
            Directory.CreateDirectory(jobDir);

            var dataPath = Path.Combine(jobDir, "data.xlsx");
            excelStream.Position = 0;
            using var fileStream = File.Create(dataPath);
            await excelStream.CopyToAsync(fileStream);
        }
        catch (Exception ex)
        {
            job.Status = "failed";
            job.ErrorsJson = JsonSerializer.Serialize(new[] { ex.Message });
            _logger.LogError(ex, "Failed to parse Excel file for bulk generation");
        }

        return job;
    }

    /// <summary>
    /// Process a bulk generation job.
    /// </summary>
    public async Task<BulkGenerationJob> ProcessJobAsync(
        BulkGenerationJob job,
        CancellationToken cancellationToken = default
    )
    {
        job.Status = "processing";
        job.StartedAt = DateTime.UtcNow;

        var errors = new List<BulkGenerationError>();
        var generatedFiles = new List<string>();

        try
        {
            // Get document
            var document = await _context.Documents.FindAsync(job.DocumentId, cancellationToken);
            if (document == null)
            {
                throw new InvalidOperationException($"Document {job.DocumentId} not found.");
            }

            // Get variable definitions
            var definitions = VariableService.GetVariableDefinitions(document.Content);

            // Parse data source
            var records = await ParseDataSourceAsync(job);

            var jobDir = GetJobDirectory(job.Id);
            var pdfDir = Path.Combine(jobDir, "pdfs");
            Directory.CreateDirectory(pdfDir);

            int index = 0;
            foreach (var record in records)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    job.Status = "cancelled";
                    break;
                }

                try
                {
                    // Convert record to variable dictionary
                    var variables = ConvertRecordToVariables(record, definitions);

                    // Generate PDF with variables as runtime variables
                    var runtimeVars = variables.ToDictionary(k => k.Key, v => (object)v.Value);
                    var pdfBytes = PdfGenerator.Generate(document.Content, null, runtimeVars);

                    // Determine filename (use a naming variable if defined, otherwise use index)
                    var pdfFileName = GetPdfFileName(variables, index);
                    var pdfPath = Path.Combine(pdfDir, pdfFileName);

                    await File.WriteAllBytesAsync(pdfPath, pdfBytes, cancellationToken);
                    generatedFiles.Add(pdfPath);

                    // Create history record
                    var complexVars = VariableService.ExtractComplexVariables(
                        variables.ToDictionary(k => k.Key, v => (object)v.Value)
                    );
                    var history = VariableService.CreateHistoryRecord(
                        job.DocumentId,
                        variables,
                        complexVars,
                        job.CreatedBy,
                        $"Bulk generation job, row {index + 1}"
                    );
                    history.PdfHash = ComputeHash(pdfBytes);
                    history.PdfSizeBytes = pdfBytes.Length;

                    job.ProcessedItems++;
                }
                catch (Exception ex)
                {
                    job.FailedItems++;
                    errors.Add(new BulkGenerationError { RowIndex = index, Message = ex.Message });
                    _logger.LogWarning(ex, "Failed to generate PDF for row {Index}", index);
                }

                index++;
            }

            // Create ZIP file if there are generated files
            if (generatedFiles.Count > 0)
            {
                var zipPath = Path.Combine(jobDir, $"bulk-{job.Id}.zip");
                CreateZipArchive(generatedFiles, zipPath);
                job.OutputPath = zipPath;
            }

            job.Status = job.FailedItems == job.TotalItems ? "failed" : "completed";
            job.CompletedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            job.Status = "failed";
            errors.Add(new BulkGenerationError { RowIndex = -1, Message = ex.Message });
            _logger.LogError(ex, "Bulk generation job {JobId} failed", job.Id);
        }

        if (errors.Count > 0)
        {
            job.ErrorsJson = JsonSerializer.Serialize(errors);
        }

        return job;
    }

    /// <summary>
    /// Parse CSV data and map columns to variable definitions.
    /// </summary>
    public List<Dictionary<string, object>> ParseCsvData(
        Stream csvStream,
        List<VariableDefinition> definitions,
        Dictionary<string, string>? columnMappings = null
    )
    {
        var result = new List<Dictionary<string, object>>();

        using var reader = new StreamReader(csvStream);
        using var csv = new CsvReader(
            reader,
            new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
            }
        );

        csv.Read();
        csv.ReadHeader();

        var headers = csv.HeaderRecord ?? [];
        var mappings = BuildColumnMappings(headers, definitions, columnMappings);

        while (csv.Read())
        {
            var record = new Dictionary<string, object>();

            foreach (var mapping in mappings)
            {
                var value = csv.GetField(mapping.ColumnIndex);
                var converted = ConvertValue(value, mapping.Definition);
                record[mapping.Definition.Name] = converted;
            }

            result.Add(record);
        }

        return result;
    }

    /// <summary>
    /// Parse Excel data and map columns to variable definitions.
    /// </summary>
    public List<Dictionary<string, object>> ParseExcelData(
        Stream excelStream,
        List<VariableDefinition> definitions,
        string? worksheetName = null,
        Dictionary<string, string>? columnMappings = null
    )
    {
        var result = new List<Dictionary<string, object>>();

        using var package = new ExcelPackage(excelStream);
        var worksheet =
            worksheetName != null
                ? package.Workbook.Worksheets[worksheetName]
                : package.Workbook.Worksheets.FirstOrDefault();

        if (worksheet?.Dimension == null)
            return result;

        var startRow = worksheet.Dimension.Start.Row;
        var endRow = worksheet.Dimension.End.Row;
        var startCol = worksheet.Dimension.Start.Column;
        var endCol = worksheet.Dimension.End.Column;

        // Get headers from first row
        var headers = new List<string>();
        for (int col = startCol; col <= endCol; col++)
        {
            headers.Add(worksheet.Cells[startRow, col].Text ?? $"Column{col}");
        }

        var mappings = BuildColumnMappings([.. headers], definitions, columnMappings);

        // Read data rows
        for (int row = startRow + 1; row <= endRow; row++)
        {
            var record = new Dictionary<string, object>();

            foreach (var mapping in mappings)
            {
                var cell = worksheet.Cells[row, mapping.ColumnIndex + startCol];
                var value = cell.Value?.ToString() ?? string.Empty;
                var converted = ConvertValue(value, mapping.Definition);
                record[mapping.Definition.Name] = converted;
            }

            result.Add(record);
        }

        return result;
    }

    /// <summary>
    /// Get the output ZIP file for a completed job.
    /// </summary>
    public Stream? GetJobOutput(BulkGenerationJob job)
    {
        if (string.IsNullOrEmpty(job.OutputPath) || !File.Exists(job.OutputPath))
            return null;

        return File.OpenRead(job.OutputPath);
    }

    /// <summary>
    /// Clean up job files.
    /// </summary>
    public void CleanupJob(BulkGenerationJob job)
    {
        var jobDir = GetJobDirectory(job.Id);
        if (Directory.Exists(jobDir))
        {
            try
            {
                Directory.Delete(jobDir, recursive: true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup job directory {JobDir}", jobDir);
            }
        }
    }

    #region Private Methods

    private string GetJobDirectory(int jobId)
    {
        return Path.Combine(_outputDirectory, $"job-{jobId}");
    }

    private async Task<List<Dictionary<string, object>>> ParseDataSourceAsync(BulkGenerationJob job)
    {
        var jobDir = GetJobDirectory(job.Id);

        var csvPath = Path.Combine(jobDir, "data.csv");
        if (File.Exists(csvPath))
        {
            using var stream = File.OpenRead(csvPath);
            var document = await _context.Documents.FindAsync(job.DocumentId);
            var definitions = VariableService.GetVariableDefinitions(document!.Content);
            return ParseCsvData(stream, definitions);
        }

        var xlsxPath = Path.Combine(jobDir, "data.xlsx");
        if (File.Exists(xlsxPath))
        {
            using var stream = File.OpenRead(xlsxPath);
            var document = await _context.Documents.FindAsync(job.DocumentId);
            var definitions = VariableService.GetVariableDefinitions(document!.Content);
            return ParseExcelData(stream, definitions);
        }

        throw new InvalidOperationException("No data source found for job.");
    }

    private static Dictionary<string, string> ConvertRecordToVariables(
        Dictionary<string, object> record,
        List<VariableDefinition> definitions
    )
    {
        var result = new Dictionary<string, string>();

        foreach (var kvp in record)
        {
            result[kvp.Key] = kvp.Value?.ToString() ?? string.Empty;
        }

        // Add defaults for missing variables
        foreach (var def in definitions)
        {
            if (!result.ContainsKey(def.Name) && !string.IsNullOrEmpty(def.DefaultValue))
            {
                result[def.Name] = def.DefaultValue;
            }
        }

        return result;
    }

    private static string GetPdfFileName(Dictionary<string, string> variables, int index)
    {
        // Try common naming variables
        string[] namingVariables =
        [
            "pdfFileName",
            "fileName",
            "name",
            "id",
            "policyNumber",
            "invoiceNumber",
        ];

        foreach (var varName in namingVariables)
        {
            if (variables.TryGetValue(varName, out var value) && !string.IsNullOrEmpty(value))
            {
                // Sanitize filename
                var sanitized = SanitizeFileName(value);
                if (!string.IsNullOrEmpty(sanitized))
                    return $"{sanitized}.pdf";
            }
        }

        return $"document-{index + 1:D4}.pdf";
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new StringBuilder();

        foreach (var c in fileName)
        {
            if (!invalid.Contains(c))
                sanitized.Append(c);
            else
                sanitized.Append('_');
        }

        return sanitized.ToString().Trim();
    }

    private static List<ColumnMapping> BuildColumnMappings(
        string[] headers,
        List<VariableDefinition> definitions,
        Dictionary<string, string>? customMappings
    )
    {
        var mappings = new List<ColumnMapping>();

        foreach (var definition in definitions)
        {
            int columnIndex = -1;

            // Check custom mapping first
            if (
                customMappings != null
                && customMappings.TryGetValue(definition.Name, out var columnName)
            )
            {
                columnIndex = Array.FindIndex(
                    headers,
                    h => h.Equals(columnName, StringComparison.OrdinalIgnoreCase)
                );
            }

            // Try exact match
            if (columnIndex == -1)
            {
                columnIndex = Array.FindIndex(
                    headers,
                    h => h.Equals(definition.Name, StringComparison.OrdinalIgnoreCase)
                );
            }

            // Try label match
            if (columnIndex == -1 && !string.IsNullOrEmpty(definition.Label))
            {
                columnIndex = Array.FindIndex(
                    headers,
                    h => h.Equals(definition.Label, StringComparison.OrdinalIgnoreCase)
                );
            }

            // Try fuzzy match (remove spaces, underscores, case-insensitive)
            if (columnIndex == -1)
            {
                var normalizedName = NormalizeName(definition.Name);
                columnIndex = Array.FindIndex(headers, h => NormalizeName(h) == normalizedName);
            }

            if (columnIndex != -1)
            {
                mappings.Add(
                    new ColumnMapping { ColumnIndex = columnIndex, Definition = definition }
                );
            }
        }

        return mappings;
    }

    private static string NormalizeName(string name)
    {
        return name.Replace(" ", "").Replace("_", "").Replace("-", "").ToLowerInvariant();
    }

    private static object ConvertValue(string? value, VariableDefinition definition)
    {
        if (string.IsNullOrEmpty(value))
            return definition.DefaultValue ?? string.Empty;

        return definition.Type.ToLowerInvariant() switch
        {
            "number" when double.TryParse(value, out var num) => num,
            "boolean" when bool.TryParse(value, out var b) => b,
            "boolean" when value is "1" or "yes" or "Yes" or "YES" => true,
            "boolean" when value is "0" or "no" or "No" or "NO" => false,
            "date" when DateTime.TryParse(value, out var date) => date.ToString("O"),
            "currency" when decimal.TryParse(value, out var amount) => amount,
            _ => value,
        };
    }

    private static void CreateZipArchive(List<string> files, string zipPath)
    {
        using var zip = ZipFile.Open(zipPath, ZipArchiveMode.Create);
        foreach (var file in files)
        {
            var entryName = Path.GetFileName(file);
            zip.CreateEntryFromFile(
                file,
                entryName,
                System.IO.Compression.CompressionLevel.Optimal
            );
        }
    }

    private static string ComputeHash(byte[] data)
    {
        var hash = SHA256.HashData(data);
        return Convert.ToHexString(hash);
    }

    #endregion

    #region Helper Classes

    private class ColumnMapping
    {
        public int ColumnIndex { get; set; }
        public VariableDefinition Definition { get; set; } = null!;
    }

    #endregion
}

/// <summary>
/// Error details for a failed row in bulk generation.
/// </summary>
public class BulkGenerationError
{
    public int RowIndex { get; set; }
    public string Message { get; set; } = string.Empty;
}
