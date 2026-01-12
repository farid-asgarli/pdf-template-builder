using Microsoft.AspNetCore.Mvc;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Documents;
using PdfBuilder.Api.DTOs.Html;
using PdfBuilder.Api.DTOs.Variables;

namespace PdfBuilder.Api.Controllers;

/// <summary>
/// Controller for document CRUD operations and generation.
/// </summary>
[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly IHtmlGenerationService _htmlGenerationService;
    private readonly IVariableService _variableService;
    private readonly IVariableHistoryService _historyService;

    public DocumentsController(
        IDocumentService documentService,
        IPdfGenerationService pdfGenerationService,
        IHtmlGenerationService htmlGenerationService,
        IVariableService variableService,
        IVariableHistoryService historyService)
    {
        _documentService = documentService;
        _pdfGenerationService = pdfGenerationService;
        _htmlGenerationService = htmlGenerationService;
        _variableService = variableService;
        _historyService = historyService;
    }

    /// <summary>
    /// Get all documents.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DocumentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DocumentResponse>>> GetDocuments(CancellationToken cancellationToken)
    {
        var documents = await _documentService.GetAllAsync(cancellationToken);
        return Ok(documents);
    }

    /// <summary>
    /// Get a document by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentResponse>> GetDocument(Guid id, CancellationToken cancellationToken)
    {
        var document = await _documentService.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return NotFound(new { error = "Document not found" });

        return Ok(document);
    }

    /// <summary>
    /// Create a new document.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<DocumentResponse>> CreateDocument(CreateDocumentRequest request, CancellationToken cancellationToken)
    {
        var document = await _documentService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, document);
    }

    /// <summary>
    /// Update a document.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentResponse>> UpdateDocument(Guid id, UpdateDocumentRequest request, CancellationToken cancellationToken)
    {
        var document = await _documentService.UpdateAsync(id, request, cancellationToken);
        if (document is null)
            return NotFound(new { error = "Document not found" });

        return Ok(document);
    }

    /// <summary>
    /// Delete a document.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _documentService.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound(new { error = "Document not found" });

        return NoContent();
    }

    /// <summary>
    /// Create a document from a template.
    /// </summary>
    [HttpPost("from-template")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentResponse>> CreateFromTemplate(CreateDocumentFromTemplateRequest request, CancellationToken cancellationToken)
    {
        var document = await _documentService.CreateFromTemplateAsync(request, cancellationToken);
        if (document is null)
            return NotFound(new { error = "Template not found" });

        return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, document);
    }

    /// <summary>
    /// Generate PDF from a document.
    /// </summary>
    [HttpPost("{id:guid}/generate-pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GeneratePdf(Guid id, GeneratePdfWithVariablesRequest? request, CancellationToken cancellationToken)
    {
        var result = await _pdfGenerationService.GenerateForDocumentAsync(id, request, cancellationToken);

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
    /// Generate HTML from a document.
    /// </summary>
    [HttpPost("{id:guid}/generate-html")]
    [ProducesResponseType(typeof(ContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateHtml(Guid id, GenerateHtmlWithVariablesRequest? request, CancellationToken cancellationToken)
    {
        var result = await _htmlGenerationService.GenerateForDocumentAsync(id, request, cancellationToken);

        if (!result.Success)
        {
            if (result.ValidationErrors is not null)
                return BadRequest(new { error = "Variable validation failed", validationErrors = result.ValidationErrors });

            return result.ErrorMessage?.Contains("not found") == true
                ? NotFound(new { error = result.ErrorMessage })
                : Problem(result.ErrorMessage);
        }

        if (request?.AsDownload == true)
        {
            var bytes = System.Text.Encoding.UTF8.GetBytes(result.HtmlContent!);
            return File(bytes, "text/html", result.FileName);
        }

        return Content(result.HtmlContent!, "text/html");
    }

    /// <summary>
    /// Get variable definitions for a document.
    /// </summary>
    [HttpGet("{id:guid}/variables")]
    [ProducesResponseType(typeof(VariableDefinitionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VariableDefinitionsResponse>> GetVariables(Guid id, CancellationToken cancellationToken)
    {
        var response = await _variableService.GetDocumentVariablesAsync(id, cancellationToken);
        if (response is null)
            return NotFound(new { error = "Document not found" });

        return Ok(response);
    }

    /// <summary>
    /// Analyze variables in a document.
    /// </summary>
    [HttpGet("{id:guid}/variables/analyze")]
    [ProducesResponseType(typeof(VariableAnalysisResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VariableAnalysisResult>> AnalyzeVariables(Guid id, CancellationToken cancellationToken)
    {
        var document = await _documentService.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return NotFound(new { error = "Document not found" });

        var analysis = _variableService.AnalyzeVariables(document.Content);
        return Ok(analysis);
    }

    /// <summary>
    /// Validate variables for a document.
    /// </summary>
    [HttpPost("{id:guid}/validate-variables")]
    [ProducesResponseType(typeof(VariableValidationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VariableValidationResult>> ValidateVariables(Guid id, GeneratePdfWithVariablesRequest request, CancellationToken cancellationToken)
    {
        var document = await _documentService.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return NotFound(new { error = "Document not found" });

        var definitions = _variableService.GetVariableDefinitions(document.Content);
        var result = _variableService.ValidateVariables(definitions, request.Variables);
        return Ok(result);
    }

    /// <summary>
    /// Get variable history for a document.
    /// </summary>
    [HttpGet("{id:guid}/history")]
    [ProducesResponseType(typeof(VariableHistoryListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHistory(Guid id, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken cancellationToken)
    {
        var document = await _documentService.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return NotFound(new { error = "Document not found" });

        var history = await _historyService.GetHistoryAsync(id, page ?? 1, pageSize ?? 20, cancellationToken);
        return Ok(new { records = history.Records, totalCount = history.TotalCount });
    }

    /// <summary>
    /// Get a specific history version.
    /// </summary>
    [HttpGet("{documentId:guid}/history/{version:int}")]
    [ProducesResponseType(typeof(VariableHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VariableHistoryResponse>> GetHistoryVersion(Guid documentId, int version, CancellationToken cancellationToken)
    {
        var history = await _historyService.GetHistoryVersionAsync(documentId, version, cancellationToken);
        if (history is null)
            return NotFound(new { error = "History version not found" });

        return Ok(history);
    }

    /// <summary>
    /// Regenerate PDF from a history version.
    /// </summary>
    [HttpPost("{documentId:guid}/history/{version:int}/regenerate")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegeneratePdfFromHistory(Guid documentId, int version, CancellationToken cancellationToken)
    {
        var result = await _historyService.RegeneratePdfFromHistoryAsync(documentId, version, cancellationToken);

        if (!result.Success)
        {
            return result.ErrorMessage?.Contains("not found") == true
                ? NotFound(new { error = result.ErrorMessage })
                : Problem(result.ErrorMessage);
        }

        return File(result.PdfBytes!, "application/pdf", result.FileName);
    }

    /// <summary>
    /// Delete a specific history version.
    /// </summary>
    [HttpDelete("{documentId:guid}/history/{version:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteHistoryVersion(Guid documentId, int version, CancellationToken cancellationToken)
    {
        var deleted = await _historyService.DeleteHistoryVersionAsync(documentId, version, cancellationToken);
        if (!deleted)
            return NotFound(new { error = "History version not found" });

        return NoContent();
    }
}
