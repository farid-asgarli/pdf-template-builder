using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Data;
using PdfBuilder.Api.DTOs;
using PdfBuilder.Api.Models;
using PdfBuilder.Api.Services;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Configure QuestPDF license
QuestPDF.Settings.License = LicenseType.Community;

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:3000", "http://localhost:3001")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});

// Add PostgreSQL database context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Add BulkGenerationService
builder.Services.AddScoped<BulkGenerationService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

// ========================
// Document CRUD Endpoints
// ========================

// GET /api/documents - List all documents
app.MapGet(
        "/api/documents",
        async (AppDbContext db) =>
        {
            var documents = await db
                .Documents.OrderByDescending(d => d.UpdatedAt)
                .Select(d => new DocumentResponse(
                    d.Id,
                    d.Title,
                    d.Content,
                    d.CreatedAt,
                    d.UpdatedAt
                ))
                .ToListAsync();
            return Results.Ok(documents);
        }
    )
    .WithName("GetDocuments")
    .WithOpenApi();

// GET /api/documents/{id} - Get single document
app.MapGet(
        "/api/documents/{id:guid}",
        async (Guid id, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            return Results.Ok(
                new DocumentResponse(
                    document.Id,
                    document.Title,
                    document.Content,
                    document.CreatedAt,
                    document.UpdatedAt
                )
            );
        }
    )
    .WithName("GetDocument")
    .WithOpenApi();

