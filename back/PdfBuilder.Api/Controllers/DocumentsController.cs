using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Data;
using PdfBuilder.Api.DTOs;
using PdfBuilder.Api.Models;
using PdfBuilder.Api.Services;

namespace PdfBuilder.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DocumentsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/documents - List all documents
    [HttpGet]
    public async Task<IResult> GetDocuments()
    {
        var documents = await _db
            .Documents.OrderByDescending(d => d.UpdatedAt)
            .Select(d => new DocumentResponse(d.Id, d.Title, d.Content, d.CreatedAt, d.UpdatedAt))
            .ToListAsync();
        return Results.Ok(documents);
    }

    // GET /api/documents/{id} - Get single document
    [HttpGet("{id:guid}")]
    public async Task<IResult> GetDocument(Guid id)
    {
        var document = await _db.Documents.FindAsync(id);
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

    // POST /api/documents - Create new document
    [HttpPost]
    public async Task<IResult> CreateDocument(CreateDocumentRequest request)
    {
        var document = new Document
        {
            Title = request.Title,
            Content = request.Content ?? "{}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Documents.Add(document);
        await _db.SaveChangesAsync();

        var response = new DocumentResponse(
            document.Id,
            document.Title,
            document.Content,
            document.CreatedAt,
            document.UpdatedAt
        );

        return Results.Created($"/api/documents/{document.Id}", response);
    }

    // PUT /api/documents/{id} - Update document
    [HttpPut("{id:guid}")]
    public async Task<IResult> UpdateDocument(Guid id, UpdateDocumentRequest request)
    {
        var document = await _db.Documents.FindAsync(id);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        if (request.Title != null)
            document.Title = request.Title;

        if (request.Content != null)
            document.Content = request.Content;

        document.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

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

    // DELETE /api/documents/{id} - Delete document
    [HttpDelete("{id:guid}")]
    public async Task<IResult> DeleteDocument(Guid id)
    {
        var document = await _db.Documents.FindAsync(id);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        _db.Documents.Remove(document);
        await _db.SaveChangesAsync();

        return Results.NoContent();
    }

    // POST /api/documents/{id}/generate-pdf - Generate PDF from document with optional runtime variables
    [HttpPost("{id:guid}/generate-pdf")]
    public async Task<IResult> GeneratePdf(Guid id, GeneratePdfWithVariablesRequest? request)
    {
        var document = await _db.Documents.FindAsync(id);
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
                    await _db
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

                _db.VariableHistories.Add(history);
                await _db.SaveChangesAsync();
            }

            return Results.File(pdfBytes, "application/pdf", $"{document.Title}.pdf");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error generating PDF: {ex.Message}");
        }
    }

    // GET /api/documents/{id}/variables - Get variable definitions for a document
    [HttpGet("{id:guid}/variables")]
    public async Task<IResult> GetDocumentVariables(Guid id)
    {
        var document = await _db.Documents.FindAsync(id);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        var definitions = VariableService.GetVariableDefinitions(document.Content);

        var response = new VariableDefinitionsResponse(
            document.Id,
            VariableService.ToDtos(definitions)
        );

        return Results.Ok(response);
    }

    // GET /api/documents/{id}/variables/analyze - Analyze variables and detect placeholders
    [HttpGet("{id:guid}/variables/analyze")]
    public async Task<IResult> AnalyzeDocumentVariables(Guid id)
    {
        var document = await _db.Documents.FindAsync(id);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        var analysis = VariableService.AnalyzeVariables(document.Content);
        return Results.Ok(analysis);
    }

    // POST /api/documents/{id}/validate-variables - Validate variables without generating PDF
    [HttpPost("{id:guid}/validate-variables")]
    public async Task<IResult> ValidateDocumentVariables(
        Guid id,
        GeneratePdfWithVariablesRequest request
    )
    {
        var document = await _db.Documents.FindAsync(id);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        var definitions = VariableService.GetVariableDefinitions(document.Content);
        var validationResult = VariableService.ValidateVariables(definitions, request.Variables);

        return Results.Ok(validationResult);
    }

    // GET /api/documents/{id}/history - Get variable history for a document
    [HttpGet("{id:guid}/history")]
    public async Task<IResult> GetDocumentVariableHistory(Guid id, int? page, int? pageSize)
    {
        var document = await _db.Documents.FindAsync(id);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        var query = _db
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

    // GET /api/documents/{documentId}/history/{version} - Get specific history version
    [HttpGet("{documentId:guid}/history/{version:int}")]
    public async Task<IResult> GetDocumentVariableHistoryVersion(Guid documentId, int version)
    {
        var history = await _db.VariableHistories.FirstOrDefaultAsync(h =>
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

    // POST /api/documents/{documentId}/history/{version}/regenerate - Regenerate PDF from history
    [HttpPost("{documentId:guid}/history/{version:int}/regenerate")]
    public async Task<IResult> RegeneratePdfFromHistory(Guid documentId, int version)
    {
        var document = await _db.Documents.FindAsync(documentId);
        if (document == null)
            return Results.NotFound(new { error = "Document not found" });

        var history = await _db.VariableHistories.FirstOrDefaultAsync(h =>
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
            return Results.File(pdfBytes, "application/pdf", $"{document.Title}-v{version}.pdf");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error regenerating PDF: {ex.Message}");
        }
    }

    // DELETE /api/documents/{documentId}/history/{version} - Delete specific history version
    [HttpDelete("{documentId:guid}/history/{version:int}")]
    public async Task<IResult> DeleteDocumentVariableHistory(Guid documentId, int version)
    {
        var history = await _db.VariableHistories.FirstOrDefaultAsync(h =>
            h.DocumentId == documentId && h.Version == version
        );

        if (history == null)
            return Results.NotFound(new { error = "History version not found" });

        _db.VariableHistories.Remove(history);
        await _db.SaveChangesAsync();

        return Results.NoContent();
    }

    // POST /api/documents/{id}/generate-html - Generate HTML from document with optional runtime variables
    [HttpPost("{id:guid}/generate-html")]
    public async Task<IResult> GenerateHtml(Guid id, GenerateHtmlWithVariablesRequest? request)
    {
        var document = await _db.Documents.FindAsync(id);
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

            // Generate HTML with runtime variables
            var settings = new HtmlGenerationSettings
            {
                Title = document.Title,
                IncludePrintStyles = request?.IncludePrintStyles ?? true,
                InlineStyles = request?.InlineStyles ?? false,
                IncludeFontLinks = request?.IncludeFontLinks ?? true,
                AutoDetectFonts = request?.AutoDetectFonts ?? true,
            };

            // Add custom font families if provided
            if (request?.FontFamilies != null && request.FontFamilies.Count > 0)
            {
                settings.FontFamilies = request.FontFamilies;
            }

            var htmlContent = HtmlGenerator.Generate(
                document.Content,
                settings,
                request?.Variables
            );

            // Return as HTML file download or inline based on request
            if (request?.AsDownload == true)
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(htmlContent);
                return Results.File(bytes, "text/html", $"{document.Title}.html");
            }

            return Results.Content(htmlContent, "text/html");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error generating HTML: {ex.Message}");
        }
    }

    // POST /api/documents/from-template - Create document from template
    [HttpPost("from-template")]
    public async Task<IResult> CreateDocumentFromTemplate(CreateDocumentFromTemplateRequest request)
    {
        string content;

        // Check if it's a user-created template (GUID format)
        if (Guid.TryParse(request.TemplateId, out var templateId))
        {
            var template = await _db.Templates.FindAsync(templateId);
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

        _db.Documents.Add(document);
        await _db.SaveChangesAsync();

        var response = new DocumentResponse(
            document.Id,
            document.Title,
            document.Content,
            document.CreatedAt,
            document.UpdatedAt
        );

        return Results.Created($"/api/documents/{document.Id}", response);
    }
}
