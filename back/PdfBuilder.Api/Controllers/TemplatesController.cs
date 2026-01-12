using Microsoft.AspNetCore.Mvc;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Templates;
using PdfBuilder.Api.DTOs.Variables;

namespace PdfBuilder.Api.Controllers;

/// <summary>
/// Controller for template CRUD operations and PDF generation.
/// </summary>
[ApiController]
[Route("api/templates")]
public class TemplatesController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly IVariableService _variableService;

    public TemplatesController(
        ITemplateService templateService,
        IPdfGenerationService pdfGenerationService,
        IVariableService variableService)
    {
        _templateService = templateService;
        _pdfGenerationService = pdfGenerationService;
        _variableService = variableService;
    }

    /// <summary>
    /// Get all templates.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TemplateResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TemplateResponse>>> GetTemplates(CancellationToken cancellationToken)
    {
        var templates = await _templateService.GetAllAsync(cancellationToken);
        return Ok(templates);
    }

    /// <summary>
    /// Get a template by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TemplateResponse>> GetTemplate(Guid id, CancellationToken cancellationToken)
    {
        var template = await _templateService.GetByIdAsync(id, cancellationToken);
        if (template is null)
            return NotFound(new { error = "Template not found" });

        return Ok(template);
    }

    /// <summary>
    /// Create a new template.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TemplateResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TemplateResponse>> CreateTemplate(CreateTemplateRequest request, CancellationToken cancellationToken)
    {
        var template = await _templateService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, template);
    }

    /// <summary>
    /// Update a template.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TemplateResponse>> UpdateTemplate(Guid id, UpdateTemplateRequest request, CancellationToken cancellationToken)
    {
        var existingTemplate = await _templateService.GetByIdAsync(id, cancellationToken);
        if (existingTemplate is null)
            return NotFound(new { error = "Template not found" });

        if (existingTemplate.IsBuiltIn)
            return BadRequest(new { error = "Cannot modify built-in templates" });

        var template = await _templateService.UpdateAsync(id, request, cancellationToken);
        return Ok(template);
    }

    /// <summary>
    /// Delete a template.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken cancellationToken)
    {
        var template = await _templateService.GetByIdAsync(id, cancellationToken);
        if (template is null)
            return NotFound(new { error = "Template not found" });

        if (template.IsBuiltIn)
            return BadRequest(new { error = "Cannot delete built-in templates" });

        await _templateService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Generate PDF from a template.
    /// </summary>
    [HttpPost("{id:guid}/generate-pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GeneratePdf(Guid id, GeneratePdfWithVariablesRequest? request, CancellationToken cancellationToken)
    {
        var result = await _pdfGenerationService.GenerateForTemplateAsync(id, request, cancellationToken);

        if (!result.Success)
        {
            if (result.ValidationErrors is not null)
                return BadRequest(new { error = "Variable validation failed", validationErrors = result.ValidationErrors });

            return result.ErrorMessage?.Contains("not found") == true
                ? NotFound(new { error = result.ErrorMessage })
                : Problem(result.ErrorMessage);
        }

        return File(result.PdfBytes!, "application/pdf", result.FileName);
    }

    /// <summary>
    /// Get variable definitions for a template.
    /// </summary>
    [HttpGet("{id:guid}/variables")]
    [ProducesResponseType(typeof(VariableDefinitionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VariableDefinitionsResponse>> GetVariables(Guid id, CancellationToken cancellationToken)
    {
        var response = await _variableService.GetTemplateVariablesAsync(id, cancellationToken);
        if (response is null)
            return NotFound(new { error = "Template not found" });

        return Ok(response);
    }

    /// <summary>
    /// Analyze variables in a template.
    /// </summary>
    [HttpGet("{id:guid}/variables/analyze")]
    [ProducesResponseType(typeof(VariableAnalysisResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VariableAnalysisResult>> AnalyzeVariables(Guid id, CancellationToken cancellationToken)
    {
        var template = await _templateService.GetByIdAsync(id, cancellationToken);
        if (template is null)
            return NotFound(new { error = "Template not found" });

        var analysis = _variableService.AnalyzeVariables(template.Content);
        return Ok(analysis);
    }

    /// <summary>
    /// Validate variables for a template.
    /// </summary>
    [HttpPost("{id:guid}/validate-variables")]
    [ProducesResponseType(typeof(VariableValidationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VariableValidationResult>> ValidateVariables(Guid id, GeneratePdfWithVariablesRequest request, CancellationToken cancellationToken)
    {
        var template = await _templateService.GetByIdAsync(id, cancellationToken);
        if (template is null)
            return NotFound(new { error = "Template not found" });

        var definitions = _variableService.GetVariableDefinitions(template.Content);
        var result = _variableService.ValidateVariables(definitions, request.Variables);
        return Ok(result);
    }
}
