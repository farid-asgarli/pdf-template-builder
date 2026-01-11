using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Data;
using PdfBuilder.Api.DTOs;
using PdfBuilder.Api.Models;
using PdfBuilder.Api.Services;

namespace PdfBuilder.Api.Controllers;

[ApiController]
[Route("api/templates")]
public class TemplatesController : ControllerBase
{
    private readonly AppDbContext _db;

    public TemplatesController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/templates - List all templates (user-created only, not built-in)
    [HttpGet]
    public async Task<IResult> GetTemplates()
    {
        var templates = await _db
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

    // GET /api/templates/{id} - Get single template
    [HttpGet("{id:guid}")]
    public async Task<IResult> GetTemplate(Guid id)
    {
        var template = await _db.Templates.FindAsync(id);
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

    // POST /api/templates - Create new template
    [HttpPost]
    public async Task<IResult> CreateTemplate(CreateTemplateRequest request)
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

        _db.Templates.Add(template);
        await _db.SaveChangesAsync();

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

    // PUT /api/templates/{id} - Update template
    [HttpPut("{id:guid}")]
    public async Task<IResult> UpdateTemplate(Guid id, UpdateTemplateRequest request)
    {
        var template = await _db.Templates.FindAsync(id);
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

        await _db.SaveChangesAsync();

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

    // DELETE /api/templates/{id} - Delete template
    [HttpDelete("{id:guid}")]
    public async Task<IResult> DeleteTemplate(Guid id)
    {
        var template = await _db.Templates.FindAsync(id);
        if (template == null)
            return Results.NotFound(new { error = "Template not found" });

        // Prevent deleting built-in templates
        if (template.IsBuiltIn)
            return Results.BadRequest(new { error = "Cannot delete built-in templates" });

        _db.Templates.Remove(template);
        await _db.SaveChangesAsync();

        return Results.NoContent();
    }

    // GET /api/templates/{id}/variables - Get variable definitions for a template
    [HttpGet("{id:guid}/variables")]
    public async Task<IResult> GetTemplateVariables(Guid id)
    {
        var template = await _db.Templates.FindAsync(id);
        if (template == null)
            return Results.NotFound(new { error = "Template not found" });

        var definitions = VariableService.GetVariableDefinitions(template.Content);

        var response = new VariableDefinitionsResponse(
            template.Id,
            VariableService.ToDtos(definitions)
        );

        return Results.Ok(response);
    }

    // GET /api/templates/{id}/variables/analyze - Analyze variables in a template
    [HttpGet("{id:guid}/variables/analyze")]
    public async Task<IResult> AnalyzeTemplateVariables(Guid id)
    {
        var template = await _db.Templates.FindAsync(id);
        if (template == null)
            return Results.NotFound(new { error = "Template not found" });

        var analysis = VariableService.AnalyzeVariables(template.Content);
        return Results.Ok(analysis);
    }

    // POST /api/templates/{id}/validate-variables - Validate variables without generating PDF
    [HttpPost("{id:guid}/validate-variables")]
    public async Task<IResult> ValidateTemplateVariables(
        Guid id,
        GeneratePdfWithVariablesRequest request
    )
    {
        var template = await _db.Templates.FindAsync(id);
        if (template == null)
            return Results.NotFound(new { error = "Template not found" });

        var definitions = VariableService.GetVariableDefinitions(template.Content);
        var validationResult = VariableService.ValidateVariables(definitions, request.Variables);

        return Results.Ok(validationResult);
    }

    // POST /api/templates/{id}/generate-pdf - Generate PDF from template with variables
    [HttpPost("{id:guid}/generate-pdf")]
    public async Task<IResult> GeneratePdfFromTemplate(
        Guid id,
        GeneratePdfWithVariablesRequest? request
    )
    {
        var template = await _db.Templates.FindAsync(id);
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
}
