using Microsoft.AspNetCore.Mvc;
using PdfBuilder.Api.Services;

namespace PdfBuilder.Api.Controllers;

[ApiController]
[Route("api")]
public class PdfController : ControllerBase
{
    // POST /api/generate-pdf-preview - Generate PDF from JSON content (for previews without saving)
    [HttpPost("generate-pdf-preview")]
    public IResult GeneratePdfPreview(GeneratePdfRequest request)
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

    // GET /api/test-pdf - Generate simple test PDF
    [HttpGet("test-pdf")]
    public IResult TestPdf()
    {
        var pdfBytes = PdfGenerator.GenerateSimple();
        return Results.File(pdfBytes, "application/pdf", "test.pdf");
    }
}

public record GeneratePdfRequest(string Content);
