using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Html;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service implementation for HTML generation operations.
/// </summary>
public class HtmlGenerationService(IDocumentRepository documentRepository) : IHtmlGenerationService
{
    private readonly IDocumentRepository _documentRepository = documentRepository;

    public string GenerateFromContent(
        string jsonContent,
        HtmlGenerationSettings? settings = null,
        Dictionary<string, object>? variables = null
    )
    {
        return HtmlGenerator.Generate(jsonContent, settings, variables);
    }

    public async Task<HtmlGenerationResult> GenerateForDocumentAsync(
        Guid documentId,
        GenerateHtmlWithVariablesRequest? request = null,
        CancellationToken cancellationToken = default
    )
    {
        var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
        if (document is null)
            return new HtmlGenerationResult(false, ErrorMessage: "Document not found");

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
                    return new HtmlGenerationResult(
                        false,
                        ValidationErrors: validationResult.Errors
                    );
                }
            }

            // Build settings
            var settings = new HtmlGenerationSettings
            {
                Title = document.Title,
                IncludePrintStyles = request?.IncludePrintStyles ?? true,
                InlineStyles = request?.InlineStyles ?? false,
                IncludeFontLinks = request?.IncludeFontLinks ?? true,
                AutoDetectFonts = request?.AutoDetectFonts ?? true,
            };

            if (request?.FontFamilies is not null && request.FontFamilies.Count > 0)
            {
                settings.FontFamilies = request.FontFamilies;
            }

            var htmlContent = HtmlGenerator.Generate(
                document.Content,
                settings,
                request?.Variables
            );

            return new HtmlGenerationResult(true, htmlContent, $"{document.Title}.html");
        }
        catch (Exception ex)
        {
            return new HtmlGenerationResult(
                false,
                ErrorMessage: $"Error generating HTML: {ex.Message}"
            );
        }
    }
}
