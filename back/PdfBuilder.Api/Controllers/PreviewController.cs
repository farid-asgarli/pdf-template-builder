using Microsoft.AspNetCore.Mvc;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Html;
using PdfBuilder.Api.DTOs.Pdf;
using PdfBuilder.Api.Services;

namespace PdfBuilder.Api.Controllers;

/// <summary>
/// Controller for stateless PDF and HTML preview generation.
/// </summary>
[ApiController]
[Route("api")]
public class PreviewController : ControllerBase
{
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly IHtmlGenerationService _htmlGenerationService;

    public PreviewController(
        IPdfGenerationService pdfGenerationService,
        IHtmlGenerationService htmlGenerationService
    )
    {
        _pdfGenerationService = pdfGenerationService;
        _htmlGenerationService = htmlGenerationService;
    }

    /// <summary>
    /// Generate PDF preview from JSON content (without saving).
    /// </summary>
    [HttpPost("generate-pdf-preview")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult GeneratePdfPreview(GeneratePdfPreviewRequest request)
    {
        try
        {
            var pdfBytes = _pdfGenerationService.GenerateFromContent(request.Content);
            return File(pdfBytes, "application/pdf", "preview.pdf");
        }
        catch (Exception ex)
        {
            return Problem($"Error generating PDF: {ex.Message}");
        }
    }

    /// <summary>
    /// Generate a simple test PDF.
    /// </summary>
    [HttpGet("test-pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public IActionResult TestPdf()
    {
        var pdfBytes = _pdfGenerationService.GenerateTestPdf();
        return File(pdfBytes, "application/pdf", "test.pdf");
    }

    /// <summary>
    /// Generate HTML preview from JSON content (without saving).
    /// </summary>
    [HttpPost("generate-html-preview")]
    [ProducesResponseType(typeof(ContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult GenerateHtmlPreview(GenerateHtmlPreviewRequest request)
    {
        try
        {
            var settings = new HtmlGenerationSettings
            {
                Title = request.Title ?? "Preview",
                IncludePrintStyles = request.IncludePrintStyles ?? true,
                InlineStyles = request.InlineStyles ?? false,
                IncludeFontLinks = request.IncludeFontLinks ?? true,
                AutoDetectFonts = request.AutoDetectFonts ?? true,
            };

            if (request.FontFamilies is not null && request.FontFamilies.Count > 0)
            {
                settings.FontFamilies = request.FontFamilies;
            }

            var htmlContent = _htmlGenerationService.GenerateFromContent(
                request.Content,
                settings,
                request.Variables
            );
            return Content(htmlContent, "text/html");
        }
        catch (Exception ex)
        {
            return Problem($"Error generating HTML: {ex.Message}");
        }
    }
}