// POST /api/documents - Create new document
app.MapPost(
        "/api/documents",
        async (CreateDocumentRequest request, AppDbContext db) =>
        {
            var document = new Document
            {
                Title = request.Title,
                Content = request.Content ?? "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            db.Documents.Add(document);
            await db.SaveChangesAsync();

            var response = new DocumentResponse(
                document.Id,
                document.Title,
                document.Content,
                document.CreatedAt,
                document.UpdatedAt
            );

            return Results.Created($"/api/documents/{document.Id}", response);
        }
    )
    .WithName("CreateDocument")
    .WithOpenApi();

// PUT /api/documents/{id} - Update document
app.MapPut(
        "/api/documents/{id:guid}",
        async (Guid id, UpdateDocumentRequest request, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            if (request.Title != null)
                document.Title = request.Title;

            if (request.Content != null)
                document.Content = request.Content;

            document.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(
                new DocumentResponse(
                    document.Id,
                    document.Title,
                    document.Content,
                    document.CreatedAt,
                    document.UpdatedAt
                )
            );
        }
    )
    .WithName("UpdateDocument")
    .WithOpenApi();

// DELETE /api/documents/{id} - Delete document
app.MapDelete(
        "/api/documents/{id:guid}",
        async (Guid id, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            db.Documents.Remove(document);
            await db.SaveChangesAsync();

            return Results.NoContent();
        }
    )
    .WithName("DeleteDocument")
    .WithOpenApi();

// ========================
// PDF Generation Endpoints
// ========================

// POST /api/documents/{id}/generate-pdf - Generate PDF from document with optional runtime variables
app.MapPost(
        "/api/documents/{id:guid}/generate-pdf",
        async (Guid id, GeneratePdfWithVariablesRequest? request, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            try
            {
                // Get variable definitions for validation
                var definitions = VariableService.GetVariableDefinitions(document.Content);

                // Validate provided variables
                if (definitions.Count > 0)
                {
                    var validationResult = VariableService.ValidateVariables(
                        definitions,
                        request?.Variables
                    );

                    if (!validationResult.IsValid)
                    {
                        return Results.BadRequest(
                            new
                            {
                                error = "Variable validation failed",
                                validationErrors = validationResult.Errors,
                            }
                        );
                    }
                }

                // Generate PDF with runtime variables
                var pdfBytes = PdfGenerator.Generate(document.Content, null, request?.Variables);

                // Save to history if requested
                if (request?.SaveToHistory == true)
                {
                    // Extract processed variables for history
                    var mergedVars = VariableService.MergeVariables(
                        definitions,
                        new Dictionary<string, string>(),
                        request.Variables
                    );
                    var complexVars = VariableService.ExtractComplexVariables(request.Variables);

                    // Get next version number
                    var lastVersion =
                        await db
                            .VariableHistories.Where(h => h.DocumentId == id)
                            .MaxAsync(h => (int?)h.Version) ?? 0;

                    var history = VariableService.CreateHistoryRecord(
                        id,
                        mergedVars,
                        complexVars,
                        request.GeneratedBy,
                        request.Notes
                    );
                    history.Version = lastVersion + 1;
                    history.PdfSizeBytes = pdfBytes.Length;
                    history.PdfHash = Convert.ToHexString(
                        System.Security.Cryptography.SHA256.HashData(pdfBytes)
                    );

                    db.VariableHistories.Add(history);
                    await db.SaveChangesAsync();
                }

                return Results.File(pdfBytes, "application/pdf", $"{document.Title}.pdf");
            }
            catch (Exception ex)
            {
                return Results.Problem($"Error generating PDF: {ex.Message}");
            }
        }
    )
    .WithName("GeneratePdf")
    .WithOpenApi();

// GET /api/documents/{id}/variables - Get variable definitions for a document
app.MapGet(
        "/api/documents/{id:guid}/variables",
        async (Guid id, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            var definitions = VariableService.GetVariableDefinitions(document.Content);

            var response = new VariableDefinitionsResponse(
                document.Id,
                VariableService.ToDtos(definitions)
            );

            return Results.Ok(response);
        }
    )
    .WithName("GetDocumentVariables")
    .WithOpenApi();

// GET /api/documents/{id}/variables/analyze - Analyze variables and detect placeholders
app.MapGet(
        "/api/documents/{id:guid}/variables/analyze",
        async (Guid id, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            var analysis = VariableService.AnalyzeVariables(document.Content);
            return Results.Ok(analysis);
        }
    )
    .WithName("AnalyzeDocumentVariables")
    .WithOpenApi();

// POST /api/documents/{id}/validate-variables - Validate variables without generating PDF
app.MapPost(
        "/api/documents/{id:guid}/validate-variables",
        async (Guid id, GeneratePdfWithVariablesRequest request, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            var definitions = VariableService.GetVariableDefinitions(document.Content);
            var validationResult = VariableService.ValidateVariables(
                definitions,
                request.Variables
            );

            return Results.Ok(validationResult);
        }
    )
    .WithName("ValidateDocumentVariables")
    .WithOpenApi();

// ========================
// Variable History Endpoints
// ========================

// GET /api/documents/{id}/history - Get variable history for a document
app.MapGet(
        "/api/documents/{id:guid}/history",
        async (Guid id, AppDbContext db, int? page, int? pageSize) =>
        {
            var document = await db.Documents.FindAsync(id);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            var query = db
                .VariableHistories.Where(h => h.DocumentId == id)
                .OrderByDescending(h => h.Version);

            var totalCount = await query.CountAsync();

            // Use page/pageSize pagination (page is 1-indexed)
            var currentPage = page ?? 1;
            var size = pageSize ?? 20;
            var skip = (currentPage - 1) * size;

            var histories = await query.Skip(skip).Take(size).ToListAsync();

            var records = histories.Select(h =>
            {
                var variables = new Dictionary<string, object>();
                try
                {
                    variables =
                        System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
                            h.VariablesJson
                        ) ?? [];
                }
                catch { }

                return new VariableHistoryResponse(
                    h.Id,
                    h.DocumentId,
                    h.Version,
                    h.CreatedAt,
                    h.GeneratedBy,
                    h.Notes,
                    h.PdfHash,
                    h.PdfSizeBytes,
                    variables
                );
            });

            return Results.Ok(new { records, totalCount });
        }
    )
    .WithName("GetDocumentVariableHistory")
    .WithOpenApi();

