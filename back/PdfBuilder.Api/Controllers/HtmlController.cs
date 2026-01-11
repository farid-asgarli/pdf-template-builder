using Microsoft.AspNetCore.Mvc;
using PdfBuilder.Api.DTOs;
using PdfBuilder.Api.Services;

namespace PdfBuilder.Api.Controllers;

[ApiController]
[Route("api")]
public class HtmlController : ControllerBase
{
    // POST /api/generate-html-preview - Generate HTML from JSON content (for previews without saving)
    [HttpPost("generate-html-preview")]
    public IResult GenerateHtmlPreview(GenerateHtmlPreviewRequest request)
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

            // Add custom font families if provided
            if (request.FontFamilies != null && request.FontFamilies.Count > 0)
            {
                settings.FontFamilies = request.FontFamilies;
            }

            var htmlContent = HtmlGenerator.Generate(request.Content, settings, request.Variables);
            return Results.Content(htmlContent, "text/html");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error generating HTML: {ex.Message}");
        }
    }
}