// GET /api/documents/{id}/history/{version} - Get specific history version
app.MapGet(
        "/api/documents/{documentId:guid}/history/{version:int}",
        async (Guid documentId, int version, AppDbContext db) =>
        {
            var history = await db.VariableHistories.FirstOrDefaultAsync(h =>
                h.DocumentId == documentId && h.Version == version
            );

            if (history == null)
                return Results.NotFound(new { error = "History version not found" });

            var variables = new Dictionary<string, object>();
            try
            {
                variables =
                    System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
                        history.VariablesJson
                    ) ?? [];
            }
            catch { }

            return Results.Ok(
                new VariableHistoryResponse(
                    history.Id,
                    history.DocumentId,
                    history.Version,
                    history.CreatedAt,
                    history.GeneratedBy,
                    history.Notes,
                    history.PdfHash,
                    history.PdfSizeBytes,
                    variables
                )
            );
        }
    )
    .WithName("GetDocumentVariableHistoryVersion")
    .WithOpenApi();

// POST /api/documents/{id}/history/{version}/regenerate - Regenerate PDF from history
app.MapPost(
        "/api/documents/{documentId:guid}/history/{version:int}/regenerate",
        async (Guid documentId, int version, AppDbContext db) =>
        {
            var document = await db.Documents.FindAsync(documentId);
            if (document == null)
                return Results.NotFound(new { error = "Document not found" });

            var history = await db.VariableHistories.FirstOrDefaultAsync(h =>
                h.DocumentId == documentId && h.Version == version
            );

            if (history == null)
                return Results.NotFound(new { error = "History version not found" });

            try
            {
                // Parse variables from history
                var (simpleVars, complexVars) = VariableService.ParseHistoryVariables(history);

                // Convert to the format expected by PdfGenerator
                var runtimeVariables = new Dictionary<string, object>();
                foreach (var kvp in simpleVars)
                    runtimeVariables[kvp.Key] = kvp.Value;
                foreach (var kvp in complexVars)
                    runtimeVariables[kvp.Key] = kvp.Value;

                var pdfBytes = PdfGenerator.Generate(document.Content, null, runtimeVariables);
                return Results.File(
                    pdfBytes,
                    "application/pdf",
                    $"{document.Title}-v{version}.pdf"
                );
            }
            catch (Exception ex)
            {
                return Results.Problem($"Error regenerating PDF: {ex.Message}");
            }
        }
    )
    .WithName("RegeneratePdfFromHistory")
    .WithOpenApi();

// DELETE /api/documents/{id}/history/{version} - Delete specific history version
app.MapDelete(
        "/api/documents/{documentId:guid}/history/{version:int}",
        async (Guid documentId, int version, AppDbContext db) =>
        {
            var history = await db.VariableHistories.FirstOrDefaultAsync(h =>
                h.DocumentId == documentId && h.Version == version
            );

            if (history == null)
                return Results.NotFound(new { error = "History version not found" });

            db.VariableHistories.Remove(history);
            await db.SaveChangesAsync();

            return Results.NoContent();
        }
    )
    .WithName("DeleteDocumentVariableHistory")
    .WithOpenApi();

// POST /api/generate-pdf-preview - Generate PDF from JSON content (for previews without saving)
app.MapPost(
        "/api/generate-pdf-preview",
        (GeneratePdfRequest request) =>
        {
            try
            {
                var pdfBytes = PdfGenerator.Generate(request.Content);
                return Results.File(pdfBytes, "application/pdf", "preview.pdf");
            }
            catch (Exception ex)
            {
                return Results.Problem($"Error generating PDF: {ex.Message}");
            }
        }
    )
    .WithName("GeneratePdfPreview")
    .WithOpenApi();

// GET /api/test-pdf - Generate simple test PDF
app.MapGet(
        "/api/test-pdf",
        () =>
        {
            var pdfBytes = PdfGenerator.GenerateSimple();
            return Results.File(pdfBytes, "application/pdf", "test.pdf");
        }
    )
    .WithName("TestPdf")
    .WithOpenApi();

// ========================
// Bulk Generation Endpoints
// ========================

// In-memory job storage (in production, use database)
var bulkJobs = new Dictionary<int, PdfBuilder.Api.Models.BulkGenerationJob>();
var jobIdCounter = 0;

// POST /api/documents/{id}/bulk-generate - Create bulk generation job from CSV/Excel
app.MapPost(
        "/api/documents/{id:guid}/bulk-generate",
        async (
            Guid id,
            IFormFile file,
            AppDbContext db,
            BulkGenerationService bulkService,
            HttpContext httpContext
        ) =>
        {
            var document = await db.Documents.FindAsync(id);
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
                var jobId = Interlocked.Increment(ref jobIdCounter);

                PdfBuilder.Api.Models.BulkGenerationJob job;
                if (extension == ".csv")
                {
                    job = await bulkService.CreateJobFromCsvAsync(id, stream, file.FileName);
                }
                else
                {
                    job = await bulkService.CreateJobFromExcelAsync(id, stream, file.FileName);
                }

                job.Id = jobId;
                bulkJobs[jobId] = job;

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
    )
    .DisableAntiforgery()
    .WithName("CreateBulkGenerationJob")
    .WithOpenApi();

// POST /api/bulk-jobs/{jobId}/start - Start processing a bulk generation job
app.MapPost(
        "/api/bulk-jobs/{jobId:int}/start",
        (int jobId, BulkGenerationService bulkService) =>
        {
            if (!bulkJobs.TryGetValue(jobId, out var job))
                return Results.NotFound(new { error = "Job not found" });

            if (job.Status != "pending")
                return Results.BadRequest(new { error = $"Job is already {job.Status}" });

            // Process job asynchronously in background
            _ = Task.Run(async () =>
            {
                await bulkService.ProcessJobAsync(job);
            });

            return Results.Ok(new { message = "Job started", jobId });
        }
    )
    .WithName("StartBulkGenerationJob")
    .WithOpenApi();

// GET /api/bulk-jobs/{jobId} - Get job status
app.MapGet(
        "/api/bulk-jobs/{jobId:int}",
        (int jobId) =>
        {
            if (!bulkJobs.TryGetValue(jobId, out var job))
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
    )
    .WithName("GetBulkGenerationJob")
    .WithOpenApi();

// GET /api/bulk-jobs/{jobId}/download - Download generated PDFs as ZIP
app.MapGet(
        "/api/bulk-jobs/{jobId:int}/download",
        (int jobId, BulkGenerationService bulkService) =>
        {
            if (!bulkJobs.TryGetValue(jobId, out var job))
                return Results.NotFound(new { error = "Job not found" });

            if (job.Status != "completed")
                return Results.BadRequest(
                    new { error = $"Job is not completed. Status: {job.Status}" }
                );

            var stream = bulkService.GetJobOutput(job);
            if (stream == null)
                return Results.NotFound(new { error = "Output file not found" });

            return Results.File(stream, "application/zip", $"bulk-{jobId}.zip");
        }
    )
    .WithName("DownloadBulkGenerationOutput")
    .WithOpenApi();

// DELETE /api/bulk-jobs/{jobId} - Delete job and cleanup files
app.MapDelete(
        "/api/bulk-jobs/{jobId:int}",
        (int jobId, BulkGenerationService bulkService) =>
        {
            if (!bulkJobs.TryGetValue(jobId, out var job))
                return Results.NotFound(new { error = "Job not found" });

            bulkService.CleanupJob(job);
            bulkJobs.Remove(jobId);

            return Results.Ok(new { message = "Job deleted" });
        }
    )
    .WithName("DeleteBulkGenerationJob")
    .WithOpenApi();

// ========================
// Template CRUD Endpoints
// ========================

// GET /api/templates - List all templates (user-created only, not built-in)
app.MapGet(
        "/api/templates",
        async (AppDbContext db) =>
        {
            var templates = await db
                .Templates.OrderByDescending(t => t.UpdatedAt)
                .Select(t => new TemplateResponse(
                    t.Id,
                    t.Name,
                    t.Description,
                    t.Category,
                    t.Content,
                    t.IsBuiltIn,
                    t.CreatedAt,
                    t.UpdatedAt
                ))
                .ToListAsync();
            return Results.Ok(templates);
        }
    )
    .WithName("GetTemplates")
    .WithOpenApi();

// GET /api/templates/{id} - Get single template
app.MapGet(
        "/api/templates/{id:guid}",
        async (Guid id, AppDbContext db) =>
        {
            var template = await db.Templates.FindAsync(id);
            if (template == null)
                return Results.NotFound(new { error = "Template not found" });

            return Results.Ok(
                new TemplateResponse(
                    template.Id,
                    template.Name,
                    template.Description,
                    template.Category,
                    template.Content,
                    template.IsBuiltIn,
                    template.CreatedAt,
                    template.UpdatedAt
                )
            );
        }
    )
    .WithName("GetTemplate")
    .WithOpenApi();

// POST /api/templates - Create new template
app.MapPost(
        "/api/templates",
        async (CreateTemplateRequest request, AppDbContext db) =>
        {
            var template = new Template
            {
                Name = request.Name,
                Description = request.Description,
                Category = request.Category,
                Content = request.Content,
                IsBuiltIn = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            db.Templates.Add(template);
            await db.SaveChangesAsync();

            var response = new TemplateResponse(
                template.Id,
                template.Name,
                template.Description,
                template.Category,
                template.Content,
                template.IsBuiltIn,
                template.CreatedAt,
                template.UpdatedAt
            );

            return Results.Created($"/api/templates/{template.Id}", response);
        }
    )
    .WithName("CreateTemplate")
    .WithOpenApi();

// PUT /api/templates/{id} - Update template
app.MapPut(
        "/api/templates/{id:guid}",
        async (Guid id, UpdateTemplateRequest request, AppDbContext db) =>
        {
            var template = await db.Templates.FindAsync(id);
            if (template == null)
                return Results.NotFound(new { error = "Template not found" });

            // Prevent editing built-in templates
            if (template.IsBuiltIn)
                return Results.BadRequest(new { error = "Cannot modify built-in templates" });

            if (request.Name != null)
                template.Name = request.Name;

            if (request.Description != null)
                template.Description = request.Description;

            if (request.Category != null)
                template.Category = request.Category;

            if (request.Content != null)
                template.Content = request.Content;

            template.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(
                new TemplateResponse(
                    template.Id,
                    template.Name,
                    template.Description,
                    template.Category,
                    template.Content,
                    template.IsBuiltIn,
                    template.CreatedAt,
                    template.UpdatedAt
                )
            );
        }
    )
    .WithName("UpdateTemplate")
    .WithOpenApi();

// DELETE /api/templates/{id} - Delete template
app.MapDelete(
        "/api/templates/{id:guid}",
        async (Guid id, AppDbContext db) =>
        {
            var template = await db.Templates.FindAsync(id);
            if (template == null)
                return Results.NotFound(new { error = "Template not found" });

            // Prevent deleting built-in templates
            if (template.IsBuiltIn)
                return Results.BadRequest(new { error = "Cannot delete built-in templates" });

            db.Templates.Remove(template);
            await db.SaveChangesAsync();

            return Results.NoContent();
        }
    )
    .WithName("DeleteTemplate")
    .WithOpenApi();

// GET /api/templates/{id}/variables - Get variable definitions for a template
app.MapGet(
        "/api/templates/{id:guid}/variables",
        async (Guid id, AppDbContext db) =>
        {
            var template = await db.Templates.FindAsync(id);
            if (template == null)
                return Results.NotFound(new { error = "Template not found" });

            var definitions = VariableService.GetVariableDefinitions(template.Content);

            var response = new VariableDefinitionsResponse(
                template.Id,
                VariableService.ToDtos(definitions)
            );

            return Results.Ok(response);
        }
    )
    .WithName("GetTemplateVariables")
    .WithOpenApi();

// GET /api/templates/{id}/variables/analyze - Analyze variables in a template
app.MapGet(
        "/api/templates/{id:guid}/variables/analyze",
        async (Guid id, AppDbContext db) =>
        {
            var template = await db.Templates.FindAsync(id);
            if (template == null)
                return Results.NotFound(new { error = "Template not found" });

            var analysis = VariableService.AnalyzeVariables(template.Content);
            return Results.Ok(analysis);
        }
    )
    .WithName("AnalyzeTemplateVariables")
    .WithOpenApi();

// POST /api/templates/{id}/validate-variables - Validate variables without generating PDF
app.MapPost(
        "/api/templates/{id:guid}/validate-variables",
        async (Guid id, GeneratePdfWithVariablesRequest request, AppDbContext db) =>
        {
            var template = await db.Templates.FindAsync(id);
            if (template == null)
                return Results.NotFound(new { error = "Template not found" });

            var definitions = VariableService.GetVariableDefinitions(template.Content);
            var validationResult = VariableService.ValidateVariables(
                definitions,
                request.Variables
            );

            return Results.Ok(validationResult);
        }
    )
    .WithName("ValidateTemplateVariables")
    .WithOpenApi();

// POST /api/templates/{id}/generate-pdf - Generate PDF from template with variables
app.MapPost(
        "/api/templates/{id:guid}/generate-pdf",
        async (Guid id, GeneratePdfWithVariablesRequest? request, AppDbContext db) =>
        {
            var template = await db.Templates.FindAsync(id);
            if (template == null)
                return Results.NotFound(new { error = "Template not found" });

            try
            {
                // Get variable definitions for validation
                var definitions = VariableService.GetVariableDefinitions(template.Content);

                // Validate provided variables
                if (definitions.Count > 0)
                {
                    var validationResult = VariableService.ValidateVariables(
                        definitions,
                        request?.Variables
                    );

                    if (!validationResult.IsValid)
                    {
                        return Results.BadRequest(
                            new
                            {
                                error = "Variable validation failed",
                                validationErrors = validationResult.Errors,
                            }
                        );
                    }
                }

                // Generate PDF with runtime variables
                var pdfBytes = PdfGenerator.Generate(template.Content, null, request?.Variables);
                return Results.File(pdfBytes, "application/pdf", $"{template.Name}.pdf");
            }
            catch (Exception ex)
            {
                return Results.Problem($"Error generating PDF: {ex.Message}");
            }
        }
    )
    .WithName("GeneratePdfFromTemplate")
    .WithOpenApi();

// POST /api/documents/from-template - Create document from template
app.MapPost(
        "/api/documents/from-template",
        async (CreateDocumentFromTemplateRequest request, AppDbContext db) =>
        {
            string content;

            // Check if it's a user-created template (GUID format)
            if (Guid.TryParse(request.TemplateId, out var templateId))
            {
                var template = await db.Templates.FindAsync(templateId);
                if (template == null)
                    return Results.NotFound(new { error = "Template not found" });
                content = template.Content;
            }
            else
            {
                // It's a built-in template ID (string like "auto-insurance-basic")
                // The frontend will handle built-in templates by sending the content directly
                content = "{}";
            }

            var document = new Document
            {
                Title = request.Title,
                Content = content,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            db.Documents.Add(document);
            await db.SaveChangesAsync();

            var response = new DocumentResponse(
                document.Id,
                document.Title,
                document.Content,
                document.CreatedAt,
                document.UpdatedAt
            );

            return Results.Created($"/api/documents/{document.Id}", response);
        }
    )
    .WithName("CreateDocumentFromTemplate")
    .WithOpenApi();

app.Run();

// Additional DTOs
public record GeneratePdfRequest(string Content);
